-- ============================================================
-- 32 - Clubes: enquetes livres
-- Rode DEPOIS da 31. SQL Editor > New query > cole tudo > Run.
-- Seguro para rodar de novo.
-- ============================================================

create table if not exists public.club_polls (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  question text not null,
  status text not null default 'active',
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.club_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.club_polls(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table if not exists public.club_poll_votes (
  poll_id uuid not null references public.club_polls(id) on delete cascade,
  option_id uuid not null references public.club_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create index if not exists club_polls_club_idx
  on public.club_polls(club_id, status, created_at desc);

create index if not exists club_poll_options_poll_idx
  on public.club_poll_options(poll_id, sort_order);

alter table public.club_polls enable row level security;
alter table public.club_poll_options enable row level security;
alter table public.club_poll_votes enable row level security;

drop policy if exists club_polls_select_member on public.club_polls;
create policy club_polls_select_member on public.club_polls
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_poll_options_select_member on public.club_poll_options;
create policy club_poll_options_select_member on public.club_poll_options
  for select using (
    exists (
      select 1
      from public.club_polls p
      where p.id = poll_id
        and public.is_club_member(p.club_id, auth.uid())
    )
  );

drop policy if exists club_poll_votes_select_member on public.club_poll_votes;
create policy club_poll_votes_select_member on public.club_poll_votes
  for select using (
    exists (
      select 1
      from public.club_polls p
      where p.id = poll_id
        and public.is_club_member(p.club_id, auth.uid())
    )
  );

create or replace function public.create_club_poll(
  p_club uuid,
  p_question text,
  p_options text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  poll_id uuid;
  opt text;
  idx int := 0;
  clean_options text[];
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  clean_options := array(
    select distinct trim(o)
    from unnest(coalesce(p_options, array[]::text[])) o
    where length(trim(o)) >= 1
    limit 8
  );

  if length(trim(coalesce(p_question, ''))) < 3 then
    raise exception 'Pergunta muito curta';
  end if;

  if coalesce(array_length(clean_options, 1), 0) < 2 then
    raise exception 'Crie pelo menos duas opcoes';
  end if;

  insert into public.club_polls (club_id, created_by, question)
  values (p_club, auth.uid(), left(trim(p_question), 180))
  returning id into poll_id;

  foreach opt in array clean_options loop
    idx := idx + 1;
    insert into public.club_poll_options (poll_id, label, sort_order)
    values (poll_id, left(opt, 80), idx);
  end loop;

  return poll_id;
end;
$$;

create or replace function public.vote_club_poll(
  p_poll uuid,
  p_option uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  select club_id into cid
  from public.club_polls
  where id = p_poll
    and status = 'active'
    and (closes_at is null or closes_at > now());

  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  if not exists (
    select 1
    from public.club_poll_options
    where id = p_option
      and poll_id = p_poll
  ) then
    raise exception 'Opcao invalida';
  end if;

  insert into public.club_poll_votes (poll_id, option_id, user_id)
  values (p_poll, p_option, auth.uid())
  on conflict (poll_id, user_id) do update
  set option_id = excluded.option_id,
      created_at = now();
end;
$$;

create or replace function public.close_club_poll(p_poll uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  select club_id into cid
  from public.club_polls
  where id = p_poll;

  if cid is null or not public.can_manage_club(cid, auth.uid()) then
    raise exception 'Sem permissao para encerrar esta enquete';
  end if;

  update public.club_polls
  set status = 'closed'
  where id = p_poll;
end;
$$;

create or replace function public.club_polls_feed(p_club uuid)
returns table (
  id uuid,
  question text,
  status text,
  created_at timestamptz,
  created_by uuid,
  author text,
  my_option uuid,
  total_votes int,
  options jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  return query
    select
      p.id,
      p.question,
      p.status,
      p.created_at,
      p.created_by,
      coalesce(pr.name, '') as author,
      (
        select v.option_id
        from public.club_poll_votes v
        where v.poll_id = p.id
          and v.user_id = auth.uid()
      ) as my_option,
      (
        select count(*)::int
        from public.club_poll_votes v
        where v.poll_id = p.id
      ) as total_votes,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', o.id,
              'label', o.label,
              'votes', (
                select count(*)::int
                from public.club_poll_votes v
                where v.option_id = o.id
              )
            )
            order by o.sort_order
          )
          from public.club_poll_options o
          where o.poll_id = p.id
        ),
        '[]'::jsonb
      ) as options
    from public.club_polls p
    left join public.profiles pr on pr.id = p.created_by
    where p.club_id = p_club
    order by
      case p.status when 'active' then 0 else 1 end,
      p.created_at desc
    limit 20;
end;
$$;


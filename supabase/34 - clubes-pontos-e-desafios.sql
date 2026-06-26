-- ============================================================
-- 34 - Clubes: pontos e desafios semanais
-- Rode DEPOIS da 33. SQL Editor > New query > cole tudo > Run.
-- Seguro para rodar de novo.
-- ============================================================

create table if not exists public.club_points_ledger (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  points int not null,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (club_id, user_id, source_type, source_id)
);

create table if not exists public.club_challenges (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null default '',
  points int not null default 10,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.club_challenge_entries (
  challenge_id uuid not null references public.club_challenges(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  proof_text text not null default '',
  completed_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create index if not exists club_points_ledger_club_idx
  on public.club_points_ledger(club_id, created_at desc);

create index if not exists club_challenges_club_idx
  on public.club_challenges(club_id, status, created_at desc);

alter table public.club_points_ledger enable row level security;
alter table public.club_challenges enable row level security;
alter table public.club_challenge_entries enable row level security;

drop policy if exists club_points_select_member on public.club_points_ledger;
create policy club_points_select_member on public.club_points_ledger
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_challenges_select_member on public.club_challenges;
create policy club_challenges_select_member on public.club_challenges
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_challenge_entries_select_member on public.club_challenge_entries;
create policy club_challenge_entries_select_member on public.club_challenge_entries
  for select using (public.is_club_member(club_id, auth.uid()));

create or replace function public.grant_club_points(
  p_club uuid,
  p_user uuid,
  p_source_type text,
  p_source_id uuid,
  p_points int,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user is null or not public.is_club_member(p_club, p_user) then
    return;
  end if;

  insert into public.club_points_ledger (
    club_id,
    user_id,
    source_type,
    source_id,
    points,
    reason
  )
  values (
    p_club,
    p_user,
    coalesce(nullif(trim(p_source_type), ''), 'manual'),
    p_source_id,
    greatest(0, coalesce(p_points, 0)),
    left(coalesce(p_reason, ''), 160)
  )
  on conflict (club_id, user_id, source_type, source_id) do nothing;
end;
$$;

create or replace function public.create_club_challenge(
  p_club uuid,
  p_title text,
  p_description text,
  p_points int,
  p_ends_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  challenge_id uuid;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  if length(trim(coalesce(p_title, ''))) < 3 then
    raise exception 'Titulo muito curto';
  end if;

  insert into public.club_challenges (
    club_id,
    created_by,
    title,
    description,
    points,
    ends_at
  )
  values (
    p_club,
    auth.uid(),
    left(trim(p_title), 120),
    left(coalesce(p_description, ''), 600),
    least(100, greatest(1, coalesce(p_points, 10))),
    p_ends_at
  )
  returning id into challenge_id;

  return challenge_id;
end;
$$;

create or replace function public.complete_club_challenge(
  p_challenge uuid,
  p_proof_text text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  select id, club_id, points
  into rec
  from public.club_challenges
  where id = p_challenge
    and status = 'active'
    and (ends_at is null or ends_at > now());

  if rec.id is null or not public.is_club_member(rec.club_id, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  insert into public.club_challenge_entries (
    challenge_id,
    club_id,
    user_id,
    proof_text,
    completed_at
  )
  values (
    rec.id,
    rec.club_id,
    auth.uid(),
    left(coalesce(p_proof_text, ''), 400),
    now()
  )
  on conflict (challenge_id, user_id) do update
  set proof_text = excluded.proof_text,
      completed_at = now();

  perform public.grant_club_points(
    rec.club_id,
    auth.uid(),
    'challenge',
    rec.id,
    rec.points,
    'Desafio concluido'
  );
end;
$$;

create or replace function public.close_club_challenge(p_challenge uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  select club_id into cid
  from public.club_challenges
  where id = p_challenge;

  if cid is null or not public.can_manage_club(cid, auth.uid()) then
    raise exception 'Sem permissao para encerrar este desafio';
  end if;

  update public.club_challenges
  set status = 'closed'
  where id = p_challenge;
end;
$$;

create or replace function public.club_points_ranking(p_club uuid)
returns table (
  user_id uuid,
  name text,
  points int,
  actions int
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
      m.user_id,
      coalesce(p.name, '') as name,
      coalesce(sum(l.points), 0)::int as points,
      count(l.id)::int as actions
    from public.club_members m
    left join public.profiles p on p.id = m.user_id
    left join public.club_points_ledger l on l.club_id = m.club_id and l.user_id = m.user_id
    where m.club_id = p_club
    group by m.user_id, p.name
    order by points desc, actions desc, name asc;
end;
$$;

create or replace function public.club_challenges_feed(p_club uuid)
returns table (
  id uuid,
  title text,
  description text,
  points int,
  status text,
  ends_at timestamptz,
  created_at timestamptz,
  author text,
  completions int,
  completed_by_me boolean,
  my_proof text
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
      c.id,
      c.title,
      c.description,
      c.points,
      c.status,
      c.ends_at,
      c.created_at,
      coalesce(p.name, '') as author,
      (select count(*)::int from public.club_challenge_entries e where e.challenge_id = c.id) as completions,
      exists (
        select 1
        from public.club_challenge_entries e
        where e.challenge_id = c.id
          and e.user_id = auth.uid()
      ) as completed_by_me,
      coalesce((
        select e.proof_text
        from public.club_challenge_entries e
        where e.challenge_id = c.id
          and e.user_id = auth.uid()
      ), '') as my_proof
    from public.club_challenges c
    left join public.profiles p on p.id = c.created_by
    where c.club_id = p_club
    order by
      case c.status when 'active' then 0 else 1 end,
      c.created_at desc
    limit 20;
end;
$$;

-- Pontos automaticos para acoes novas do clube.
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

  perform public.grant_club_points(cid, auth.uid(), 'poll_vote', p_poll, 2, 'Votou em enquete');
end;
$$;

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

  perform public.grant_club_points(p_club, auth.uid(), 'poll_create', poll_id, 5, 'Criou enquete');
  return poll_id;
end;
$$;

create or replace function public.save_club_drama_checkin(
  p_featured uuid,
  p_episode int,
  p_status text default 'watching'
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
  from public.club_featured_dramas
  where id = p_featured
    and status = 'active';

  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  insert into public.club_drama_checkins (
    featured_id,
    club_id,
    user_id,
    current_episode,
    status,
    updated_at
  )
  values (
    p_featured,
    cid,
    auth.uid(),
    greatest(0, coalesce(p_episode, 0)),
    case when p_status in ('watching', 'paused', 'finished', 'dropped') then p_status else 'watching' end,
    now()
  )
  on conflict (featured_id, user_id) do update
  set
    current_episode = excluded.current_episode,
    status = excluded.status,
    updated_at = now();

  perform public.grant_club_points(cid, auth.uid(), 'drama_checkin', p_featured, 3, 'Check-in do dorama');
end;
$$;

create or replace function public.create_club_event(
  p_club uuid,
  p_type text,
  p_title text,
  p_description text,
  p_tmdb bigint,
  p_drama_title text,
  p_starts_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  if length(trim(coalesce(p_title, ''))) < 3 then
    raise exception 'Titulo muito curto';
  end if;

  if p_starts_at is null then
    raise exception 'Data obrigatoria';
  end if;

  insert into public.club_events (
    club_id,
    created_by,
    type,
    title,
    description,
    tmdb_id,
    drama_title,
    starts_at
  )
  values (
    p_club,
    auth.uid(),
    case when p_type in ('watch_party', 'marathon', 'debate', 'vote', 'other') then p_type else 'watch_party' end,
    left(trim(p_title), 120),
    left(coalesce(p_description, ''), 600),
    p_tmdb,
    nullif(trim(coalesce(p_drama_title, '')), ''),
    p_starts_at
  )
  returning id into event_id;

  insert into public.club_event_rsvps (event_id, club_id, user_id, status)
  values (event_id, p_club, auth.uid(), 'going')
  on conflict (event_id, user_id) do nothing;

  perform public.grant_club_points(p_club, auth.uid(), 'event_create', event_id, 5, 'Criou evento');
  return event_id;
end;
$$;

create or replace function public.set_club_event_rsvp(
  p_event uuid,
  p_status text
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
  from public.club_events
  where id = p_event
    and status = 'scheduled';

  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  insert into public.club_event_rsvps (event_id, club_id, user_id, status, updated_at)
  values (
    p_event,
    cid,
    auth.uid(),
    case when p_status in ('going', 'maybe', 'not_going') then p_status else 'going' end,
    now()
  )
  on conflict (event_id, user_id) do update
  set status = excluded.status,
      updated_at = now();

  perform public.grant_club_points(cid, auth.uid(), 'event_rsvp', p_event, 2, 'Confirmou presenca');
end;
$$;


-- ============================================================
-- 31 - Clube: dorama em destaque e check-in de episodio
-- Rode DEPOIS da 30. SQL Editor > New query > cole tudo > Run.
-- Seguro para rodar de novo.
-- ============================================================

create table if not exists public.club_featured_dramas (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  tmdb_id bigint,
  title text not null,
  cover text,
  period_type text not null default 'week',
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.club_drama_checkins (
  featured_id uuid not null references public.club_featured_dramas(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_episode int not null default 0,
  status text not null default 'watching',
  updated_at timestamptz not null default now(),
  primary key (featured_id, user_id)
);

create index if not exists club_featured_dramas_club_idx
  on public.club_featured_dramas(club_id, status, starts_at desc);

create index if not exists club_drama_checkins_club_idx
  on public.club_drama_checkins(club_id, updated_at desc);

alter table public.club_featured_dramas enable row level security;
alter table public.club_drama_checkins enable row level security;

drop policy if exists club_featured_select_member on public.club_featured_dramas;
create policy club_featured_select_member on public.club_featured_dramas
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_checkins_select_member on public.club_drama_checkins;
create policy club_checkins_select_member on public.club_drama_checkins
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_checkins_write_self on public.club_drama_checkins;
create policy club_checkins_write_self on public.club_drama_checkins
  for insert with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

drop policy if exists club_checkins_update_self on public.club_drama_checkins;
create policy club_checkins_update_self on public.club_drama_checkins
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

create or replace function public.can_manage_club(p_club uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.club_members
    where club_id = p_club
      and user_id = p_user
      and role in ('owner', 'moderator')
  )
  or exists (
    select 1
    from public.clubs
    where id = p_club
      and owner_id = p_user
  );
$$;

create or replace function public.set_club_featured_drama(
  p_club uuid,
  p_tmdb bigint,
  p_title text,
  p_cover text,
  p_period_type text default 'week'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not public.can_manage_club(p_club, auth.uid()) then
    raise exception 'Sem permissao para definir o dorama do clube';
  end if;

  update public.club_featured_dramas
  set status = 'archived'
  where club_id = p_club
    and status = 'active';

  insert into public.club_featured_dramas (
    club_id,
    tmdb_id,
    title,
    cover,
    period_type,
    status,
    created_by
  )
  values (
    p_club,
    p_tmdb,
    coalesce(nullif(trim(p_title), ''), 'Dorama do clube'),
    nullif(trim(coalesce(p_cover, '')), ''),
    case when p_period_type in ('week', 'month', 'free') then p_period_type else 'week' end,
    'active',
    auth.uid()
  )
  returning id into new_id;

  return new_id;
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
end;
$$;

create or replace function public.club_current_featured_drama(p_club uuid)
returns table (
  id uuid,
  club_id uuid,
  tmdb_id bigint,
  title text,
  cover text,
  period_type text,
  starts_at timestamptz,
  created_at timestamptz,
  my_episode int,
  my_status text,
  checkins jsonb
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
      f.id,
      f.club_id,
      f.tmdb_id,
      f.title,
      f.cover,
      f.period_type,
      f.starts_at,
      f.created_at,
      coalesce(me.current_episode, 0) as my_episode,
      coalesce(me.status, 'watching') as my_status,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'user_id', ci.user_id,
              'name', coalesce(p.name, ''),
              'nickname', coalesce(p.nickname, ''),
              'current_episode', ci.current_episode,
              'status', ci.status,
              'updated_at', ci.updated_at
            )
            order by ci.current_episode desc, ci.updated_at desc
          )
          from public.club_drama_checkins ci
          left join public.profiles p on p.id = ci.user_id
          where ci.featured_id = f.id
        ),
        '[]'::jsonb
      ) as checkins
    from public.club_featured_dramas f
    left join public.club_drama_checkins me
      on me.featured_id = f.id
     and me.user_id = auth.uid()
    where f.club_id = p_club
      and f.status = 'active'
    order by f.starts_at desc
    limit 1;
end;
$$;


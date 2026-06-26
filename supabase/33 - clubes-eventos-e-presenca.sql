-- ============================================================
-- 33 - Clubes: eventos, maratonas e presenca
-- Rode DEPOIS da 32. SQL Editor > New query > cole tudo > Run.
-- Seguro para rodar de novo.
-- ============================================================

create table if not exists public.club_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  type text not null default 'watch_party',
  title text not null,
  description text not null default '',
  tmdb_id bigint,
  drama_title text,
  starts_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table if not exists public.club_event_rsvps (
  event_id uuid not null references public.club_events(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'going',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists club_events_club_idx
  on public.club_events(club_id, status, starts_at);

create index if not exists club_event_rsvps_event_idx
  on public.club_event_rsvps(event_id, status);

alter table public.club_events enable row level security;
alter table public.club_event_rsvps enable row level security;

drop policy if exists club_events_select_member on public.club_events;
create policy club_events_select_member on public.club_events
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_event_rsvps_select_member on public.club_event_rsvps;
create policy club_event_rsvps_select_member on public.club_event_rsvps
  for select using (public.is_club_member(club_id, auth.uid()));

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
end;
$$;

create or replace function public.cancel_club_event(p_event uuid)
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
  where id = p_event;

  if cid is null or not public.can_manage_club(cid, auth.uid()) then
    raise exception 'Sem permissao para cancelar este evento';
  end if;

  update public.club_events
  set status = 'cancelled'
  where id = p_event;
end;
$$;

create or replace function public.club_events_feed(p_club uuid)
returns table (
  id uuid,
  type text,
  title text,
  description text,
  tmdb_id bigint,
  drama_title text,
  starts_at timestamptz,
  status text,
  created_at timestamptz,
  author text,
  my_status text,
  going int,
  maybe int,
  not_going int
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
      e.id,
      e.type,
      e.title,
      e.description,
      e.tmdb_id,
      e.drama_title,
      e.starts_at,
      e.status,
      e.created_at,
      coalesce(p.name, '') as author,
      coalesce(me.status, '') as my_status,
      (select count(*)::int from public.club_event_rsvps r where r.event_id = e.id and r.status = 'going') as going,
      (select count(*)::int from public.club_event_rsvps r where r.event_id = e.id and r.status = 'maybe') as maybe,
      (select count(*)::int from public.club_event_rsvps r where r.event_id = e.id and r.status = 'not_going') as not_going
    from public.club_events e
    left join public.profiles p on p.id = e.created_by
    left join public.club_event_rsvps me on me.event_id = e.id and me.user_id = auth.uid()
    where e.club_id = p_club
    order by
      case when e.status = 'scheduled' and e.starts_at >= now() then 0 else 1 end,
      e.starts_at asc
    limit 30;
end;
$$;


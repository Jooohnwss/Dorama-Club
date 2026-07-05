-- ============================================================
-- 63 - Clube: Hall da Fama (campeão por dorama)
-- Rode SÓ ESTE arquivo. Idempotente.
-- Guarda, por dorama do clube: MVP (quem mais acompanhou), quem terminou
-- primeiro, quantos terminaram e a média de estrelas.
-- ============================================================

create table if not exists public.club_hall (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  featured_id uuid unique references public.club_featured_dramas(id) on delete cascade,
  tmdb_id bigint,
  title text,
  cover text,
  mvp_user_id uuid,
  mvp_name text,
  first_user_id uuid,
  first_name text,
  finished_count int default 0,
  members_count int default 0,
  avg_stars numeric,
  archived_at timestamptz not null default now()
);

create index if not exists club_hall_club_idx on public.club_hall(club_id, archived_at desc);

alter table public.club_hall enable row level security;

drop policy if exists club_hall_select_member on public.club_hall;
create policy club_hall_select_member on public.club_hall
  for select using (public.is_club_member(club_id, auth.uid()));

-- Calcula e grava o hall de um dorama (idempotente por featured_id).
create or replace function public.archive_club_hall(p_featured uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  v_tmdb bigint;
  v_title text;
  v_cover text;
  v_members int;
  v_first uuid;
  v_first_name text;
  v_mvp uuid;
  v_mvp_name text;
  v_finished int;
  v_avg numeric;
begin
  select club_id, tmdb_id, title, cover into cid, v_tmdb, v_title, v_cover
  from public.club_featured_dramas where id = p_featured;
  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  if exists (select 1 from public.club_hall where featured_id = p_featured) then
    return; -- já registrado
  end if;

  select count(*) into v_members from public.club_members where club_id = cid;

  -- Quem terminou primeiro.
  select ci.user_id into v_first
  from public.club_drama_checkins ci
  where ci.featured_id = p_featured and ci.status = 'finished'
  order by ci.updated_at asc
  limit 1;

  select count(*) into v_finished
  from public.club_drama_checkins ci
  where ci.featured_id = p_featured and ci.status = 'finished';

  -- MVP: quem mais acompanhou (maior episódio; desempate: check-in mais recente).
  select ci.user_id into v_mvp
  from public.club_drama_checkins ci
  where ci.featured_id = p_featured
  order by ci.current_episode desc, ci.updated_at desc
  limit 1;

  select round(avg(r.stars)::numeric, 1) into v_avg
  from public.club_episode_ratings r
  where r.featured_id = p_featured;

  select coalesce(name, '') into v_first_name from public.profiles where id = v_first;
  select coalesce(name, '') into v_mvp_name from public.profiles where id = v_mvp;

  insert into public.club_hall (club_id, featured_id, tmdb_id, title, cover, mvp_user_id, mvp_name, first_user_id, first_name, finished_count, members_count, avg_stars)
  values (cid, p_featured, v_tmdb, v_title, v_cover, v_mvp, v_mvp_name, v_first, v_first_name, coalesce(v_finished, 0), coalesce(v_members, 0), v_avg);
end;
$$;

-- Lista o hall da fama do clube.
create or replace function public.club_hall_list(p_club uuid)
returns setof public.club_hall
language sql
security definer
set search_path = public
stable
as $$
  select * from public.club_hall
  where club_id = p_club and public.is_club_member(p_club, auth.uid())
  order by archived_at desc;
$$;

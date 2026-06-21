-- ============================================================
-- 08 - Social do clube: feed automático, "posso comentar com quem",
--      dorama do mês (votação), ranking e diário compartilhado.
-- Rode DEPOIS do 02 e do 07. Seguro rodar de novo.
-- ============================================================

-- ---------- Feed automático (lê activities com autor) ----------
create or replace function public.club_activities(p_club uuid)
returns table (id uuid, author text, text text, created_at timestamptz)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select a.id, coalesce(p.name, '(sem nome)'), a.text, a.created_at
    from public.activities a
    left join public.profiles p on p.id = a.user_id
    where a.club_id = p_club
    order by a.created_at desc
    limit 50;
end;
$$;

-- ---------- Progresso de cada membro num dorama (posso comentar com quem) ----------
create or replace function public.club_drama_progress(p_club uuid, p_tmdb bigint)
returns table (user_id uuid, name text, current_episode int, episodes int, status text)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select m.user_id, coalesce(p.name, '(sem nome)'),
           coalesce(d.current_episode, 0), coalesce(d.episodes, 0), coalesce(d.status, '')
    from public.club_members m
    left join public.profiles p on p.id = m.user_id
    left join public.dramas d on d.user_id = m.user_id and d.tmdb_id = p_tmdb
    where m.club_id = p_club;
end;
$$;

-- ---------- Dorama do mês: cada membro escolhe 1 por mês ----------
create table if not exists public.club_picks (
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  month text not null,            -- 'YYYY-MM'
  tmdb_id bigint,
  title text not null,
  cover text,
  created_at timestamptz default now(),
  primary key (club_id, user_id, month)
);

alter table public.club_picks enable row level security;

drop policy if exists picks_select on public.club_picks;
create policy picks_select on public.club_picks
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists picks_insert on public.club_picks;
create policy picks_insert on public.club_picks
  for insert with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

drop policy if exists picks_update on public.club_picks;
create policy picks_update on public.club_picks
  for update using (user_id = auth.uid());

drop policy if exists picks_delete on public.club_picks;
create policy picks_delete on public.club_picks
  for delete using (user_id = auth.uid());

-- Apuração do mês atual
create or replace function public.club_picks_tally(p_club uuid)
returns table (tmdb_id bigint, title text, cover text, votos bigint)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select cp.tmdb_id, max(cp.title), max(cp.cover), count(*)
    from public.club_picks cp
    where cp.club_id = p_club and cp.month = to_char(now(), 'YYYY-MM')
    group by cp.tmdb_id
    order by count(*) desc;
end;
$$;

-- ---------- Ranking do clube (por episódios e finalizados) ----------
create or replace function public.club_ranking(p_club uuid)
returns table (name text, episodes bigint, finalizados bigint)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select coalesce(p.name, '(sem nome)'),
           coalesce(sum(d.current_episode), 0),
           coalesce(count(d.id) filter (where d.status = 'finished'), 0)
    from public.club_members m
    left join public.profiles p on p.id = m.user_id
    left join public.dramas d on d.user_id = m.user_id
    where m.club_id = p_club
    group by m.user_id, p.name
    order by 2 desc;
end;
$$;

-- ---------- Diário compartilhado do clube (surtos com shared = true) ----------
create or replace function public.club_shared_surtos(p_club uuid)
returns table (id uuid, user_id uuid, author text, drama_title text, tmdb_id bigint, episode int, body text, created_at timestamptz)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select s.id, s.user_id, coalesce(p.name, '(sem nome)'), d.title, d.tmdb_id, s.episode, s.body, s.created_at
    from public.surtos s
    join public.club_members m on m.user_id = s.user_id and m.club_id = p_club
    left join public.profiles p on p.id = s.user_id
    left join public.dramas d on d.id = s.drama_id
    where s.shared = true
    order by s.created_at desc
    limit 50;
end;
$$;

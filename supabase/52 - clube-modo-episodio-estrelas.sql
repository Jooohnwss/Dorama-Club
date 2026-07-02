-- ============================================================
-- 52 - Clube: Modo Episodio (nota por episodio, 1 a 5 estrelas)
-- Rode DEPOIS da 51. Idempotente.
--
-- Progresso "ja vi o ep N" reaproveita o check-in sequencial que ja existe
-- (club_drama_checkins.current_episode). Aqui so entra a NOVIDADE: nota por
-- episodio. Uma nota por pessoa por episodio, editavel.
-- ============================================================

create table if not exists public.club_episode_ratings (
  featured_id uuid not null references public.club_featured_dramas(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_number int not null check (episode_number >= 1),
  stars int not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (featured_id, user_id, episode_number)
);

create index if not exists club_episode_ratings_feat_idx
  on public.club_episode_ratings(featured_id, episode_number);

alter table public.club_episode_ratings enable row level security;

drop policy if exists club_ep_ratings_select_member on public.club_episode_ratings;
create policy club_ep_ratings_select_member on public.club_episode_ratings
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_ep_ratings_write_self on public.club_episode_ratings;
create policy club_ep_ratings_write_self on public.club_episode_ratings
  for insert with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

drop policy if exists club_ep_ratings_update_self on public.club_episode_ratings;
create policy club_ep_ratings_update_self on public.club_episode_ratings
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

drop policy if exists club_ep_ratings_delete_self on public.club_episode_ratings;
create policy club_ep_ratings_delete_self on public.club_episode_ratings
  for delete using (user_id = auth.uid());

-- Dar/alterar/limpar a nota de um episodio. p_stars = 0 limpa a nota.
create or replace function public.rate_club_episode(
  p_featured uuid,
  p_episode int,
  p_stars int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  select club_id into cid from public.club_featured_dramas where id = p_featured;
  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;
  if p_episode is null or p_episode < 1 then
    raise exception 'Episodio invalido';
  end if;

  if coalesce(p_stars, 0) = 0 then
    delete from public.club_episode_ratings
    where featured_id = p_featured and user_id = auth.uid() and episode_number = p_episode;
    return;
  end if;

  if p_stars < 1 or p_stars > 5 then
    raise exception 'Nota deve ser de 1 a 5';
  end if;

  insert into public.club_episode_ratings (featured_id, club_id, user_id, episode_number, stars, updated_at)
  values (p_featured, cid, auth.uid(), p_episode, p_stars, now())
  on conflict (featured_id, user_id, episode_number)
  do update set stars = excluded.stars, updated_at = now();
end;
$$;

-- Resumo das notas por episodio do dorama em destaque:
-- media do clube, quantos votaram e a minha nota.
create or replace function public.club_episode_ratings(p_featured uuid)
returns table (
  episode_number int,
  avg_stars numeric,
  votes bigint,
  my_stars int
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  cid uuid;
begin
  select club_id into cid from public.club_featured_dramas where id = p_featured;
  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  return query
    select
      r.episode_number,
      round(avg(r.stars)::numeric, 1) as avg_stars,
      count(*)::bigint as votes,
      max(case when r.user_id = auth.uid() then r.stars end)::int as my_stars
    from public.club_episode_ratings r
    where r.featured_id = p_featured
    group by r.episode_number
    order by r.episode_number;
end;
$$;

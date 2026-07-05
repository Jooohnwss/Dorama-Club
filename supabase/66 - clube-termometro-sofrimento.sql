-- ============================================================
-- 66 - Clube: Termômetro de sofrimento (por episódio)
-- Rode SÓ ESTE arquivo. Idempotente.
-- Cada pessoa marca o quanto sofreu no episódio (1 a 5); o app mostra a média
-- do clube por episódio (qual foi o mais sofrido).
-- ============================================================

create table if not exists public.club_episode_feels (
  featured_id uuid not null references public.club_featured_dramas(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_number int not null check (episode_number >= 1),
  feel int not null check (feel between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key (featured_id, user_id, episode_number)
);

create index if not exists club_episode_feels_feat_idx on public.club_episode_feels(featured_id, episode_number);

alter table public.club_episode_feels enable row level security;

drop policy if exists club_feels_select_member on public.club_episode_feels;
create policy club_feels_select_member on public.club_episode_feels
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_feels_write_self on public.club_episode_feels;
create policy club_feels_write_self on public.club_episode_feels
  for insert with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

drop policy if exists club_feels_update_self on public.club_episode_feels;
create policy club_feels_update_self on public.club_episode_feels
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists club_feels_delete_self on public.club_episode_feels;
create policy club_feels_delete_self on public.club_episode_feels
  for delete using (user_id = auth.uid());

-- Marcar/limpar o sofrimento de um episódio (feel = 0 limpa).
create or replace function public.rate_club_episode_feel(p_featured uuid, p_episode int, p_feel int)
returns void
language plpgsql security definer set search_path = public
as $$
declare cid uuid;
begin
  select club_id into cid from public.club_featured_dramas where id = p_featured;
  if cid is null or not public.is_club_member(cid, auth.uid()) then raise exception 'Acesso negado'; end if;
  if p_episode < 1 then raise exception 'Episódio inválido'; end if;
  if coalesce(p_feel, 0) = 0 then
    delete from public.club_episode_feels where featured_id = p_featured and user_id = auth.uid() and episode_number = p_episode;
    return;
  end if;
  if p_feel < 1 or p_feel > 5 then raise exception 'Valor de 1 a 5'; end if;
  insert into public.club_episode_feels (featured_id, club_id, user_id, episode_number, feel, updated_at)
  values (p_featured, cid, auth.uid(), p_episode, p_feel, now())
  on conflict (featured_id, user_id, episode_number) do update set feel = excluded.feel, updated_at = now();
end;
$$;

-- Média de sofrimento por episódio + meu voto.
create or replace function public.club_episode_feels(p_featured uuid)
returns table (episode_number int, avg_feel numeric, votes bigint, my_feel int)
language plpgsql security definer set search_path = public stable
as $$
declare cid uuid;
begin
  select club_id into cid from public.club_featured_dramas where id = p_featured;
  if cid is null or not public.is_club_member(cid, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select f.episode_number,
           round(avg(f.feel)::numeric, 1) as avg_feel,
           count(*)::bigint as votes,
           max(case when f.user_id = auth.uid() then f.feel end)::int as my_feel
    from public.club_episode_feels f
    where f.featured_id = p_featured
    group by f.episode_number
    order by f.episode_number;
end;
$$;

-- ============================================================
-- 11 - Favoritos por categoria + ranking turbinado + compatibilidade
-- Rode DEPOIS do 02 e do 07. Seguro rodar de novo.
-- ============================================================

-- ---------- FAVORITOS ESPECIAIS (vilão favorito, cena, trilha...) ----------
create table if not exists public.favoritos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  value text not null,
  drama_title text,
  created_at timestamptz default now()
);
create index if not exists favoritos_user_idx on public.favoritos(user_id);
alter table public.favoritos enable row level security;

drop policy if exists favoritos_select_own on public.favoritos;
create policy favoritos_select_own on public.favoritos for select using (auth.uid() = user_id);
drop policy if exists favoritos_insert_own on public.favoritos;
create policy favoritos_insert_own on public.favoritos for insert with check (auth.uid() = user_id);
drop policy if exists favoritos_delete_own on public.favoritos;
create policy favoritos_delete_own on public.favoritos for delete using (auth.uid() = user_id);

-- ---------- RANKING do clube com mais categorias ----------
drop function if exists public.club_ranking(uuid);
create function public.club_ranking(p_club uuid)
returns table (name text, episodes bigint, finalizados bigint, choro bigint, drops bigint, casais bigint)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select coalesce(p.name, '(sem nome)'),
           coalesce(sum(d.current_episode), 0),
           coalesce(count(d.id) filter (where d.status = 'finished'), 0),
           coalesce(sum(case when d.cry ~ '^[0-9]+$' then d.cry::int else 0 end), 0),
           coalesce(count(d.id) filter (where d.status = 'dropped'), 0),
           (select count(*) from public.casais cc where cc.user_id = m.user_id)
    from public.club_members m
    left join public.profiles p on p.id = m.user_id
    left join public.dramas d on d.user_id = m.user_id
    where m.club_id = p_club
    group by m.user_id, p.name
    order by 2 desc;
end;
$$;

-- ---------- COMPATIBILIDADE entre doramigas ----------
-- % entre VOCÊ e cada outra membro, pela sobreposição de doramas.
create or replace function public.club_compatibility(p_club uuid)
returns table (name text, comuns bigint, pct int)
language plpgsql security definer set search_path = public stable
as $$
declare me uuid := auth.uid();
declare meus int;
begin
  if not public.is_club_member(p_club, me) then raise exception 'Acesso negado'; end if;
  select count(distinct tmdb_id) into meus from public.dramas where user_id = me and tmdb_id is not null;

  return query
    with outras as (
      select m.user_id, d.tmdb_id
      from public.club_members m
      join public.dramas d on d.user_id = m.user_id and d.tmdb_id is not null
      where m.club_id = p_club and m.user_id <> me
    )
    select coalesce(p.name, '(sem nome)'),
           count(*) filter (where o.tmdb_id in (select tmdb_id from public.dramas where user_id = me and tmdb_id is not null)),
           case when meus = 0 then 0
                else round(100.0 * count(*) filter (where o.tmdb_id in (select tmdb_id from public.dramas where user_id = me and tmdb_id is not null))
                     / greatest(meus, count(distinct o.tmdb_id)))::int end
    from outras o
    left join public.profiles p on p.id = o.user_id
    group by o.user_id, p.name
    order by 3 desc;
end;
$$;

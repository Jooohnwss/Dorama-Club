-- ============================================================
-- 41 - Clube: sugeridos (2 por pessoa) -> votação -> próximo
-- Rode DEPOIS da 37. SQL Editor > New query > cole tudo > Run. Idempotente.
--
-- Fluxo: cada membro sugere ATÉ 2 doramas. Quando todos têm 2, a votação abre.
-- O vencedor (mais votado) entra como "assistindo agora" QUANDO o clube termina
-- o dorama atual (todos marcam "Terminei").
-- ============================================================

-- Limite de 2 sugestões por pessoa na sala de escolha.
create or replace function public.club_list_add(p_club uuid, p_tmdb bigint, p_title text, p_cover text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_count int;
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  select count(*) into v_count from public.club_list where club_id = p_club and added_by = auth.uid();
  if v_count >= 2 then
    raise exception 'Você já sugeriu 2 doramas. Apague um pra sugerir outro.';
  end if;
  insert into public.club_list (club_id, tmdb_id, title, cover, added_by)
  values (p_club, p_tmdb, coalesce(nullif(trim(p_title), ''), 'Dorama'), nullif(trim(coalesce(p_cover, '')), ''), auth.uid())
  on conflict (club_id, tmdb_id) do nothing;
end;
$$;

-- Elege o vencedor (mais votado) e reinicia o ciclo. Sem candidato = não troca.
create or replace function public.club_elect_winner(p_club uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_win record;
begin
  select l.id, l.tmdb_id, l.title, l.cover,
         coalesce(sum(case v.vote
               when 'Quero muito' then 2
               when 'Já vi, mas vejo de novo' then 1
               when 'Tanto faz' then 0
               when 'Não tenho psicológico' then -1
               when 'Não me chama pra sofrer' then -2
               else 0 end), 0) as score,
         count(v.*) as votos
    into v_win
    from public.club_list l
    left join public.club_list_votes v on v.list_id = l.id
   where l.club_id = p_club
   group by l.id, l.tmdb_id, l.title, l.cover
   order by score desc, votos desc, l.created_at asc
   limit 1;

  if v_win.id is null then
    return; -- ninguém sugeriu ainda; mantém o atual (já terminado) até sugerirem
  end if;

  update public.club_featured_dramas set status = 'archived'
   where club_id = p_club and status = 'active';
  insert into public.club_featured_dramas (club_id, tmdb_id, title, cover, period_type, status, created_by)
  values (p_club, v_win.tmdb_id, v_win.title, v_win.cover, 'free', 'active', auth.uid());

  delete from public.club_list where club_id = p_club; -- cascata apaga votos
  update public.clubs set cycle_phase = 'watching', cycle_voting_ends_at = null where id = p_club;
end;
$$;

-- Estado do ciclo + tick (troca quando todos terminam).
-- A função mudou de colunas de retorno (vinha da migração 37), então precisa DROP antes.
drop function if exists public.club_cycle(uuid);
create or replace function public.club_cycle(p_club uuid)
returns table (
  members_count int,
  finished_count int,
  candidates_count int,
  members_with_quota int,  -- quantos membros já sugeriram 2
  my_suggestions int,      -- quantas eu sugeri
  voting_open boolean      -- todos sugeriram 2 -> votação aberta
)
language plpgsql security definer set search_path = public
as $$
declare
  v_members int; v_active uuid; v_finished int; v_cands int; v_quota int; v_mine int;
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;

  select count(*) into v_members from public.club_members where club_id = p_club;
  select f.id into v_active from public.club_featured_dramas f
   where f.club_id = p_club and f.status = 'active' order by f.starts_at desc limit 1;
  select count(*) into v_finished from public.club_drama_checkins
   where club_id = p_club and featured_id = v_active and status = 'finished';

  -- Troca: todos (>=2 membros) terminaram -> elege o vencedor e reinicia.
  if v_members >= 2 and v_active is not null and v_finished >= v_members then
    perform public.club_elect_winner(p_club);
    select f.id into v_active from public.club_featured_dramas f
     where f.club_id = p_club and f.status = 'active' order by f.starts_at desc limit 1;
    select count(*) into v_finished from public.club_drama_checkins
     where club_id = p_club and featured_id = v_active and status = 'finished';
  end if;

  select count(*) into v_cands from public.club_list where club_id = p_club;
  select count(*) into v_quota from (
    select added_by from public.club_list where club_id = p_club group by added_by having count(*) >= 2
  ) q;
  select count(*) into v_mine from public.club_list where club_id = p_club and added_by = auth.uid();

  return query select v_members, v_finished, v_cands, v_quota, v_mine,
    (v_members >= 1 and v_quota >= v_members and v_cands >= 2);
end;
$$;

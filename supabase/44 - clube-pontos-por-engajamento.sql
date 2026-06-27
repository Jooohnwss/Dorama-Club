-- ============================================================
-- 44 - Clube: pontos por ENGAJAMENTO (diferencia o ranking)
-- Rode DEPOIS da 43. SQL Editor > New query > cole tudo > Run. Idempotente.
--
-- Problema: rotinas fixas faziam todo mundo empatar. Agora:
--   🎬 +1 POR EPISÓDIO acompanhado (quem assiste mais, pontua mais)
--   🏁 terminar: +8 pra quem termina PRIMEIRO, +5 pros demais
--   🗳️ votar no próximo +2 · 📅 confirmar presença +2 · criar encontro +5
-- ============================================================

-- Remove os pontos antigos de check-in fixo (serão recalculados por episódio
-- no próximo check-in de cada pessoa).
delete from public.club_points_ledger where source_type = 'drama_checkin';

create or replace function public.save_club_drama_checkin(
  p_featured uuid,
  p_episode int,
  p_status text default 'watching'
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  cid uuid;
  v_status text;
  v_ep int;
  i int;
  v_outros_finished int;
begin
  select club_id into cid from public.club_featured_dramas
   where id = p_featured and status = 'active';
  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  v_status := case when p_status in ('watching', 'paused', 'finished', 'dropped') then p_status else 'watching' end;
  v_ep := greatest(0, coalesce(p_episode, 0));

  insert into public.club_drama_checkins (featured_id, club_id, user_id, current_episode, status, updated_at)
  values (p_featured, cid, auth.uid(), v_ep, v_status, now())
  on conflict (featured_id, user_id) do update
  set current_episode = excluded.current_episode, status = excluded.status, updated_at = now();

  -- +1 por episódio acompanhado (anti-duplicação por episódio via md5 -> uuid).
  i := 1;
  while i <= least(v_ep, 200) loop
    perform public.grant_club_points(cid, auth.uid(), 'episode', md5(p_featured::text || ':' || i)::uuid, 1, 'Episódio acompanhado');
    i := i + 1;
  end loop;

  if v_status = 'finished' then
    select count(*) into v_outros_finished from public.club_drama_checkins
     where featured_id = p_featured and status = 'finished' and user_id <> auth.uid();
    if v_outros_finished = 0 then
      perform public.grant_club_points(cid, auth.uid(), 'finish_first', p_featured, 8, 'Terminou o dorama primeiro!');
    else
      perform public.grant_club_points(cid, auth.uid(), 'drama_finish', p_featured, 5, 'Terminou o dorama');
    end if;
  end if;
end;
$$;

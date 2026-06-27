-- ============================================================
-- 43 - Clube: pontos por rotinas do dorama (terminar + votar próximo)
-- Rode DEPOIS da 41. SQL Editor > New query > cole tudo > Run. Idempotente.
--
-- As "missões" deixam de ser desafios definidos por alguém e passam a ser
-- ROTINAS fixas do dorama, que pontuam sozinhas e reiniciam a cada dorama:
--   🎬 check-in do episódio (+3, já existia)  🏁 terminar o dorama (+10)
--   🗳️ votar no próximo (+2)  📅 confirmar presença num encontro (+2, já existia)
-- ============================================================

-- Check-in + ponto de "terminar o dorama" (uma vez por dorama).
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
begin
  select club_id into cid from public.club_featured_dramas
   where id = p_featured and status = 'active';
  if cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  v_status := case when p_status in ('watching', 'paused', 'finished', 'dropped') then p_status else 'watching' end;

  insert into public.club_drama_checkins (featured_id, club_id, user_id, current_episode, status, updated_at)
  values (p_featured, cid, auth.uid(), greatest(0, coalesce(p_episode, 0)), v_status, now())
  on conflict (featured_id, user_id) do update
  set current_episode = excluded.current_episode, status = excluded.status, updated_at = now();

  perform public.grant_club_points(cid, auth.uid(), 'drama_checkin', p_featured, 3, 'Check-in do dorama');
  if v_status = 'finished' then
    perform public.grant_club_points(cid, auth.uid(), 'drama_finish', p_featured, 10, 'Terminou o dorama');
  end if;
end;
$$;

-- Votar no próximo dorama agora pontua (+2 por candidato votado).
create or replace function public.club_list_vote(p_list uuid, p_vote text)
returns void
language plpgsql security definer set search_path = public
as $$
declare cid uuid;
begin
  select club_id into cid from public.club_list where id = p_list;
  if cid is null or not public.is_club_member(cid, auth.uid()) then raise exception 'Acesso negado'; end if;
  insert into public.club_list_votes (list_id, user_id, vote)
  values (p_list, auth.uid(), p_vote)
  on conflict (list_id, user_id) do update set vote = excluded.vote;
  perform public.grant_club_points(cid, auth.uid(), 'vote_next', p_list, 2, 'Votou no próximo dorama');
end;
$$;

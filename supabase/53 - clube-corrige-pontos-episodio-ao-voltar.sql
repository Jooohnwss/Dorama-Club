-- ============================================================
-- 53 - Clube: corrige pontos por episódio ao REDUZIR o check-in
-- Rode DEPOIS da 44. Idempotente.
--
-- Bug: o check-in dava +1 por episódio até o atual, mas ao VOLTAR (ex.: marcou
-- ep 8 sem querer e corrigiu pro 6) nunca removia os pontos dos eps 7 e 8.
-- Resultado: "ep 6 mas 8 pontos".
--
-- Correção: ao salvar o check-in, apaga os pontos de episódios ACIMA do episódio
-- atual. Mais uma limpeza única do que já ficou torto.
-- ============================================================

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

  -- Voltou o progresso? Remove os pontos de episódios ACIMA do atual (ex.: marcou 8, voltou pro 6).
  delete from public.club_points_ledger
  where club_id = cid
    and user_id = auth.uid()
    and source_type = 'episode'
    and source_id in (
      select md5(p_featured::text || ':' || g)::uuid
      from generate_series(v_ep + 1, 200) g
    );

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

-- Limpeza única: apaga pontos de episódio acima do episódio atual de cada pessoa
-- em cada dorama (conserta os "ep 6 mas 8 pontos" que já existem).
delete from public.club_points_ledger l
using public.club_drama_checkins ci
where l.source_type = 'episode'
  and l.user_id = ci.user_id
  and l.club_id = ci.club_id
  and l.source_id in (
    select md5(ci.featured_id::text || ':' || g)::uuid
    from generate_series(ci.current_episode + 1, 200) g
  );

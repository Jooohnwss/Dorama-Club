-- ============================================================
-- 67 - Clube: dropar o dorama atual (ninguém quis ver)
-- Rode SÓ ESTE arquivo. SQL Editor > New query > cole tudo > Run.
-- Seguro rodar de novo.
--
-- Só dono/moderador. O dorama ativo vira status 'dropped':
--   * não entra no Hall da Fama;
--   * os pontos ganhos com ele (episódios, terminar) são removidos;
--   * o clube fica sem dorama oficial, pronto pra fixar outro dos Sugeridos.
-- ============================================================

create or replace function public.club_drop_featured(p_club uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_active uuid;
begin
  if not public.can_manage_club(p_club, auth.uid()) then
    raise exception 'Sem permissão';
  end if;

  select f.id into v_active
  from public.club_featured_dramas f
  where f.club_id = p_club and f.status = 'active'
  order by f.starts_at desc
  limit 1;

  if v_active is null then
    return;
  end if;

  -- Remove os pontos que esse dorama gerou.
  delete from public.club_points_ledger
  where club_id = p_club
    and (
      (source_type in ('finish_first', 'drama_finish') and source_id = v_active)
      or (source_type = 'episode'
          and source_id in (select md5(v_active::text || ':' || g)::uuid from generate_series(1, 200) g))
    );

  update public.club_featured_dramas
  set status = 'dropped'
  where club_id = p_club and status = 'active';
end;
$$;

-- ============================================================
-- 48 - Clube: troca de dorama só quando todos finalizaram
-- Rode DEPOIS da 47. SQL Editor > New query > cole tudo > Run.
-- Seguro rodar de novo.
--
-- Regra: o próximo dorama só pode substituir o atual quando todos os
-- membros do clube marcaram status='finished' no dorama ativo.
-- ============================================================

create or replace function public.club_elect_winner(p_club uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_win record;
  v_active uuid;
  v_members int;
  v_finished int;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  select count(*) into v_members
  from public.club_members
  where club_id = p_club;

  select f.id into v_active
  from public.club_featured_dramas f
  where f.club_id = p_club
    and f.status = 'active'
  order by f.starts_at desc
  limit 1;

  select count(*) into v_finished
  from public.club_drama_checkins
  where club_id = p_club
    and featured_id = v_active
    and status = 'finished';

  if v_members < 2 or v_active is null or v_finished < v_members then
    raise exception 'O clube só pode trocar de dorama quando todos terminarem.';
  end if;

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
    return;
  end if;

  update public.club_featured_dramas
  set status = 'archived'
  where club_id = p_club
    and status = 'active';

  insert into public.club_featured_dramas (club_id, tmdb_id, title, cover, period_type, status, created_by)
  values (p_club, v_win.tmdb_id, v_win.title, v_win.cover, 'free', 'active', auth.uid());

  delete from public.club_list where club_id = p_club;
  update public.clubs set cycle_phase = 'watching', cycle_voting_ends_at = null where id = p_club;
end;
$$;

create or replace function public.club_close_voting(p_club uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.can_manage_club(p_club, auth.uid()) then
    raise exception 'Sem permissão';
  end if;

  perform public.club_elect_winner(p_club);
end;
$$;

-- ============================================================
-- 37 - Clube: ciclo de temporada (assistindo -> votação -> próximo)
-- Rode DEPOIS da 36. SQL Editor > New query > cole tudo > Run.
-- Seguro rodar de novo.
--
-- Fluxo: o clube assiste o dorama oficial. Quando TODOS marcam "terminei"
-- (check-in status='finished'), abre a votação por 10 dias. No fim do prazo
-- (ou quando o dono fecha), o candidato mais votado vira o novo "assistindo".
-- ============================================================

alter table public.clubs
  add column if not exists cycle_phase text not null default 'watching',
  add column if not exists cycle_voting_ends_at timestamptz;

-- Elege o vencedor da votação e reinicia o ciclo (assistindo).
create or replace function public.club_elect_winner(p_club uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_win record;
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
    -- sem candidatos: estende a votação por mais 3 dias
    update public.clubs set cycle_voting_ends_at = now() + interval '3 days' where id = p_club;
    return;
  end if;

  update public.club_featured_dramas set status = 'archived'
   where club_id = p_club and status = 'active';

  insert into public.club_featured_dramas (club_id, tmdb_id, title, cover, period_type, status, created_by)
  values (p_club, v_win.tmdb_id, v_win.title, v_win.cover, 'free', 'active', auth.uid());

  delete from public.club_list where club_id = p_club; -- cascata apaga os votos
  update public.clubs set cycle_phase = 'watching', cycle_voting_ends_at = null where id = p_club;
end;
$$;

-- Estado do ciclo + máquina de estados (faz as transições e devolve o estado).
create or replace function public.club_cycle(p_club uuid)
returns table (
  phase text,
  voting_ends_at timestamptz,
  members_count int,
  finished_count int,
  candidates_count int
)
language plpgsql security definer set search_path = public
as $$
declare
  v_phase text;
  v_ends timestamptz;
  v_members int;
  v_active uuid;
  v_finished int;
  v_cands int;
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;

  select c.cycle_phase, c.cycle_voting_ends_at into v_phase, v_ends from public.clubs c where c.id = p_club;
  v_phase := coalesce(v_phase, 'watching');

  select count(*) into v_members from public.club_members where club_id = p_club;
  select f.id into v_active from public.club_featured_dramas f
   where f.club_id = p_club and f.status = 'active' order by f.starts_at desc limit 1;
  select count(*) into v_finished from public.club_drama_checkins
   where club_id = p_club and featured_id = v_active and status = 'finished';

  -- watching -> voting: todos (>=2 membros) terminaram o dorama atual
  if v_phase = 'watching' and v_members >= 2 and v_active is not null and v_finished >= v_members then
    v_phase := 'voting';
    v_ends := now() + interval '10 days';
    update public.clubs set cycle_phase = v_phase, cycle_voting_ends_at = v_ends where id = p_club;
  end if;

  -- voting -> watching: prazo acabou, elege o vencedor
  if v_phase = 'voting' and v_ends is not null and v_ends <= now() then
    perform public.club_elect_winner(p_club);
    select c.cycle_phase, c.cycle_voting_ends_at into v_phase, v_ends from public.clubs c where c.id = p_club;
    select f.id into v_active from public.club_featured_dramas f
     where f.club_id = p_club and f.status = 'active' order by f.starts_at desc limit 1;
    select count(*) into v_finished from public.club_drama_checkins
     where club_id = p_club and featured_id = v_active and status = 'finished';
  end if;

  select count(*) into v_cands from public.club_list where club_id = p_club;
  return query select v_phase, v_ends, v_members, v_finished, v_cands;
end;
$$;

-- Abrir a votação na mão (dono/moderador): ex.: terminaram e querem já decidir.
create or replace function public.club_open_voting(p_club uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_club(p_club, auth.uid()) then raise exception 'Sem permissão'; end if;
  update public.clubs set cycle_phase = 'voting', cycle_voting_ends_at = now() + interval '10 days' where id = p_club;
end; $$;

-- Fechar a votação agora (dono/moderador): elege o vencedor na hora.
create or replace function public.club_close_voting(p_club uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_club(p_club, auth.uid()) then raise exception 'Sem permissão'; end if;
  perform public.club_elect_winner(p_club);
end; $$;

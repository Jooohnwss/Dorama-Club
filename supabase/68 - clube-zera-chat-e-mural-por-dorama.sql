-- ============================================================
-- 68 - Clube: chat e mural "zerados" a cada dorama novo
-- Rode SÓ ESTE arquivo. SQL Editor > New query > cole tudo > Run.
-- Seguro rodar de novo. NÃO apaga nada: as mensagens e posts antigos
-- continuam guardados no banco, só deixam de aparecer no chat e no mural.
--
-- Regra: o chat e o mural mostram só o que foi escrito a partir do início
-- do dorama atual do clube. Se o clube ainda só teve um dorama (o primeiro),
-- não corta nada.
-- ============================================================

create or replace function public.club_cycle_start(p_club uuid)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select case
    when (select count(*) from public.club_featured_dramas where club_id = p_club) >= 2
    then (select max(starts_at) from public.club_featured_dramas where club_id = p_club)
    else '1970-01-01'::timestamptz
  end;
$$;

-- Mural
drop function if exists public.club_feed(uuid);
create or replace function public.club_feed(p_club uuid)
returns table (
  id uuid,
  user_id uuid,
  author text,
  body text,
  tmdb_id bigint,
  drama_title text,
  spoiler_episode int,
  kind text,
  photo text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_start timestamptz;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;
  v_start := public.club_cycle_start(p_club);
  return query
    select c.id, c.user_id, coalesce(p.name, '(sem nome)'),
           c.body, c.tmdb_id, c.drama_title, c.spoiler_episode,
           coalesce(c.kind, 'geral') as kind, coalesce(c.photo, '') as photo, c.created_at
    from public.comments c
    left join public.profiles p on p.id = c.user_id
    where c.club_id = p_club
      and c.created_at >= v_start
    order by c.created_at desc
    limit 100;
end;
$$;

-- Chat
drop function if exists public.club_chat_feed(uuid);
create or replace function public.club_chat_feed(p_club uuid)
returns table (
  id uuid,
  club_id uuid,
  user_id uuid,
  author text,
  nickname text,
  body text,
  has_spoiler boolean,
  episode_number int,
  reply_to uuid,
  reply_author text,
  reply_body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_start timestamptz;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;
  v_start := public.club_cycle_start(p_club);

  return query
    select
      m.id,
      m.club_id,
      m.user_id,
      coalesce(p.name, '') as author,
      coalesce(p.nickname, '') as nickname,
      m.body,
      coalesce(m.has_spoiler, false) as has_spoiler,
      coalesce(m.episode_number, 0) as episode_number,
      m.reply_to,
      coalesce(rp.name, '') as reply_author,
      coalesce(r.body, '') as reply_body,
      m.created_at
    from public.club_chat_messages m
    left join public.profiles p on p.id = m.user_id
    left join public.club_chat_messages r on r.id = m.reply_to
    left join public.profiles rp on rp.id = r.user_id
    where m.club_id = p_club
      and m.created_at >= v_start
    order by m.created_at desc
    limit 80;
end;
$$;

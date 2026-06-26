-- ============================================================
-- 35 - Clubes: chat simples
-- Rode DEPOIS da 34. SQL Editor > New query > cole tudo > Run.
-- Seguro para rodar de novo.
-- ============================================================

create table if not exists public.club_chat_messages (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  has_spoiler boolean not null default false,
  episode_number int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists club_chat_messages_club_idx
  on public.club_chat_messages(club_id, created_at desc);

alter table public.club_chat_messages enable row level security;

drop policy if exists club_chat_select_member on public.club_chat_messages;
create policy club_chat_select_member on public.club_chat_messages
  for select using (public.is_club_member(club_id, auth.uid()));

create or replace function public.create_club_chat_message(
  p_club uuid,
  p_body text,
  p_has_spoiler boolean default false,
  p_episode_number int default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  msg_id uuid;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  if length(trim(coalesce(p_body, ''))) < 1 then
    raise exception 'Mensagem vazia';
  end if;

  insert into public.club_chat_messages (
    club_id,
    user_id,
    body,
    has_spoiler,
    episode_number
  )
  values (
    p_club,
    auth.uid(),
    left(trim(p_body), 700),
    coalesce(p_has_spoiler, false),
    greatest(0, coalesce(p_episode_number, 0))
  )
  returning id into msg_id;

  -- Depende da migracao 34. Se ela ainda nao foi rodada, esta migracao deve ser aplicada depois dela.
  perform public.grant_club_points(p_club, auth.uid(), 'chat_message', msg_id, 1, 'Mensagem no chat');

  return msg_id;
end;
$$;

create or replace function public.delete_club_chat_message(p_message uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  uid uuid;
begin
  select club_id, user_id into cid, uid
  from public.club_chat_messages
  where id = p_message;

  if cid is null then
    return;
  end if;

  if uid <> auth.uid() and not public.can_manage_club(cid, auth.uid()) then
    raise exception 'Sem permissao para apagar esta mensagem';
  end if;

  delete from public.club_chat_messages
  where id = p_message;
end;
$$;

create or replace function public.club_chat_feed(p_club uuid)
returns table (
  id uuid,
  user_id uuid,
  author text,
  nickname text,
  body text,
  has_spoiler boolean,
  episode_number int,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  return query
    select
      m.id,
      m.user_id,
      coalesce(p.name, '') as author,
      coalesce(p.nickname, '') as nickname,
      m.body,
      m.has_spoiler,
      m.episode_number,
      m.created_at
    from public.club_chat_messages m
    left join public.profiles p on p.id = m.user_id
    where m.club_id = p_club
    order by m.created_at desc
    limit 80;
end;
$$;


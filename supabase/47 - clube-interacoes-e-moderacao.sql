-- ============================================================
-- 47 - Clube: interacoes, tags, corrida e moderacao
-- Rode DEPOIS da 46. SQL Editor > New query > cole tudo > Run.
-- Seguro para rodar de novo.
-- ============================================================

alter table public.clubs
  add column if not exists tags text[] not null default '{}';

alter table public.club_chat_messages
  add column if not exists reply_to uuid references public.club_chat_messages(id) on delete set null;

create index if not exists club_chat_messages_reply_idx
  on public.club_chat_messages(reply_to);

create table if not exists public.club_chat_reactions (
  message_id uuid not null references public.club_chat_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji),
  check (emoji in ('❤️', '😂', '😮'))
);

create table if not exists public.surto_reactions (
  surto_id uuid not null references public.surtos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (surto_id, user_id, emoji),
  check (emoji in ('😱', '😭', '💔', '👀', '😡', '😍', '🙅', '🧽'))
);

alter table public.club_chat_reactions enable row level security;
alter table public.surto_reactions enable row level security;

drop policy if exists club_chat_reactions_select_member on public.club_chat_reactions;
create policy club_chat_reactions_select_member on public.club_chat_reactions
  for select using (
    exists (
      select 1
      from public.club_chat_messages m
      where m.id = message_id
        and public.is_club_member(m.club_id, auth.uid())
    )
  );

drop policy if exists surto_reactions_select_member on public.surto_reactions;
create policy surto_reactions_select_member on public.surto_reactions
  for select using (
    exists (
      select 1
      from public.surtos s
      join public.club_members m on m.user_id = s.user_id
      where s.id = surto_id
        and s.shared = true
        and public.is_club_member(m.club_id, auth.uid())
    )
  );

-- Recria my_clubs trazendo tags para o estado local.
drop function if exists public.my_clubs();
create function public.my_clubs()
returns setof public.clubs
language sql
security definer
set search_path = public
stable
as $$
  select c.*
  from public.clubs c
  join public.club_members m on m.club_id = c.id
  where m.user_id = auth.uid()
  order by c.created_at desc;
$$;

-- Sobre do clube com tags/vibes editaveis.
-- (a versao antiga tinha 3 params; removemos pra nao virar overload ambiguo)
drop function if exists public.update_club_details(uuid, text, text);
create or replace function public.update_club_details(
  p_club uuid,
  p_description text,
  p_rules text,
  p_tags text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_tags text[];
begin
  if not public.can_manage_club(p_club, auth.uid()) then
    raise exception 'Sem permissao para editar este clube';
  end if;

  clean_tags := array(
    select distinct left(trim(t), 24)
    from unnest(coalesce(p_tags, array[]::text[])) t
    where length(trim(t)) > 0
    limit 8
  );

  update public.clubs
  set
    description = left(coalesce(p_description, ''), 280),
    rules = left(coalesce(p_rules, ''), 1200),
    tags = coalesce(clean_tags, '{}')
  where id = p_club;
end;
$$;

-- Moderacao leve: dono promove/rebaixa, dono/mod remove membros comuns.
create or replace function public.manage_club_member(
  p_club uuid,
  p_user uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  target_role text;
begin
  select coalesce(m.role, 'member') into actor_role
  from public.club_members m
  where m.club_id = p_club
    and m.user_id = auth.uid();

  select coalesce(m.role, 'member') into target_role
  from public.club_members m
  where m.club_id = p_club
    and m.user_id = p_user;

  if actor_role is null or target_role is null then
    raise exception 'Acesso negado';
  end if;

  if p_user = auth.uid() then
    raise exception 'Use sair do clube para remover voce';
  end if;

  if p_action in ('promote', 'demote') then
    if actor_role <> 'owner' then
      raise exception 'Somente o dono pode mudar cargos';
    end if;

    if target_role = 'owner' then
      raise exception 'Nao altere o dono do clube por aqui';
    end if;

    update public.club_members
    set role = case when p_action = 'promote' then 'moderator' else 'member' end
    where club_id = p_club
      and user_id = p_user;
    return;
  end if;

  if p_action = 'remove' then
    if actor_role not in ('owner', 'moderator') or target_role = 'owner' then
      raise exception 'Sem permissao para remover este membro';
    end if;

    if actor_role = 'moderator' and target_role = 'moderator' then
      raise exception 'Moderador nao remove outro moderador';
    end if;

    delete from public.club_members
    where club_id = p_club
      and user_id = p_user;
    return;
  end if;

  raise exception 'Acao invalida';
end;
$$;

-- Chat com resposta encadeada.
-- (remove a versao de 4 params pra a chamada nao ficar ambigua com a nova de 5)
drop function if exists public.create_club_chat_message(uuid, text, boolean, int);
create or replace function public.create_club_chat_message(
  p_club uuid,
  p_body text,
  p_has_spoiler boolean default false,
  p_episode_number int default 0,
  p_reply_to uuid default null
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

  if p_reply_to is not null and not exists (
    select 1 from public.club_chat_messages
    where id = p_reply_to and club_id = p_club
  ) then
    raise exception 'Resposta invalida';
  end if;

  if length(trim(coalesce(p_body, ''))) < 1 then
    raise exception 'Mensagem vazia';
  end if;

  insert into public.club_chat_messages (club_id, user_id, body, has_spoiler, episode_number, reply_to)
  values (p_club, auth.uid(), left(trim(p_body), 700), coalesce(p_has_spoiler, false), greatest(0, coalesce(p_episode_number, 0)), p_reply_to)
  returning id into msg_id;

  return msg_id;
end;
$$;

-- club_chat_feed ganhou colunas (reply_*), então muda o retorno -> DROP antes.
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
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

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
    order by m.created_at desc
    limit 80;
end;
$$;

create or replace function public.club_chat_reactions(p_club uuid)
returns table (message_id uuid, emoji text, total bigint, mine boolean)
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
      r.message_id,
      r.emoji,
      count(*)::bigint as total,
      bool_or(r.user_id = auth.uid()) as mine
    from public.club_chat_reactions r
    join public.club_chat_messages m on m.id = r.message_id
    where m.club_id = p_club
    group by r.message_id, r.emoji
    order by total desc;
end;
$$;

create or replace function public.toggle_club_chat_reaction(p_message uuid, p_emoji text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  clean text;
begin
  clean := case when p_emoji in ('❤️', '😂', '😮') then p_emoji else null end;

  select club_id into cid
  from public.club_chat_messages
  where id = p_message;

  if clean is null or cid is null or not public.is_club_member(cid, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  if exists (
    select 1 from public.club_chat_reactions
    where message_id = p_message and user_id = auth.uid() and emoji = clean
  ) then
    delete from public.club_chat_reactions
    where message_id = p_message and user_id = auth.uid() and emoji = clean;
  else
    insert into public.club_chat_reactions (message_id, user_id, emoji)
    values (p_message, auth.uid(), clean);
  end if;
end;
$$;

create or replace function public.club_surto_reactions(p_club uuid)
returns table (surto_id uuid, emoji text, total bigint, mine boolean)
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
      r.surto_id,
      r.emoji,
      count(*)::bigint as total,
      bool_or(r.user_id = auth.uid()) as mine
    from public.surto_reactions r
    join public.surtos s on s.id = r.surto_id
    join public.club_members m on m.user_id = s.user_id and m.club_id = p_club
    where s.shared = true
    group by r.surto_id, r.emoji
    order by total desc;
end;
$$;

create or replace function public.toggle_surto_reaction(p_surto uuid, p_emoji text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  clean text;
begin
  clean := case when p_emoji in ('😱', '😭', '💔', '👀', '😡', '😍', '🙅', '🧽') then p_emoji else null end;

  select m.club_id into cid
  from public.surtos s
  join public.club_members m on m.user_id = s.user_id
  where s.id = p_surto
    and s.shared = true
    and public.is_club_member(m.club_id, auth.uid())
  limit 1;

  if clean is null or cid is null then
    raise exception 'Acesso negado';
  end if;

  if exists (
    select 1 from public.surto_reactions
    where surto_id = p_surto and user_id = auth.uid() and emoji = clean
  ) then
    delete from public.surto_reactions
    where surto_id = p_surto and user_id = auth.uid() and emoji = clean;
  else
    insert into public.surto_reactions (surto_id, user_id, emoji)
    values (p_surto, auth.uid(), clean);
  end if;
end;
$$;

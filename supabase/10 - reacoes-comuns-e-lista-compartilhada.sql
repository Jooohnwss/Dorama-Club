-- ============================================================
-- 10 - Reações no mural, doramas em comum e lista compartilhada do clube
-- Rode DEPOIS do 02 e do 06. Seguro rodar de novo.
-- Tudo acessado por funções SECURITY DEFINER (tabelas com RLS sem políticas =
-- ninguém acessa direto; só pelas funções, que checam ser membro do clube).
-- ============================================================

-- ---------- REAÇÕES no mural ----------
create table if not exists public.comment_reactions (
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  emoji text not null,
  primary key (comment_id, user_id, emoji)
);
alter table public.comment_reactions enable row level security;

create or replace function public.club_reactions(p_club uuid)
returns table (comment_id uuid, emoji text, total bigint, mine boolean)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select r.comment_id, r.emoji, count(*), bool_or(r.user_id = auth.uid())
    from public.comment_reactions r
    join public.comments c on c.id = r.comment_id
    where c.club_id = p_club
    group by r.comment_id, r.emoji;
end;
$$;

create or replace function public.toggle_reaction(p_comment uuid, p_emoji text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.comments c
    join public.club_members m on m.club_id = c.club_id and m.user_id = auth.uid()
    where c.id = p_comment
  ) then
    raise exception 'Acesso negado';
  end if;

  if exists (select 1 from public.comment_reactions where comment_id = p_comment and user_id = auth.uid() and emoji = p_emoji) then
    delete from public.comment_reactions where comment_id = p_comment and user_id = auth.uid() and emoji = p_emoji;
  else
    insert into public.comment_reactions (comment_id, user_id, emoji)
    values (p_comment, auth.uid(), p_emoji) on conflict do nothing;
  end if;
end;
$$;

-- ---------- DORAMAS EM COMUM ----------
create or replace function public.club_dramas(p_club uuid)
returns table (tmdb_id bigint, title text, cover text, membros bigint, finished bigint, wishlist bigint, watching bigint)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select d.tmdb_id, max(d.title), max(d.cover),
           count(distinct d.user_id),
           count(*) filter (where d.status = 'finished'),
           count(*) filter (where d.status = 'wishlist'),
           count(*) filter (where d.status = 'watching')
    from public.dramas d
    join public.club_members m on m.user_id = d.user_id and m.club_id = p_club
    where d.tmdb_id is not null
    group by d.tmdb_id;
end;
$$;

-- ---------- LISTA COMPARTILHADA do clube ----------
create table if not exists public.club_list (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  tmdb_id bigint,
  title text not null,
  cover text,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  unique (club_id, tmdb_id)
);
alter table public.club_list enable row level security;

create table if not exists public.club_list_votes (
  list_id uuid references public.club_list(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  vote text,
  primary key (list_id, user_id)
);
alter table public.club_list_votes enable row level security;

create or replace function public.club_list_add(p_club uuid, p_tmdb bigint, p_title text, p_cover text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  insert into public.club_list (club_id, tmdb_id, title, cover, added_by)
  values (p_club, p_tmdb, p_title, p_cover, auth.uid())
  on conflict (club_id, tmdb_id) do nothing;
end;
$$;

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
end;
$$;

create or replace function public.club_list_remove(p_list uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from public.club_list
  where id = p_list and (added_by = auth.uid() or public.is_admin());
end;
$$;

create or replace function public.club_list_feed(p_club uuid)
returns table (id uuid, tmdb_id bigint, title text, cover text, added_by_name text, my_vote text, votes json)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select l.id, l.tmdb_id, l.title, l.cover,
           (select name from public.profiles where id = l.added_by),
           (select v.vote from public.club_list_votes v where v.list_id = l.id and v.user_id = auth.uid()),
           (select coalesce(json_object_agg(t.vote, t.n), '{}'::json)
              from (select vote, count(*) n from public.club_list_votes where list_id = l.id group by vote) t)
    from public.club_list l
    where l.club_id = p_club
    order by l.created_at desc;
end;
$$;

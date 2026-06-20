-- ============================================================
-- 03 - Área de administradores  (visível só p/ e-mails admin)
-- Rode DEPOIS do 01 e do 02. SQL Editor > New query > cole > Run.
-- Seguro pra rodar de novo.
--
-- Para adicionar/remover admin: edite a lista em is_admin() e rode de novo.
-- ============================================================

-- Quem é admin? Lê o e-mail do token JWT (assinado pelo Supabase, não falsificável).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in (
      'jonatas.w.silva.w@gmail.com',
      'abikeila_2001@outlook.com'
    ),
    false
  );
$$;

-- ---------- Visão geral (números) ----------
create or replace function public.admin_overview()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  return json_build_object(
    'users',      (select count(*) from public.profiles),
    'dramas',     (select count(*) from public.dramas),
    'clubs',      (select count(*) from public.clubs),
    'comments',   (select count(*) from public.comments),
    'activities', (select count(*) from public.activities)
  );
end;
$$;

-- ---------- Lista de usuárias (com e-mail e nº de doramas) ----------
create or replace function public.admin_users()
returns table (id uuid, name text, nickname text, since int, email text, dramas bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  return query
    select p.id, p.name, p.nickname, p.since,
           u.email::text,
           (select count(*) from public.dramas d where d.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

-- ---------- Clubes (todos, com nº de membros) ----------
create or replace function public.admin_clubs()
returns table (id uuid, name text, code text, members bigint, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  return query
    select c.id, c.name, c.code,
           (select count(*) from public.club_members m where m.club_id = c.id),
           c.created_at
    from public.clubs c
    order by c.created_at desc;
end;
$$;

-- ---------- Comentários (todos, para moderação) ----------
create or replace function public.admin_comments()
returns table (id uuid, club text, author text, body text, spoiler_episode int, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  return query
    select cm.id, cl.name, coalesce(p.name, '(sem nome)'),
           cm.body, cm.spoiler_episode, cm.created_at
    from public.comments cm
    left join public.clubs cl on cl.id = cm.club_id
    left join public.profiles p on p.id = cm.user_id
    order by cm.created_at desc;
end;
$$;

-- ---------- Apagar comentário (moderação) ----------
create or replace function public.admin_delete_comment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  delete from public.comments where id = p_id;
end;
$$;

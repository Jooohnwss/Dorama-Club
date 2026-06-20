-- ============================================================
-- 02 - Clube + feed + comentários com trava de spoiler  (Fase B)
-- Rode DEPOIS do 01. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo.
-- ============================================================

-- ---------- CLUBES ----------
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.club_members (
  club_id uuid references public.clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (club_id, user_id)
);

-- ---------- FEED (atividades) ----------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- ---------- COMENTÁRIOS (com trava de spoiler) ----------
-- spoiler_episode = 0  -> sem spoiler (todos veem)
-- spoiler_episode = N  -> só quem já passou do episódio N deve ver (filtro na UI)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id bigint,
  drama_title text,
  body text not null,
  spoiler_episode int not null default 0,
  created_at timestamptz default now()
);

create index if not exists activities_club_idx on public.activities(club_id, created_at desc);
create index if not exists comments_club_idx on public.comments(club_id, created_at desc);

-- ---------- Função anti-recursão: checa se sou membro ----------
-- SECURITY DEFINER ignora o RLS de club_members, evitando recursão nas policies.
create or replace function public.is_club_member(p_club uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.club_members
    where club_id = p_club and user_id = p_user
  );
$$;

-- ---------- RLS ----------
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.activities enable row level security;
alter table public.comments enable row level security;

-- clubs: só membros veem
drop policy if exists clubs_select_member on public.clubs;
create policy clubs_select_member on public.clubs
  for select using (public.is_club_member(id, auth.uid()));

-- club_members: membros veem os co-membros do mesmo clube
drop policy if exists members_select on public.club_members;
create policy members_select on public.club_members
  for select using (public.is_club_member(club_id, auth.uid()));

-- sair do clube (apagar a própria filiação)
drop policy if exists members_delete_self on public.club_members;
create policy members_delete_self on public.club_members
  for delete using (user_id = auth.uid());

-- activities: ler/escrever só no clube de que sou membro
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities
  for insert with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

-- comments: ler/escrever só no clube de que sou membro
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert with check (user_id = auth.uid() and public.is_club_member(club_id, auth.uid()));

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete using (user_id = auth.uid());

-- ---------- Criar clube (gera código e entra como membro) ----------
create or replace function public.create_club(p_name text)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  rec public.clubs;
  tries int := 0;
begin
  loop
    new_code := 'DORAMA-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.clubs where code = new_code);
    tries := tries + 1;
    if tries > 20 then raise exception 'Não consegui gerar código único'; end if;
  end loop;

  insert into public.clubs (name, code, owner_id)
  values (coalesce(nullif(trim(p_name), ''), 'Clube das Doramigas'), new_code, auth.uid())
  returning * into rec;

  insert into public.club_members (club_id, user_id) values (rec.id, auth.uid());
  return rec;
end;
$$;

-- ---------- Entrar no clube por código ----------
create or replace function public.join_club(p_code text)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.clubs;
begin
  select * into rec from public.clubs where upper(code) = upper(trim(p_code));
  if rec.id is null then
    raise exception 'Clube não encontrado com esse código';
  end if;

  insert into public.club_members (club_id, user_id)
  values (rec.id, auth.uid())
  on conflict do nothing;

  return rec;
end;
$$;

-- ---------- Meus clubes (lista para a UI) ----------
create or replace function public.my_clubs()
returns setof public.clubs
language sql
security definer
set search_path = public
stable
as $$
  select c.* from public.clubs c
  join public.club_members m on m.club_id = c.id
  where m.user_id = auth.uid()
  order by c.created_at;
$$;

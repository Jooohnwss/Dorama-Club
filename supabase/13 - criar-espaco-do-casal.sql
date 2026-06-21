-- ============================================================
-- 13 - Espaço do casal ("Nós dois" / Diário do Casal)
-- Rode DEPOIS do 01. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- Segurança (ninguém entra por acidente):
--   * cada casal tem um CÓDIGO único;
--   * no máximo 2 pessoas por casal (validado no join_couple);
--   * cada pessoa só pode estar em UM casal por vez;
--   * só os 2 membros enxergam os dados (RLS via is_couple_member).
-- ============================================================

-- ---------- CASAL ----------
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text,                       -- capa: "Jonatas & Abikeila"
  tagline text,                     -- frase personalizada
  special_date date,                -- data especial (1º date, namoro…)
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.couple_members (
  couple_id uuid references public.couples(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (couple_id, user_id)
);

-- ---------- LISTA DO CASAL (assistindo / queremos ver / já vimos / favoritos) ----------
create table if not exists public.couple_dramas (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  tmdb_id bigint,
  title text not null,
  cover text,
  status text not null default 'wishlist',   -- wishlist | watching | watched | favorite
  current_episode int default 0,
  episodes int default 0,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- DIÁRIO DO CASAL (cada episódio/date vira uma memória) ----------
create table if not exists public.couple_diary (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  tmdb_id bigint,
  drama_title text,
  episode int default 0,
  watched_on date,
  place text,            -- onde assistiram
  snack text,            -- lanche
  mood text,             -- humor do dia
  chosen_by text,        -- quem escolheu
  fav_moment text,       -- momento favorito
  inside_joke text,      -- frase interna
  note_him text,         -- nota dele
  note_her text,         -- nota dela
  who_cried text,        -- quem chorou mais
  who_raged text,        -- quem passou mais raiva
  comment text,          -- comentário livre
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- SOBRE NÓS (preferências do casal: chave/valor) ----------
create table if not exists public.couple_about (
  couple_id uuid not null references public.couples(id) on delete cascade,
  key text not null,         -- ex.: "primeiro_dorama", "dorama_conforto", "lanche_oficial"
  value text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz default now(),
  primary key (couple_id, key)
);

-- ---------- CARTINHAS / MEMÓRIAS (bilhetes do casal) ----------
create table if not exists public.couple_letters (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  kind text default 'memoria',   -- "memoria" | "mensagem" | "lembrar"
  body text not null,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists couple_dramas_idx on public.couple_dramas(couple_id, created_at desc);
create index if not exists couple_diary_idx on public.couple_diary(couple_id, watched_on desc, created_at desc);
create index if not exists couple_letters_idx on public.couple_letters(couple_id, created_at desc);

-- ---------- Função anti-recursão: sou membro deste casal? ----------
create or replace function public.is_couple_member(p_couple uuid, p_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.couple_members
    where couple_id = p_couple and user_id = p_user
  );
$$;

-- ---------- RLS ----------
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.couple_dramas enable row level security;
alter table public.couple_diary enable row level security;
alter table public.couple_about enable row level security;
alter table public.couple_letters enable row level security;

-- couples: só os 2 membros veem; membros podem editar a capa (title/tagline/data)
drop policy if exists couples_select_member on public.couples;
create policy couples_select_member on public.couples
  for select using (public.is_couple_member(id, auth.uid()));

drop policy if exists couples_update_member on public.couples;
create policy couples_update_member on public.couples
  for update using (public.is_couple_member(id, auth.uid()))
  with check (public.is_couple_member(id, auth.uid()));

-- couple_members: vejo o(a) parceiro(a); posso sair (apagar minha filiação)
drop policy if exists couple_members_select on public.couple_members;
create policy couple_members_select on public.couple_members
  for select using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists couple_members_delete_self on public.couple_members;
create policy couple_members_delete_self on public.couple_members
  for delete using (user_id = auth.uid());

-- couple_dramas: ler/escrever/editar/apagar só no meu casal
drop policy if exists couple_dramas_select on public.couple_dramas;
create policy couple_dramas_select on public.couple_dramas
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_dramas_insert on public.couple_dramas;
create policy couple_dramas_insert on public.couple_dramas
  for insert with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_dramas_update on public.couple_dramas;
create policy couple_dramas_update on public.couple_dramas
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_dramas_delete on public.couple_dramas;
create policy couple_dramas_delete on public.couple_dramas
  for delete using (public.is_couple_member(couple_id, auth.uid()));

-- couple_diary
drop policy if exists couple_diary_select on public.couple_diary;
create policy couple_diary_select on public.couple_diary
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_diary_insert on public.couple_diary;
create policy couple_diary_insert on public.couple_diary
  for insert with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_diary_update on public.couple_diary;
create policy couple_diary_update on public.couple_diary
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_diary_delete on public.couple_diary;
create policy couple_diary_delete on public.couple_diary
  for delete using (public.is_couple_member(couple_id, auth.uid()));

-- couple_about
drop policy if exists couple_about_select on public.couple_about;
create policy couple_about_select on public.couple_about
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_about_insert on public.couple_about;
create policy couple_about_insert on public.couple_about
  for insert with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_about_update on public.couple_about;
create policy couple_about_update on public.couple_about
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_about_delete on public.couple_about;
create policy couple_about_delete on public.couple_about
  for delete using (public.is_couple_member(couple_id, auth.uid()));

-- couple_letters: todos do casal leem; só o autor apaga a sua
drop policy if exists couple_letters_select on public.couple_letters;
create policy couple_letters_select on public.couple_letters
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_letters_insert on public.couple_letters;
create policy couple_letters_insert on public.couple_letters
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and author_id = auth.uid());
drop policy if exists couple_letters_delete_own on public.couple_letters;
create policy couple_letters_delete_own on public.couple_letters
  for delete using (author_id = auth.uid());

-- ---------- Em quantos casais já estou? (helper interno) ----------
create or replace function public.couples_i_am_in()
returns int
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int from public.couple_members where user_id = auth.uid();
$$;

-- ---------- Criar espaço do casal (gera código e entra como membro) ----------
create or replace function public.create_couple(p_title text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  rec public.couples;
  tries int := 0;
begin
  if public.couples_i_am_in() > 0 then
    raise exception 'Você já está em um espaço de casal. Saia dele antes de criar outro.';
  end if;

  loop
    new_code := 'CASAL-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.couples where code = new_code);
    tries := tries + 1;
    if tries > 25 then raise exception 'Não consegui gerar um código único'; end if;
  end loop;

  insert into public.couples (code, title, created_by)
  values (new_code, nullif(trim(p_title), ''), auth.uid())
  returning * into rec;

  insert into public.couple_members (couple_id, user_id) values (rec.id, auth.uid());
  return rec;
end;
$$;

-- ---------- Entrar no casal por código (com todas as travas de segurança) ----------
create or replace function public.join_couple(p_code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.couples;
  qtd int;
begin
  if public.couples_i_am_in() > 0 then
    raise exception 'Você já está em um espaço de casal. Saia dele antes de entrar em outro.';
  end if;

  select * into rec from public.couples where upper(code) = upper(trim(p_code));
  if rec.id is null then
    raise exception 'Não achei nenhum casal com esse código. Confira com a sua pessoa.';
  end if;

  -- já sou membro? (não deveria, por causa da trava acima, mas garante idempotência)
  if public.is_couple_member(rec.id, auth.uid()) then
    return rec;
  end if;

  select count(*) into qtd from public.couple_members where couple_id = rec.id;
  if qtd >= 2 then
    raise exception 'Esse espaço de casal já está completo (2 pessoas).';
  end if;

  insert into public.couple_members (couple_id, user_id) values (rec.id, auth.uid());
  return rec;
end;
$$;

-- ---------- Meu casal (ou nada) ----------
create or replace function public.my_couple()
returns public.couples
language sql
security definer
set search_path = public
stable
as $$
  select c.* from public.couples c
  join public.couple_members m on m.couple_id = c.id
  where m.user_id = auth.uid()
  limit 1;
$$;

-- ---------- Membros do casal (com nomes/foto) ----------
create or replace function public.couple_members_list(p_couple uuid)
returns table (user_id uuid, name text, nickname text, photo text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_couple_member(p_couple, auth.uid()) then
    raise exception 'Acesso negado';
  end if;
  return query
    select m.user_id, coalesce(p.name, ''), coalesce(p.nickname, ''), p.photo
    from public.couple_members m
    left join public.profiles p on p.id = m.user_id
    where m.couple_id = p_couple
    order by m.joined_at;
end;
$$;

-- ============================================================
-- 07 - Diário de surtos + Casais que eu shippo (pessoais)
-- Rode DEPOIS do 01. Seguro rodar de novo.
-- ============================================================

-- ---------- DIÁRIO DE SURTOS (anotações por episódio) ----------
create table if not exists public.surtos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drama_id uuid not null references public.dramas(id) on delete cascade,
  episode int default 0,
  body text not null,
  shared boolean default false,
  created_at timestamptz default now()
);

create index if not exists surtos_user_drama_idx on public.surtos(user_id, drama_id);

alter table public.surtos enable row level security;

drop policy if exists surtos_select_own on public.surtos;
create policy surtos_select_own on public.surtos
  for select using (auth.uid() = user_id);

drop policy if exists surtos_insert_own on public.surtos;
create policy surtos_insert_own on public.surtos
  for insert with check (auth.uid() = user_id);

drop policy if exists surtos_delete_own on public.surtos;
create policy surtos_delete_own on public.surtos
  for delete using (auth.uid() = user_id);

-- ---------- CASAIS QUE EU SHIPPO ----------
create table if not exists public.casais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  names text not null,
  category text,
  drama_title text,
  created_at timestamptz default now()
);

create index if not exists casais_user_idx on public.casais(user_id);

alter table public.casais enable row level security;

drop policy if exists casais_select_own on public.casais;
create policy casais_select_own on public.casais
  for select using (auth.uid() = user_id);

drop policy if exists casais_insert_own on public.casais;
create policy casais_insert_own on public.casais
  for insert with check (auth.uid() = user_id);

drop policy if exists casais_delete_own on public.casais;
create policy casais_delete_own on public.casais
  for delete using (auth.uid() = user_id);

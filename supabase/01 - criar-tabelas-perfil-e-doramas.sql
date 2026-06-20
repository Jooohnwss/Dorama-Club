-- ============================================================
-- 01 - Perfil + lista de doramas  (Fase A)
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
-- Pode rodar de novo sem problema (tudo "if not exists" / "or replace").
-- ============================================================

-- ---------- PERFIS ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  nickname text,
  photo text,
  since int,
  type text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all on public.profiles
  for select using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

-- ---------- DORAMAS (lista pessoal) ----------
create table if not exists public.dramas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id bigint,
  title text not null,
  year int,
  episodes int,
  genres text[] default '{}',
  rating numeric,
  cover text,
  synopsis text,
  status text default 'wishlist',
  current_episode int default 0,
  mood text,
  priority text,
  reason text,
  pause_reason text,
  drop_reason text,
  favorite boolean default false,
  comfort boolean default false,
  note text,
  cry text,
  hype text,
  rage text,
  personal_rating text,
  recommend text,
  updated_at timestamptz default now()
);

create index if not exists dramas_user_idx on public.dramas(user_id);

alter table public.dramas enable row level security;

drop policy if exists dramas_select_own on public.dramas;
create policy dramas_select_own on public.dramas
  for select using (auth.uid() = user_id);

drop policy if exists dramas_insert_own on public.dramas;
create policy dramas_insert_own on public.dramas
  for insert with check (auth.uid() = user_id);

drop policy if exists dramas_update_own on public.dramas;
create policy dramas_update_own on public.dramas
  for update using (auth.uid() = user_id);

drop policy if exists dramas_delete_own on public.dramas;
create policy dramas_delete_own on public.dramas
  for delete using (auth.uid() = user_id);

-- ---------- Cria o perfil automaticamente ao registrar ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

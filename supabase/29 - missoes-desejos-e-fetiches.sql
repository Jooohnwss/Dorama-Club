-- ============================================================
-- 29 - Missoes secretas, cofrinho de desejos e tags de fetiche
-- Rode DEPOIS do 28. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- So metadados/texto combinado entre o casal. Midia/conteudo intimo continua
-- fora do app, pelo Telegram.
-- ============================================================

create table if not exists public.couple_secret_missions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  target_user uuid references auth.users(id) on delete set null,
  title text not null,
  kind text default 'mensagem',
  intensity int default 1,
  due text default 'hoje',
  status text default 'criada',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.couple_desires (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  category text default 'mensagem',
  intensity int default 1,
  body text not null,
  reveal_requested_by uuid references auth.users(id) on delete set null,
  revealed boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.couple_fetish_prefs (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  status text not null default 'talvez',
  updated_at timestamptz default now(),
  primary key (couple_id, user_id, tag)
);

create index if not exists couple_secret_missions_idx on public.couple_secret_missions(couple_id, created_at desc);
create index if not exists couple_desires_idx on public.couple_desires(couple_id, created_at desc);
create index if not exists couple_fetish_prefs_idx on public.couple_fetish_prefs(couple_id, tag);

alter table public.couple_secret_missions enable row level security;
alter table public.couple_desires enable row level security;
alter table public.couple_fetish_prefs enable row level security;

drop policy if exists couple_secret_missions_select on public.couple_secret_missions;
create policy couple_secret_missions_select on public.couple_secret_missions
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_secret_missions_insert on public.couple_secret_missions;
create policy couple_secret_missions_insert on public.couple_secret_missions
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and created_by = auth.uid());
drop policy if exists couple_secret_missions_update on public.couple_secret_missions;
create policy couple_secret_missions_update on public.couple_secret_missions
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_secret_missions_delete on public.couple_secret_missions;
create policy couple_secret_missions_delete on public.couple_secret_missions
  for delete using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists couple_desires_select on public.couple_desires;
create policy couple_desires_select on public.couple_desires
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_desires_insert on public.couple_desires;
create policy couple_desires_insert on public.couple_desires
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and created_by = auth.uid());
drop policy if exists couple_desires_update on public.couple_desires;
create policy couple_desires_update on public.couple_desires
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_desires_delete on public.couple_desires;
create policy couple_desires_delete on public.couple_desires
  for delete using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists couple_fetish_prefs_select on public.couple_fetish_prefs;
create policy couple_fetish_prefs_select on public.couple_fetish_prefs
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_fetish_prefs_insert on public.couple_fetish_prefs;
create policy couple_fetish_prefs_insert on public.couple_fetish_prefs
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());
drop policy if exists couple_fetish_prefs_update on public.couple_fetish_prefs;
create policy couple_fetish_prefs_update on public.couple_fetish_prefs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

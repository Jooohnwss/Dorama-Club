-- ============================================================
-- 21 - Planos do casal: wishlist + calendário de encontros
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente). Só metadados (sem mídia). RLS: só os 2.
-- ============================================================

-- Wishlist compartilhada (presentes e experiências).
create table if not exists public.couple_wishlist (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  kind text default 'presente',     -- "presente" | "experiencia"
  wanted_by uuid references auth.users(id) on delete set null,
  done boolean default false,
  created_at timestamptz default now()
);

-- Calendário de encontros virtuais (chamada, filme junto, jogo…).
create table if not exists public.couple_dates (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  kind text default 'chamada',      -- "chamada" | "filme" | "jogo" | "outro"
  when_at date,
  done boolean default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists couple_wishlist_idx on public.couple_wishlist(couple_id, created_at desc);
create index if not exists couple_dates_idx on public.couple_dates(couple_id, when_at);

alter table public.couple_wishlist enable row level security;
alter table public.couple_dates enable row level security;

-- wishlist
drop policy if exists couple_wishlist_select on public.couple_wishlist;
create policy couple_wishlist_select on public.couple_wishlist
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_wishlist_insert on public.couple_wishlist;
create policy couple_wishlist_insert on public.couple_wishlist
  for insert with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_wishlist_update on public.couple_wishlist;
create policy couple_wishlist_update on public.couple_wishlist
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_wishlist_delete on public.couple_wishlist;
create policy couple_wishlist_delete on public.couple_wishlist
  for delete using (public.is_couple_member(couple_id, auth.uid()));

-- dates
drop policy if exists couple_dates_select on public.couple_dates;
create policy couple_dates_select on public.couple_dates
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_dates_insert on public.couple_dates;
create policy couple_dates_insert on public.couple_dates
  for insert with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_dates_update on public.couple_dates;
create policy couple_dates_update on public.couple_dates
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_dates_delete on public.couple_dates;
create policy couple_dates_delete on public.couple_dates
  for delete using (public.is_couple_member(couple_id, auth.uid()));

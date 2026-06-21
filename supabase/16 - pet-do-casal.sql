-- ============================================================
-- 16 - Pet do casal ("Nós dois")
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- Um mascote que mora na aba "Nós dois". A felicidade e os acessórios são
-- DERIVADOS das ações do casal (episódios, memórias, cartinhas, finalizados),
-- então aqui guardamos só o essencial: nome e aparência.
-- ============================================================

create table if not exists public.couple_pet (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  name text,
  species text default '🐶',   -- a "carinha" escolhida (emoji)
  color text default '',        -- vibe/cor opcional
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.couple_pet enable row level security;

drop policy if exists couple_pet_select on public.couple_pet;
create policy couple_pet_select on public.couple_pet
  for select using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists couple_pet_insert on public.couple_pet;
create policy couple_pet_insert on public.couple_pet
  for insert with check (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists couple_pet_update on public.couple_pet;
create policy couple_pet_update on public.couple_pet
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists couple_pet_delete on public.couple_pet;
create policy couple_pet_delete on public.couple_pet
  for delete using (public.is_couple_member(couple_id, auth.uid()));

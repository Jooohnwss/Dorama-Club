-- ============================================================
-- 26 - Modo saudade (Nós 2.0 Fase 5 — namoro a distância)
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente). Só texto/metadados. RLS: só os 2.
--
-- - last_met_date: última vez que se viram -> conta "X dias sem te ver".
-- - couple_reunion_list: "pra quando a gente se ver" (lista de coisas/lugares).
-- - couple_saudade: mandar uma saudade (recadinho curto + quando), sem mídia.
-- ============================================================

-- Última vez que se viram (conta os dias de saudade).
alter table public.couples add column if not exists last_met_date date;

-- Lista "pra quando a gente se ver".
create table if not exists public.couple_reunion_list (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists couple_reunion_idx on public.couple_reunion_list(couple_id);
alter table public.couple_reunion_list enable row level security;

drop policy if exists couple_reunion_select on public.couple_reunion_list;
create policy couple_reunion_select on public.couple_reunion_list
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_reunion_insert on public.couple_reunion_list;
create policy couple_reunion_insert on public.couple_reunion_list
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and created_by = auth.uid());
drop policy if exists couple_reunion_update on public.couple_reunion_list;
create policy couple_reunion_update on public.couple_reunion_list
  for update using (public.is_couple_member(couple_id, auth.uid())) with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_reunion_delete on public.couple_reunion_list;
create policy couple_reunion_delete on public.couple_reunion_list
  for delete using (public.is_couple_member(couple_id, auth.uid()));

-- Saudade (recadinho curto; só texto).
create table if not exists public.couple_saudade (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists couple_saudade_idx on public.couple_saudade(couple_id, created_at desc);
alter table public.couple_saudade enable row level security;

drop policy if exists couple_saudade_select on public.couple_saudade;
create policy couple_saudade_select on public.couple_saudade
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_saudade_insert on public.couple_saudade;
create policy couple_saudade_insert on public.couple_saudade
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());
drop policy if exists couple_saudade_delete on public.couple_saudade;
create policy couple_saudade_delete on public.couple_saudade
  for delete using (public.is_couple_member(couple_id, auth.uid()));

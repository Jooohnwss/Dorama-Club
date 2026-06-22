-- ============================================================
-- 23 - Clima do dia + limite do dia (Nós 2.0 Fase 2)
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente). Só metadados. RLS: só os 2.
--
-- Cada pessoa faz um "check-in" por dia: como está (clima) e, opcionalmente,
-- o limite SÓ DE HOJE (pode estar mais leve que o limite fixo).
-- ============================================================

create table if not exists public.couple_daily_checkins (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  mood text,
  day_limit int,                 -- limite só de hoje (1-6); null = usa o fixo
  created_at timestamptz default now(),
  primary key (couple_id, user_id, day)
);

create index if not exists couple_checkin_idx on public.couple_daily_checkins(couple_id, day);

alter table public.couple_daily_checkins enable row level security;

drop policy if exists couple_checkin_select on public.couple_daily_checkins;
create policy couple_checkin_select on public.couple_daily_checkins
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_checkin_upsert on public.couple_daily_checkins;
create policy couple_checkin_upsert on public.couple_daily_checkins
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());
drop policy if exists couple_checkin_update on public.couple_daily_checkins;
create policy couple_checkin_update on public.couple_daily_checkins
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

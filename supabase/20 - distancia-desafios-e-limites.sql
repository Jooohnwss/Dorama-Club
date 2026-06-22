-- ============================================================
-- 20 - Casal à distância: contagem regressiva, limites/consentimento e desafios
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- Tudo é METADADO (sem mídia): data do encontro, intensidade que cada um
-- aceita, e log de desafios concluídos. RLS: só os 2 membros.
-- ============================================================

-- Contagem regressiva pro próximo encontro presencial.
alter table public.couples add column if not exists next_meet_date date;

-- Limites/consentimento por pessoa (intensidade máxima que aceita: 1=leve, 2=médio, 3=ousado).
create table if not exists public.couple_member_prefs (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  max_intensity int not null default 1,
  updated_at timestamptz default now(),
  primary key (couple_id, user_id)
);

-- Log de desafios (só metadados: qual, intensidade, quem, quando).
create table if not exists public.couple_challenge_log (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  challenge_key text not null,
  intensity int default 1,
  done_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists couple_challenge_idx on public.couple_challenge_log(couple_id, created_at desc);

alter table public.couple_member_prefs enable row level security;
alter table public.couple_challenge_log enable row level security;

-- prefs: os 2 veem; cada um edita só a sua
drop policy if exists couple_prefs_select on public.couple_member_prefs;
create policy couple_prefs_select on public.couple_member_prefs
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_prefs_upsert on public.couple_member_prefs;
create policy couple_prefs_upsert on public.couple_member_prefs
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());
drop policy if exists couple_prefs_update on public.couple_member_prefs;
create policy couple_prefs_update on public.couple_member_prefs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- challenge log: os 2 veem/inserem; apaga quem registrou
drop policy if exists couple_challenge_select on public.couple_challenge_log;
create policy couple_challenge_select on public.couple_challenge_log
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_challenge_insert on public.couple_challenge_log;
create policy couple_challenge_insert on public.couple_challenge_log
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and done_by = auth.uid());
drop policy if exists couple_challenge_delete on public.couple_challenge_log;
create policy couple_challenge_delete on public.couple_challenge_log
  for delete using (public.is_couple_member(couple_id, auth.uid()));

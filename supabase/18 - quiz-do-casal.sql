-- ============================================================
-- 18 - Quiz do casal (compatibilidade semanal)
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- Cada pessoa responde as perguntas da semana (multipla escolha). A resposta
-- do outro so e revelada na UI quando os dois responderam. Bateu = compativel.
-- ============================================================

create table if not exists public.couple_quiz_answers (
  couple_id uuid not null references public.couples(id) on delete cascade,
  week text not null,            -- ex.: "2026-W25"
  q int not null,                -- indice da pergunta no pool
  user_id uuid not null references auth.users(id) on delete cascade,
  answer int not null,           -- indice da opcao escolhida
  created_at timestamptz default now(),
  primary key (couple_id, week, q, user_id)
);

create index if not exists couple_quiz_idx on public.couple_quiz_answers(couple_id, week);

alter table public.couple_quiz_answers enable row level security;

-- Os 2 membros veem as respostas do casal (a "revelacao" e controlada na UI).
drop policy if exists couple_quiz_select on public.couple_quiz_answers;
create policy couple_quiz_select on public.couple_quiz_answers
  for select using (public.is_couple_member(couple_id, auth.uid()));

-- Cada um só insere/edita/apaga a PRÓPRIA resposta.
drop policy if exists couple_quiz_insert on public.couple_quiz_answers;
create policy couple_quiz_insert on public.couple_quiz_answers
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());

drop policy if exists couple_quiz_update on public.couple_quiz_answers;
create policy couple_quiz_update on public.couple_quiz_answers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists couple_quiz_delete on public.couple_quiz_answers;
create policy couple_quiz_delete on public.couple_quiz_answers
  for delete using (user_id = auth.uid());

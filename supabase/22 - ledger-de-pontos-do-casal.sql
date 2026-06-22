-- ============================================================
-- 22 - Ledger de pontos do casal ("Nós 2.0" — a fundação)
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- Extrato de pontos: cada ganho/gasto/perda/estorno é UMA linha.
-- Saldo = SUM(points). Começa em 0 (nada de ponto solto).
-- Anti-duplicação: (couple_id, source_type, source_id) é único — a mesma
-- ação (episódio, memória, desafio, resgate) nunca pontua duas vezes.
-- ============================================================

create table if not exists public.couple_points_ledger (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  points int not null,
  type text not null default 'earned',     -- earned | spent | lost | refunded
  reason text,
  source_type text not null default '',
  source_id text not null default '',
  created_at timestamptz default now()
);

create index if not exists couple_ledger_idx on public.couple_points_ledger(couple_id, created_at desc);
-- Trava anti-duplicação: cada (fonte) gera no máximo uma linha.
create unique index if not exists couple_ledger_uniq on public.couple_points_ledger(couple_id, source_type, source_id);

alter table public.couple_points_ledger enable row level security;

-- Os 2 membros veem o extrato; cada um insere as próprias linhas.
-- (Ledger é imutável: sem update/delete — correção vira nova linha de estorno.)
drop policy if exists couple_ledger_select on public.couple_points_ledger;
create policy couple_ledger_select on public.couple_points_ledger
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_ledger_insert on public.couple_points_ledger;
create policy couple_ledger_insert on public.couple_points_ledger
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());

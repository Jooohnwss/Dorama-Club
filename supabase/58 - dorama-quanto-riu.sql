-- ============================================================
-- 58 - Dorama: métrica "Quanto riu?"
-- Rode DEPOIS da 01. Idempotente.
-- Adiciona a coluna laugh, no mesmo padrão de cry/hype/rage.
-- ============================================================

alter table public.dramas
  add column if not exists laugh text;

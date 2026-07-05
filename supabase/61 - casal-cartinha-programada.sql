-- ============================================================
-- 61 - Casal: cartinha programada (chega numa data)
-- Rode SÓ ESTE arquivo. NÃO re-rode arquivos antigos. Idempotente.
-- Adiciona reveal_at: se no futuro, a cartinha fica "lacrada" até a data.
-- ============================================================

alter table public.couple_letters
  add column if not exists reveal_at timestamptz;

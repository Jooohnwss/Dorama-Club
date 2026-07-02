-- ============================================================
-- 57 - Casal: foto no diário e nas cartinhas
-- Rode DEPOIS da 13. Idempotente.
-- A foto é guardada como data URL (base64) na própria coluna, igual à foto de
-- perfil — não precisa de bucket de Storage.
-- ============================================================

alter table public.couple_diary
  add column if not exists photo text;

alter table public.couple_letters
  add column if not exists photo text;

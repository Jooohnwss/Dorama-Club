-- ============================================================
-- 04 - Adiciona a coluna "semaforo" na tabela dramas
-- (Vale assistir? verde / amarelo / vermelho / partido)
-- Rode DEPOIS do 01. Seguro pra rodar de novo.
-- ============================================================

alter table public.dramas
  add column if not exists semaforo text default '';

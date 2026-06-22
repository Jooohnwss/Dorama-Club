-- ============================================================
-- 28 - Telegram por pessoa (Nós 2.0 Fase 6)
-- Rode DEPOIS do 20. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente). RLS já existe (couple_member_prefs).
--
-- Cada pessoa guarda o PRÓPRIO contato do Telegram (número com DDI ou @usuário).
-- O botão "Abrir conversa" abre o contato da OUTRA pessoa. Fica no banco
-- (privado, só os 2 veem) — nunca no código, que é público.
-- ============================================================

alter table public.couple_member_prefs add column if not exists telegram text;

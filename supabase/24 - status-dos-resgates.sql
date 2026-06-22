-- ============================================================
-- 24 - Status dos resgates de vale (Nós 2.0 Fase 3)
-- Rode DEPOIS do 19. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- O resgate vira um fluxo com aceite: solicitado -> aceito -> cumprido,
-- ou recusado / cancelado (aí os pontos voltam). Recusar nunca pune.
-- ============================================================

alter table public.couple_reward_claims add column if not exists status text default 'solicitado';

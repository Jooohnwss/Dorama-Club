-- ============================================================
-- 15 - Cartinha fixa do casal ("Nós dois")
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- Uma carta sempre visível no topo do espaço do casal (e usada na tela
-- de "modo presente" na primeira visita). Vive na linha couples; os 2
-- membros já podem editar (policy couples_update_member da migração 13).
-- ============================================================

alter table public.couples add column if not exists pinned_letter text;

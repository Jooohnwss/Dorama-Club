-- ============================================================
-- 14 - Tema compartilhado do casal ("Nós dois")
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- O tema do ambiente do casal vive NO casal (não em cada pessoa):
-- quando um muda, vale pros dois. Espelha profiles.tema / profiles.tema_custom.
-- Os 2 membros já podem editar a linha couples (policy couples_update_member
-- criada na migração 13), então não precisa de RPC nova.
-- ============================================================

alter table public.couples add column if not exists tema text;
alter table public.couples add column if not exists tema_custom text;

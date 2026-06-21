-- ============================================================
-- 17 - Tipo de página no diário do casal
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- O diário vira um álbum por TIPO de página: episódio, date, cartinha,
-- surto, momento ou marco. Cada tipo mostra campos diferentes na UI.
-- ============================================================

alter table public.couple_diary add column if not exists kind text default 'episodio';

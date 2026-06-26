-- ============================================================
-- 40 - Perfil: como a pessoa quer ser tratada (gênero)
-- Rode no SQL Editor > New query > cole tudo > Run. Seguro rodar de novo.
--
-- 'ela' (feminino, padrão), 'ele' (masculino) ou 'neutro'. O app usa isso pra
-- não chamar ninguém no gênero errado.
-- ============================================================

alter table public.profiles add column if not exists gender text;

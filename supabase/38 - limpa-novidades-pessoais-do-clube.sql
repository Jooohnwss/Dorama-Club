-- ============================================================
-- 38 - Limpa as "novidades automáticas" antigas (vazamentos pessoais)
-- Rode no SQL Editor > New query > cole tudo > Run. Seguro rodar de novo.
--
-- O feed do clube guardava ações PESSOAIS (humor do dia, adicionar/terminar
-- dorama na lista pessoal). Isso parou de ser registrado no app; aqui apagamos
-- o histórico antigo desses vazamentos. Eventos reais do clube (que começam
-- com emoji: 🎬 🏁 🏆 🗳️ 📅 🎯) são preservados.
-- ============================================================

delete from public.activities
where text ilike '%está no clima%'        -- humor do dia
   or text ilike '%adicionou %'           -- adicionou na lista pessoal
   or text ilike '%começou %'             -- começou a ver (lista pessoal)
   or text like '%terminou %—%';          -- "X terminou Y — frase" (lista pessoal)

-- Se ainda quiser zerar TUDO e começar o feed do clube do zero, descomente:
-- delete from public.activities;

-- ============================================================
-- 39 - Clube: chat ao vivo (habilita Realtime na tabela do chat)
-- Rode no SQL Editor > New query > cole tudo > Run. Seguro rodar de novo.
--
-- Adiciona club_chat_messages à publicação do Realtime pra que novas mensagens
-- cheguem AO VIVO (sem recarregar). A presença (quem está online) é via canal
-- do Realtime, não precisa de tabela.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'club_chat_messages'
  ) then
    alter publication supabase_realtime add table public.club_chat_messages;
  end if;
end $$;

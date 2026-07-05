-- ============================================================
-- 59 - Casal: Realtime no "sobre" (baralho ao vivo)
-- Rode SÓ ESTE arquivo. NÃO re-rode a 13 (ela já foi aplicada no início; e como
-- a 56 mudou a couple_members_list, re-rodar a 13 dá erro de "return type").
-- Idempotente (pode rodar de novo sem problema).
-- Habilita eventos em tempo real na couple_about pra a carta do baralho
-- aparecer na hora pro parceiro. (RLS já protege: cada casal só vê o seu.)
-- ============================================================

do $$
begin
  begin
    alter publication supabase_realtime add table public.couple_about;
  exception
    when duplicate_object then null; -- já estava na publicação
    when undefined_object then
      -- publicação não existe? cria e adiciona.
      create publication supabase_realtime for table public.couple_about;
  end;
end $$;

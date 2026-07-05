-- ============================================================
-- 59 - Casal: Realtime no "sobre" (baralho ao vivo)
-- Rode DEPOIS da 13. Idempotente.
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

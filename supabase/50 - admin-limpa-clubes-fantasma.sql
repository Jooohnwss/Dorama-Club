-- ============================================================
-- 50 - Admin: limpa clubes fantasma (0 membros)
-- Rode DEPOIS da 49 (precisa de is_admin() da 03). Idempotente.
--
-- - Limpeza única: apaga clubes que ficaram com 0 membros (órfãos de
--   quando o "sair" antigo não apagava clube vazio).
-- - admin_delete_club: admin SÓ pode apagar clube fantasma (sem membros).
--   Clube com dono/membros é propriedade da pessoa; nem o admin passa por
--   cima. Pra apagar um clube ativo, o dono usa a aba Sobre > Excluir.
-- ============================================================

-- Limpeza única: qualquer clube sem nenhum membro é fantasma -> apaga.
-- (tabelas filhas têm CASCADE, então some tudo junto)
delete from public.clubs c
where not exists (
  select 1 from public.club_members m where m.club_id = c.id
);

-- Admin só apaga clube fantasma (0 membros). Clube com membros: recusa.
create or replace function public.admin_delete_club(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;

  if exists (select 1 from public.club_members m where m.club_id = p_id) then
    raise exception 'Este clube tem membros. Só o dono pode excluí-lo.';
  end if;

  delete from public.clubs where id = p_id;
end;
$$;

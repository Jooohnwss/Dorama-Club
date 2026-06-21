-- ============================================================
-- 05 - Admin pode excluir qualquer usuária
-- Rode DEPOIS do 03 (precisa da função is_admin()). Seguro rodar de novo.
--
-- Apaga o usuário de auth.users; por cascata (on delete cascade) some também
-- o perfil, os doramas, filiações de clube, comentários e atividades dele.
-- ============================================================

create or replace function public.admin_delete_user(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso negado';
  end if;
  if p_id = auth.uid() then
    raise exception 'Você não pode excluir a si mesma por aqui';
  end if;
  delete from auth.users where id = p_id;
end;
$$;

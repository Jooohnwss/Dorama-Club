-- ============================================================
-- 12 - Tema segue a conta + renomear clube
-- Rode DEPOIS do 01 e do 02. Seguro rodar de novo.
-- ============================================================

-- Tema guardado no perfil (segue a pessoa em qualquer aparelho).
alter table public.profiles add column if not exists tema text;
alter table public.profiles add column if not exists tema_custom text;

-- Renomear o clube (só quem criou ou admin).
create or replace function public.rename_club(p_club uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.clubs where id = p_club and owner_id = auth.uid())
     and not public.is_admin() then
    raise exception 'Só quem criou o clube pode renomear';
  end if;
  update public.clubs set name = coalesce(nullif(trim(p_name), ''), name) where id = p_club;
end;
$$;

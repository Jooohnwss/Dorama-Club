-- ============================================================
-- 56 - Casal: incluir gênero dos membros
-- Rode DEPOIS da 40 (gênero no perfil) e da 13. Idempotente.
-- couple_members_list ganha a coluna gender -> muda o retorno -> DROP antes.
-- ============================================================

drop function if exists public.couple_members_list(uuid);
create or replace function public.couple_members_list(p_couple uuid)
returns table (user_id uuid, name text, nickname text, photo text, gender text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_couple_member(p_couple, auth.uid()) then
    raise exception 'Acesso negado';
  end if;
  return query
    select m.user_id, coalesce(p.name, ''), coalesce(p.nickname, ''), p.photo, coalesce(p.gender, '')
    from public.couple_members m
    left join public.profiles p on p.id = m.user_id
    where m.couple_id = p_couple;
end;
$$;

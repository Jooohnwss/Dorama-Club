-- ============================================================
-- 49 - Clube: sair (com passagem de dono) e excluir
-- Rode no SQL Editor > New query > cole tudo > Run. Idempotente.
--
-- - Sair: qualquer membro sai. Se o DONO sair, o membro mais antigo vira dono;
--   se não sobrar ninguém, o clube é apagado.
-- - Excluir: só o dono. Apaga o clube inteiro (tabelas filhas têm CASCADE).
-- ============================================================

-- Sair do clube, passando o dono pro membro mais antigo se for o caso.
create or replace function public.leave_club(p_club uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_next uuid;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Você não é membro deste clube';
  end if;

  select owner_id into v_owner from public.clubs where id = p_club;

  delete from public.club_members where club_id = p_club and user_id = auth.uid();

  if v_owner = auth.uid() then
    select user_id into v_next
    from public.club_members
    where club_id = p_club
    order by joined_at asc
    limit 1;

    if v_next is null then
      delete from public.clubs where id = p_club;           -- ninguém sobrou
    else
      update public.clubs set owner_id = v_next where id = p_club;
      update public.club_members set role = 'owner' where club_id = p_club and user_id = v_next;
    end if;
  end if;
end;
$$;

-- Excluir o clube inteiro (só o dono).
create or replace function public.delete_club(p_club uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.clubs where id = p_club and owner_id = auth.uid()) then
    raise exception 'Só o dono pode excluir o clube';
  end if;
  delete from public.clubs where id = p_club;
end;
$$;

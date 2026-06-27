-- ============================================================
-- 45 - Clube: trazer a FOTO dos membros (avatar de verdade)
-- Rode no SQL Editor > New query > cole tudo > Run. Idempotente.
--
-- club_members_list passa a devolver também a foto do perfil, pra mostrar o
-- rosto de cada um em vez de só a inicial. Muda o retorno -> precisa DROP antes.
-- ============================================================

drop function if exists public.club_members_list(uuid);
create function public.club_members_list(p_club uuid)
returns table (user_id uuid, name text, nickname text, role text, photo text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;

  return query
    select
      m.user_id,
      coalesce(p.name, ''),
      coalesce(p.nickname, ''),
      coalesce(m.role, 'member'),
      coalesce(p.photo, '')
    from public.club_members m
    left join public.profiles p on p.id = m.user_id
    where m.club_id = p_club
    order by
      case coalesce(m.role, 'member')
        when 'owner' then 1
        when 'moderator' then 2
        else 3
      end,
      m.joined_at;
end;
$$;

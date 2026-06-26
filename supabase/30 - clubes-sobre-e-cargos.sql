-- ============================================================
-- 30 - Clubes: sobre, regras e cargos
-- Rode DEPOIS da 29. SQL Editor > New query > cole tudo > Run.
-- Seguro para rodar de novo.
-- ============================================================

alter table public.clubs
  add column if not exists description text not null default '',
  add column if not exists rules text not null default '';

alter table public.club_members
  add column if not exists role text not null default 'member';

alter table public.club_members
  drop constraint if exists club_members_role_check;

alter table public.club_members
  add constraint club_members_role_check
  check (role in ('owner', 'moderator', 'member'));

update public.club_members m
set role = 'owner'
from public.clubs c
where c.id = m.club_id
  and c.owner_id = m.user_id
  and m.role <> 'owner';

-- Garante que novos clubes ja criem o dono com cargo correto.
create or replace function public.create_club(p_name text)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  rec public.clubs;
  tries int := 0;
begin
  loop
    new_code := 'DORAMA-' || lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.clubs where code = new_code);
    tries := tries + 1;
    if tries > 20 then raise exception 'Nao consegui gerar codigo unico'; end if;
  end loop;

  insert into public.clubs (name, code, owner_id)
  values (coalesce(nullif(trim(p_name), ''), 'Clube das Doramigas'), new_code, auth.uid())
  returning * into rec;

  insert into public.club_members (club_id, user_id, role)
  values (rec.id, auth.uid(), 'owner');

  return rec;
end;
$$;

-- Recria a lista de membros incluindo cargo.
drop function if exists public.club_members_list(uuid);

create function public.club_members_list(p_club uuid)
returns table (user_id uuid, name text, nickname text, role text)
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
      coalesce(m.role, 'member')
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

-- Editar descricao/regras do clube. Nesta primeira versao, so o dono.
create or replace function public.update_club_details(
  p_club uuid,
  p_description text,
  p_rules text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.clubs
    where id = p_club
      and owner_id = auth.uid()
  ) then
    raise exception 'Sem permissao para editar este clube';
  end if;

  update public.clubs
  set
    description = left(coalesce(p_description, ''), 280),
    rules = left(coalesce(p_rules, ''), 1200)
  where id = p_club;
end;
$$;


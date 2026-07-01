-- ============================================================
-- 51 - Admin: admin_users com foto, genero e data de cadastro
-- Rode DEPOIS da 09. Idempotente.
-- O tipo de retorno muda (ganhou colunas) -> DROP antes.
-- ============================================================

drop function if exists public.admin_users();
create or replace function public.admin_users()
returns table (
  id uuid,
  name text,
  nickname text,
  since int,
  email text,
  dramas bigint,
  invited_by_name text,
  invites bigint,
  photo text,
  gender text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  return query
    select
      p.id,
      p.name,
      p.nickname,
      p.since,
      u.email::text,
      (select count(*) from public.dramas d where d.user_id = p.id),
      (select inv.name from public.profiles inv where inv.id = p.invited_by),
      (select count(*) from public.profiles q where q.invited_by = p.id),
      coalesce(p.photo, '') as photo,
      coalesce(p.gender, '') as gender,
      p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

-- ============================================================
-- 09 - Código de convite por pessoa + rastrear quem convidou quem
-- Rode DEPOIS do 01 e do 03. Seguro rodar de novo.
-- ============================================================

-- Cada perfil ganha um código único e guarda quem o convidou.
alter table public.profiles add column if not exists invite_code text;
alter table public.profiles add column if not exists invited_by uuid references auth.users(id) on delete set null;

-- Gera um código curto (6 caracteres).
create or replace function public.gen_invite_code()
returns text
language sql
volatile
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- Dá código a quem ainda não tem (perfis antigos).
update public.profiles set invite_code = public.gen_invite_code() where invite_code is null;

create unique index if not exists profiles_invite_code_idx on public.profiles(invite_code);

-- Ao registrar, já cria o perfil com nome + código de convite.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, invite_code)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), public.gen_invite_code())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Painel admin: passa a mostrar quem convidou e quantas a pessoa convidou.
create or replace function public.admin_users()
returns table (id uuid, name text, nickname text, since int, email text, dramas bigint, invited_by_name text, invites bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  return query
    select p.id, p.name, p.nickname, p.since, u.email::text,
           (select count(*) from public.dramas d where d.user_id = p.id),
           (select inv.name from public.profiles inv where inv.id = p.invited_by),
           (select count(*) from public.profiles q where q.invited_by = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at;
end;
$$;

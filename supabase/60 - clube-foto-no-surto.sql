-- ============================================================
-- 60 - Clube: foto no surto/comentário do mural
-- Rode SÓ ESTE arquivo (depois da 54). Idempotente.
-- Foto guardada como data URL (base64), igual ao casal — sem bucket.
-- club_feed ganha a coluna photo -> muda o retorno -> DROP antes.
-- ============================================================

alter table public.comments
  add column if not exists photo text;

drop function if exists public.club_feed(uuid);
create or replace function public.club_feed(p_club uuid)
returns table (
  id uuid,
  user_id uuid,
  author text,
  body text,
  tmdb_id bigint,
  drama_title text,
  spoiler_episode int,
  kind text,
  photo text,
  created_at timestamptz
)
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
    select c.id, c.user_id, coalesce(p.name, '(sem nome)'),
           c.body, c.tmdb_id, c.drama_title, c.spoiler_episode,
           coalesce(c.kind, 'geral') as kind, coalesce(c.photo, '') as photo, c.created_at
    from public.comments c
    left join public.profiles p on p.id = c.user_id
    where c.club_id = p_club
    order by c.created_at desc
    limit 100;
end;
$$;

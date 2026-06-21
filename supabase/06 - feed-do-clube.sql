-- ============================================================
-- 06 - Feed/mural do clube (comentários com autor)
-- Rode DEPOIS do 02. Seguro rodar de novo.
--
-- Lê os comentários do clube já com o NOME de quem postou. A trava de spoiler
-- é decidida no app, comparando o spoiler_episode com o progresso de quem lê.
-- ============================================================

create or replace function public.club_feed(p_club uuid)
returns table (
  id uuid,
  user_id uuid,
  author text,
  body text,
  tmdb_id bigint,
  drama_title text,
  spoiler_episode int,
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
           c.body, c.tmdb_id, c.drama_title, c.spoiler_episode, c.created_at
    from public.comments c
    left join public.profiles p on p.id = c.user_id
    where c.club_id = p_club
    order by c.created_at desc
    limit 100;
end;
$$;

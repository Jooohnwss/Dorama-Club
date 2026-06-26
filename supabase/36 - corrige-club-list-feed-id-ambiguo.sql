-- ============================================================
-- 36 - Corrige club_list_feed (column reference "id" is ambiguous)
-- Rode no SQL Editor > New query > cole tudo > Run. Seguro rodar de novo.
--
-- A função tinha `where id = l.added_by` num subselect em profiles. Como a
-- função declara uma coluna de saída chamada `id` (RETURNS TABLE), o `id`
-- ficava ambíguo. Agora qualificamos a tabela (profiles p -> p.id).
-- ============================================================

create or replace function public.club_list_feed(p_club uuid)
returns table (id uuid, tmdb_id bigint, title text, cover text, added_by_name text, my_vote text, votes json)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select l.id, l.tmdb_id, l.title, l.cover,
           (select p.name from public.profiles p where p.id = l.added_by),
           (select v.vote from public.club_list_votes v where v.list_id = l.id and v.user_id = auth.uid()),
           (select coalesce(json_object_agg(t.vote, t.n), '{}'::json)
              from (select cv.vote, count(*) n
                      from public.club_list_votes cv
                     where cv.list_id = l.id
                     group by cv.vote) t)
    from public.club_list l
    where l.club_id = p_club
    order by l.created_at desc;
end;
$$;

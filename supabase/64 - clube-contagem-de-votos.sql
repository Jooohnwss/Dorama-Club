-- ============================================================
-- 64 - Clube: quantos votos cada pessoa deu (badge "sempre vota")
-- Rode SÓ ESTE arquivo. Idempotente.
-- ============================================================

create or replace function public.club_voters_tally(p_club uuid)
returns table (user_id uuid, votes int)
language sql
security definer
set search_path = public
stable
as $$
  select v.user_id, count(*)::int as votes
  from public.club_list_votes v
  join public.club_list l on l.id = v.list_id
  where l.club_id = p_club
    and public.is_club_member(p_club, auth.uid())
  group by v.user_id;
$$;

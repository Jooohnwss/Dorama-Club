-- ============================================================
-- 46 - Clube: "última novidade" (alimenta a bolinha de aviso)
-- Rode no SQL Editor > New query > cole tudo > Run. Idempotente.
--
-- Retorna o instante da coisa mais recente que rolou no clube (post no mural,
-- novidade automática, mensagem no chat ou evento criado). O app compara com
-- a última vez que você viu o clube pra acender a bolinha na aba Doramigas.
-- ============================================================

create or replace function public.club_last_news_at(p_club uuid)
returns timestamptz
language sql
security definer
set search_path = public
stable
as $$
  select case when public.is_club_member(p_club, auth.uid()) then
    greatest(
      coalesce((select max(created_at) from public.comments where club_id = p_club), '1970-01-01'::timestamptz),
      coalesce((select max(created_at) from public.activities where club_id = p_club), '1970-01-01'::timestamptz),
      coalesce((select max(created_at) from public.club_chat_messages where club_id = p_club), '1970-01-01'::timestamptz),
      coalesce((select max(created_at) from public.club_events where club_id = p_club), '1970-01-01'::timestamptz)
    )
  else null end;
$$;

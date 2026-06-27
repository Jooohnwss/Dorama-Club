-- ============================================================
-- 42 - Clube: chat NÃO dá ponto (é interação, não competição)
-- Rode DEPOIS da 35. SQL Editor > New query > cole tudo > Run. Idempotente.
-- ============================================================

-- Redefine a função do chat sem conceder pontos.
create or replace function public.create_club_chat_message(
  p_club uuid,
  p_body text,
  p_has_spoiler boolean default false,
  p_episode_number int default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  msg_id uuid;
begin
  if not public.is_club_member(p_club, auth.uid()) then
    raise exception 'Acesso negado';
  end if;
  if length(trim(coalesce(p_body, ''))) < 1 then
    raise exception 'Mensagem vazia';
  end if;

  insert into public.club_chat_messages (club_id, user_id, body, has_spoiler, episode_number)
  values (p_club, auth.uid(), left(trim(p_body), 700), coalesce(p_has_spoiler, false), greatest(0, coalesce(p_episode_number, 0)))
  returning id into msg_id;

  -- (sem pontos: chat é só interação)
  return msg_id;
end;
$$;

-- Apaga os pontos de chat que já tinham sido dados (corrige o ranking).
delete from public.club_points_ledger where source_type = 'chat_message';

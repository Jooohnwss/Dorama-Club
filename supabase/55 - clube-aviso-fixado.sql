-- ============================================================
-- 55 - Clube: aviso fixado no topo
-- Rode DEPOIS da 30 (precisa de can_manage_club). Idempotente.
--
-- Campo pinned_notice em clubs + RPC pra dono/moderador definir/limpar.
-- my_clubs já devolve c.*, então o aviso chega no app sem mais mudanças.
-- ============================================================

alter table public.clubs
  add column if not exists pinned_notice text not null default '';

create or replace function public.set_club_notice(p_club uuid, p_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_club(p_club, auth.uid()) then
    raise exception 'Sem permissão para fixar avisos neste clube';
  end if;
  update public.clubs
     set pinned_notice = left(coalesce(p_text, ''), 280)
   where id = p_club;
end;
$$;

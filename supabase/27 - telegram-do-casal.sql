-- ============================================================
-- 27 - Telegram do casal (Nós 2.0 Fase 6 — parte leve)
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente). SÓ METADADOS. RLS: só os 2.
--
-- O conteúdo íntimo (foto/vídeo/áudio) NUNCA passa pelo app — flui pelo
-- Telegram, fora daqui. O app guarda só: o link do chat de vocês e eventos
-- "Enviei / Recebi / Concluímos" (sem nenhum conteúdo), pra fechar o ciclo.
-- ============================================================

-- Link compartilhado do Telegram do casal (chat ou grupo de vocês).
alter table public.couples add column if not exists telegram_link text;

-- Eventos do Telegram (só metadados: quem, que tipo, quando — sem conteúdo).
create table if not exists public.couple_telegram_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'done',   -- sent | received | done
  note text,                           -- combinado curto opcional (sem conteúdo)
  created_at timestamptz not null default now()
);
create index if not exists couple_tg_events_idx on public.couple_telegram_events(couple_id, created_at desc);
alter table public.couple_telegram_events enable row level security;

drop policy if exists couple_tg_select on public.couple_telegram_events;
create policy couple_tg_select on public.couple_telegram_events
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_tg_insert on public.couple_telegram_events;
create policy couple_tg_insert on public.couple_telegram_events
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and user_id = auth.uid());
drop policy if exists couple_tg_delete on public.couple_telegram_events;
create policy couple_tg_delete on public.couple_telegram_events
  for delete using (public.is_couple_member(couple_id, auth.uid()));

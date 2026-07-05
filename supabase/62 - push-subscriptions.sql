-- ============================================================
-- 62 - Push: inscrições de notificação (app fechado)
-- Rode SÓ ESTE arquivo. Idempotente.
-- Guarda a "assinatura" de push de cada aparelho. A função Edge send-push
-- (service role) lê daqui pra enviar. Cada um gerencia só as suas.
-- ============================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_sub_select_own on public.push_subscriptions;
create policy push_sub_select_own on public.push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists push_sub_insert_own on public.push_subscriptions;
create policy push_sub_insert_own on public.push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists push_sub_delete_own on public.push_subscriptions;
create policy push_sub_delete_own on public.push_subscriptions
  for delete using (user_id = auth.uid());

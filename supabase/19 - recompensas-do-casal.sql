-- ============================================================
-- 19 - Recompensas do casal ("Nós 🔥": loja de vales com pontos)
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente).
--
-- Loja privada do casal: criam vales (com custo em pontos) e resgatam.
-- Visibilidade no app é travada por e-mail + PIN; aqui a RLS garante que
-- só os 2 membros do casal veem/mexem.
-- ============================================================

-- Catálogo de vales criados pelo casal.
create table if not exists public.couple_rewards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  kind text default 'fofo',     -- "fofo" | "picante"
  cost int not null default 10,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Resgates (gasta pontos; o "cost" é fotografado no momento do resgate).
create table if not exists public.couple_reward_claims (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  reward_id uuid references public.couple_rewards(id) on delete set null,
  title text,
  kind text,
  cost int not null default 0,
  claimed_by uuid references auth.users(id) on delete set null,
  used boolean default false,
  created_at timestamptz default now()
);

create index if not exists couple_rewards_idx on public.couple_rewards(couple_id, created_at desc);
create index if not exists couple_reward_claims_idx on public.couple_reward_claims(couple_id, created_at desc);

alter table public.couple_rewards enable row level security;
alter table public.couple_reward_claims enable row level security;

-- couple_rewards: só os 2 membros
drop policy if exists couple_rewards_select on public.couple_rewards;
create policy couple_rewards_select on public.couple_rewards
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_rewards_insert on public.couple_rewards;
create policy couple_rewards_insert on public.couple_rewards
  for insert with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_rewards_delete on public.couple_rewards;
create policy couple_rewards_delete on public.couple_rewards
  for delete using (public.is_couple_member(couple_id, auth.uid()));

-- couple_reward_claims: só os 2 membros
drop policy if exists couple_claims_select on public.couple_reward_claims;
create policy couple_claims_select on public.couple_reward_claims
  for select using (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_claims_insert on public.couple_reward_claims;
create policy couple_claims_insert on public.couple_reward_claims
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and claimed_by = auth.uid());
drop policy if exists couple_claims_update on public.couple_reward_claims;
create policy couple_claims_update on public.couple_reward_claims
  for update using (public.is_couple_member(couple_id, auth.uid()))
  with check (public.is_couple_member(couple_id, auth.uid()));
drop policy if exists couple_claims_delete on public.couple_reward_claims;
create policy couple_claims_delete on public.couple_reward_claims
  for delete using (public.is_couple_member(couple_id, auth.uid()));

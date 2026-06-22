-- ============================================================
-- 25 - Surpresas programadas (Nós 2.0 Fase 4)
-- Rode DEPOIS do 13. SQL Editor > New query > cole tudo > Run.
-- Seguro pra rodar de novo (idempotente). Só texto, sem mídia. RLS: só os 2.
--
-- Um(a) escreve uma surpresa (recadinho/combinado) que só REVELA numa data.
-- Antes da data: aparece "🎁 surpresa guardada, abre em X". Conteúdo fica
-- escondido até o dia. Perfeito pra namoro a distância (saudade + contagem).
-- ============================================================

create table if not exists public.couple_surprises (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text,                         -- rótulo discreto (aparece antes de revelar)
  message text not null,              -- o conteúdo (só revela na data)
  reveal_date date not null,          -- quando abre
  created_at timestamptz not null default now()
);

create index if not exists couple_surprises_idx on public.couple_surprises(couple_id, reveal_date);

alter table public.couple_surprises enable row level security;

drop policy if exists couple_surprises_select on public.couple_surprises;
create policy couple_surprises_select on public.couple_surprises
  for select using (public.is_couple_member(couple_id, auth.uid()));

drop policy if exists couple_surprises_insert on public.couple_surprises;
create policy couple_surprises_insert on public.couple_surprises
  for insert with check (public.is_couple_member(couple_id, auth.uid()) and created_by = auth.uid());

drop policy if exists couple_surprises_delete on public.couple_surprises;
create policy couple_surprises_delete on public.couple_surprises
  for delete using (public.is_couple_member(couple_id, auth.uid()));

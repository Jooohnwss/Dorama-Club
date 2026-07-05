-- ============================================================
-- 65 - Clube: Palpites do dorama (whodunit)
-- Rode SÓ ESTE arquivo. Idempotente.
-- Cada palpite é uma pergunta com opções; todo mundo vota; depois alguém
-- (criador/dono/mod) marca a resposta certa e vê quem acertou.
-- ============================================================

create table if not exists public.club_predictions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  featured_id uuid references public.club_featured_dramas(id) on delete set null,
  question text not null,
  options text[] not null,
  answer int,                    -- null = em aberto; senão índice (1-based) da opção certa
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.club_prediction_votes (
  prediction_id uuid not null references public.club_predictions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  choice int not null check (choice >= 1),
  created_at timestamptz not null default now(),
  primary key (prediction_id, user_id)
);

create index if not exists club_predictions_club_idx on public.club_predictions(club_id, created_at desc);

alter table public.club_predictions enable row level security;
alter table public.club_prediction_votes enable row level security;

drop policy if exists club_predictions_select on public.club_predictions;
create policy club_predictions_select on public.club_predictions
  for select using (public.is_club_member(club_id, auth.uid()));

drop policy if exists club_pred_votes_select on public.club_prediction_votes;
create policy club_pred_votes_select on public.club_prediction_votes
  for select using (
    exists (select 1 from public.club_predictions p
            where p.id = club_prediction_votes.prediction_id
              and public.is_club_member(p.club_id, auth.uid()))
  );

-- Criar palpite.
create or replace function public.create_club_prediction(p_club uuid, p_question text, p_options text[], p_featured uuid default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare mid uuid; clean text[];
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  clean := array(select left(trim(o), 60) from unnest(coalesce(p_options, array[]::text[])) o where length(trim(o)) > 0 limit 6);
  if length(trim(coalesce(p_question, ''))) < 3 then raise exception 'Pergunta muito curta'; end if;
  if array_length(clean, 1) < 2 then raise exception 'Precisa de pelo menos 2 opções'; end if;
  insert into public.club_predictions (club_id, featured_id, question, options, created_by)
  values (p_club, p_featured, left(trim(p_question), 200), clean, auth.uid())
  returning id into mid;
  return mid;
end;
$$;

-- Votar (só enquanto em aberto).
create or replace function public.vote_club_prediction(p_prediction uuid, p_choice int)
returns void
language plpgsql security definer set search_path = public
as $$
declare cid uuid; nopt int; ans int;
begin
  select p.club_id, coalesce(array_length(p.options,1),0), p.answer into cid, nopt, ans
  from public.club_predictions p where p.id = p_prediction;
  if cid is null or not public.is_club_member(cid, auth.uid()) then raise exception 'Acesso negado'; end if;
  if ans is not null then raise exception 'Palpite já encerrado'; end if;
  if p_choice < 1 or p_choice > nopt then raise exception 'Opção inválida'; end if;
  insert into public.club_prediction_votes (prediction_id, user_id, choice)
  values (p_prediction, auth.uid(), p_choice)
  on conflict (prediction_id, user_id) do update set choice = excluded.choice, created_at = now();
end;
$$;

-- Revelar a resposta certa (criador ou dono/mod). p_answer = 0 reabre.
create or replace function public.resolve_club_prediction(p_prediction uuid, p_answer int)
returns void
language plpgsql security definer set search_path = public
as $$
declare cid uuid; creator uuid; nopt int;
begin
  select p.club_id, p.created_by, coalesce(array_length(p.options,1),0) into cid, creator, nopt
  from public.club_predictions p where p.id = p_prediction;
  if cid is null then raise exception 'Palpite não encontrado'; end if;
  if creator <> auth.uid() and not public.can_manage_club(cid, auth.uid()) then
    raise exception 'Só quem criou (ou dono/mod) pode revelar';
  end if;
  if p_answer is null or p_answer = 0 then
    update public.club_predictions set answer = null where id = p_prediction;
  else
    if p_answer < 1 or p_answer > nopt then raise exception 'Opção inválida'; end if;
    update public.club_predictions set answer = p_answer where id = p_prediction;
  end if;
end;
$$;

-- Feed dos palpites (opções, contagem, meu voto, resposta, se acertei).
create or replace function public.club_predictions_feed(p_club uuid)
returns table (
  id uuid, question text, options text[], counts int[], total int,
  my_choice int, answer int, created_by uuid, created_at timestamptz
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not public.is_club_member(p_club, auth.uid()) then raise exception 'Acesso negado'; end if;
  return query
    select
      p.id, p.question, p.options,
      (select array_agg(coalesce(cc.n,0) order by g.i)
         from generate_subscripts(p.options,1) g(i)
         left join (select v.choice, count(*)::int n from public.club_prediction_votes v where v.prediction_id = p.id group by v.choice) cc
                on cc.choice = g.i) as counts,
      (select count(*)::int from public.club_prediction_votes v where v.prediction_id = p.id) as total,
      (select v.choice from public.club_prediction_votes v where v.prediction_id = p.id and v.user_id = auth.uid()) as my_choice,
      p.answer, p.created_by, p.created_at
    from public.club_predictions p
    where p.club_id = p_club
    order by (p.answer is not null), p.created_at desc;
end;
$$;

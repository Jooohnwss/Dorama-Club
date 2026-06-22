# 📌 Pendências do Dorama Club

Coisas que ficaram pra depois — não esquecer. Atualizado em 2026-06-21.

---

## 🔧 Configuração (rápido, mas precisa fazer)

### 1. Rodar a migração 12 no Supabase
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/12 - tema-na-conta-e-renomear-clube.sql` e clicar em **Run**
- Pra quê: faz o **tema seguir a conta** (em qualquer aparelho) e habilita **renomear o clube**
- Sem isso: trocar tema não acompanha a pessoa em outro celular; renomear clube dá erro

### 1b. ~~Rodar a migração 13 no Supabase (espaço do casal)~~ ✅ FEITO
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/13 - criar-espaco-do-casal.sql` e clicar em **Run**
- Pra quê: cria o espaço "Nós dois" (tabelas do casal + segurança). Código único, máx. 2 pessoas, só o casal vê os dados.
- Status: você confirmou que já rodou a migração 13.

### 1c. ~~Rodar a migração 14 no Supabase (tema do casal)~~ ✅ FEITO
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/14 - tema-do-casal.sql` e clicar em **Run**
- Pra quê: deixa o **tema do ambiente "Nós dois" ser compartilhado** — quando um muda, vale pros dois
- Status: você confirmou que já rodou a migração 14.

### 1d. ~~Rodar a migração 15 no Supabase (cartinha fixa)~~ ✅ FEITO
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/15 - cartinha-fixa-do-casal.sql` e clicar em **Run**
- Pra quê: habilita a **cartinha fixa no topo** do casal (e a tela de "modo presente" na 1ª visita dela)
- Status: você confirmou que já rodou a migração 15.

### 1e. Rodar a migração 16 no Supabase (pet do casal)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/16 - pet-do-casal.sql` e clicar em **Run**
- Pra quê: habilita o **mascote do casal** (seção "Nosso pet" no ambiente "Nós dois")
- Sem isso: a seção do pet não consegue adotar/salvar (tabela `couple_pet` não existe) — o resto do casal continua funcionando

### 1f. ~~Rodar a migração 17 no Supabase (tipo de página do diário)~~ ✅ FEITO
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/17 - tipo-de-pagina-do-diario.sql` e clicar em **Run**
- Pra quê: o diário do casal vira **álbum por tipo de página** (episódio/date/cartinha/surto/momento/marco)
- Status: você confirmou que já rodou a migração 17.

### 1g. Rodar a migração 18 no Supabase (quiz do casal)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/18 - quiz-do-casal.sql` e clicar em **Run**
- Pra quê: o **quiz de compatibilidade semanal** (cada um responde 4 perguntas; revela quando os dois respondem)
- Sem isso: o quiz não salva/carrega (tabela `couple_quiz_answers` não existe)

### 1h. ~~Rodar a migração 19 no Supabase (recompensas "Nós 🔥")~~ ✅ FEITO
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/19 - recompensas-do-casal.sql` e clicar em **Run**
- Pra quê: a **loja privada de vales/recompensas** (aba "Nós 🔥", só pra vocês dois)
- Status: você confirmou que já rodou a migração 19. A aba só aparece pros 2 e-mails (hash) + PIN local.

### 1i. Rodar a migração 20 no Supabase (à distância: encontro, limites, desafios)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/20 - distancia-desafios-e-limites.sql` e clicar em **Run**
- Pra quê: **contagem regressiva** do próximo encontro + **limites/consentimento** por pessoa + **desafios** (só metadados)
- Sem isso: salvar a data do encontro, os limites ou concluir desafio dá erro

### 1j. Rodar a migração 21 no Supabase (planos: wishlist + calendário)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/21 - planos-do-casal.sql` e clicar em **Run**
- Pra quê: a aba **Planos** (wishlist de presentes/experiências + calendário de encontros virtuais)
- Sem isso: adicionar item da wishlist ou agendar encontro dá erro

### 1k. Rodar a migração 22 no Supabase (ledger de pontos — Nós 2.0)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/22 - ledger-de-pontos-do-casal.sql` e clicar em **Run**
- Pra quê: o **saldo de pontos** do "Nós 🔥" passa a vir de um **extrato real** (começa em 0, sem duplicar)
- Sem isso: o saldo aparece 0 e nada é registrado (ganhar/gastar pontos dá erro)

### 1l. Rodar a migração 23 no Supabase (clima + limite do dia — Nós 2.0)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/23 - clima-e-limite-do-dia.sql` e clicar em **Run**
- Pra quê: **check-in do clima do dia** + **limite só de hoje** (Fase 2 do Nós 2.0)
- Sem isso: registrar clima/limite do dia dá erro (tabela não existe)

### 1m. Rodar a migração 24 no Supabase (status dos resgates — Nós 2.0 Fase 3)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/24 - status-dos-resgates.sql` e clicar em **Run**
- Pra quê: o resgate de vale vira um **fluxo com aceite** (solicitado → aceito → cumprido, ou recusado/cancelado com os pontos de volta)
- Sem isso: aceitar/recusar/cumprir um vale dá erro (coluna `status` não existe)

### 1n. Rodar a migração 25 no Supabase (surpresas programadas — Nós 2.0 Fase 4)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/25 - surpresas-programadas.sql` e clicar em **Run**
- Pra quê: a seção **🎁 Surpresas** do "Nós 🔥" — escrever um recadinho que só revela numa data
- Sem isso: guardar/abrir surpresa dá erro (tabela `couple_surprises` não existe)

### 1o. Rodar a migração 26 no Supabase (modo saudade — Nós 2.0 Fase 5)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/26 - modo-saudade.sql` e clicar em **Run**
- Pra quê: o **Modo saudade** na aba Planos — dias sem se ver, mandar saudade e "pra quando a gente se ver"
- Sem isso: marcar a última vez que se viram / mandar saudade / lista do reencontro dá erro

### 1p. Rodar a migração 27 no Supabase (Telegram do casal — Nós 2.0 Fase 6)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/27 - telegram-do-casal.sql` e clicar em **Run**
- Pra quê: o **link do Telegram** de vocês + o ciclo "Enviei/Recebi/Concluímos" no 🔥 Nós (só metadados; conteúdo íntimo fica fora do app)
- Sem isso: salvar o link ou marcar evento do Telegram dá erro

### 1q. Rodar a migração 28 no Supabase (Telegram por pessoa)
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/28 - telegram-por-pessoa.sql` e clicar em **Run**
- Pra quê: cada um cadastra o **próprio** Telegram nos Ajustes; o botão abre a conversa com o outro
- Sem isso: salvar o Telegram pessoal dá erro (coluna não existe). **Privado no banco, nunca no código.**

### 2. Configurar o e-mail de "esqueci minha senha"
- Onde: painel do Supabase → **Authentication → URL Configuration**
- O quê:
  - **Site URL** = a URL do app no Vercel (ex.: `https://dorama-club-xxx.vercel.app`)
  - **Redirect URLs** = adicionar a MESMA URL do Vercel **e** `http://127.0.0.1:5173`
- Pra quê: pro link de recuperação de senha trazer a pessoa de volta pro app
- É **1 configuração só** (do projeto), vale **pra todas as usuárias**. Não é por pessoa.
- Sem isso: o botão "Esqueci minha senha" não consegue redirecionar / o e-mail não leva de volta

---

## 🟡 Melhorias opcionais (quando der vontade)

### 3. URL bonita no Vercel
- Trocar o endereço feio (`dorama-club-xxxx.vercel.app`) por um nome fofo
  (ex.: `doramaclub.vercel.app`) no painel do Vercel → Settings → Domains
- Lembrar: se mudar a URL, atualizar também o **Site URL/Redirect** do Supabase (item 2)

### 4. ~~Vários clubes ao mesmo tempo~~ ✅ FEITO
- Agora dá pra estar em vários clubes, trocar entre eles (abas no topo da tela
  Doramigas) e sair de um específico.

---

## 🔵 Marcado como "futuro" no plano original (pode nem fazer)

### 5. Notificações push (avisar no celular)
- Precisa de infra à parte: chaves VAPID + service worker de push + um servidor
  que dispara (Edge Function no Supabase + agendador)
- No iPhone é instável
- Hoje o app já avisa no **feed interno** e tem a **bolinha de novidade** na aba Doramigas
- Só fazer se realmente sentir falta

---

## ✅ Já está pronto (pra referência)
Perfil + foto, listas, busca TMDB, episódios, notas, choro/surto/raiva, semáforo,
motivos, badges, ranking emocional, estatísticas, diário de surtos, casais,
favoritos especiais, humor do dia, sortear com filtros, linha do tempo,
temas (inclusive de qualquer dorama), clube (mural com trava de spoiler, reações,
feed automático, dorama do mês, ranking, doramas em comum, lista compartilhada,
diário compartilhado, compatibilidade %), convite por código (rastreia quem chamou
quem), admin (painel + moderação + excluir conta), trocar/recuperar senha,
tema na conta, onboarding, aviso de novidade.

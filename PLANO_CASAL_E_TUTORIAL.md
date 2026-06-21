# 💕 Plano: Tutorial geral + Área "Nós dois" (Diário do Casal)

> Arquivo de acompanhamento para trabalhar em passos, alternando entre **Claude** e **Codex**.
> Sempre que concluir uma etapa, **atualize o status e os "arquivos alterados"** aqui.
> Última atualização: 2026-06-21.

---

## 🎯 Visão geral

Dois grandes blocos, nesta ordem:

1. **Tutorial/onboarding geral do app** (Etapa 1) — prioridade, feito primeiro.
2. **Área "Nós dois" / Diário do Casal** (Etapas 2–5) — espaço íntimo do casal, afetivo, tipo álbum de memórias. É a parte emocionalmente mais importante (o app é um presente).

### Princípios
- Não quebrar nada que já existe.
- **Não mexer em migrações antigas** — sempre criar migração nova com o próximo número.
- Seguir os padrões do projeto (vanilla JS, full re-render via `render()`, estado em módulo, `localStorage`, Supabase + RPC `SECURITY DEFINER` + RLS).
- Pensar **desktop e mobile**.
- A cada etapa estável: `node --check app.js`, `npm run build`, commit claro, push.

---

## 🗺️ Mapa do código (referência rápida pro próximo agente)

- **app.js** (~3600 linhas): SPA inteira. Padrão de **full re-render**: `render()` reconstrói o `innerHTML`.
  - Estado persistente: `state` (via `loadState`/`saveState` em `localStorage`, chave `STORAGE_KEY`).
  - Estado transitório: vars de módulo (`search`, `discover`, `clubTab`, etc.) ~linhas 252–331.
  - `render()` (~675): trata recovery → auth → setup de perfil → shell. Overlays (modais) são concatenados no final do shell e ligados depois (`bindUiModal()`, `bindModal()`).
  - `setState(patch)` (~635): faz merge no `state`, salva e re-renderiza.
  - `sidebarTemplate()` (~821): navegação principal (array `items`).
  - `viewTemplate()` (~848): dicionário view→template.
  - `bindShell()` (~2857): liga TODOS os eventos por `data-*` após cada render. Carga sob demanda no fim (~3038).
  - `icon(name)` (~448) + `ICONS` (~429): ícones SVG inline.
  - `logoMark()` (~454): símbolo dos dois balões.
  - Sistema de modal bonito: `uiModalTemplate`/`bindUiModal`/`confirmar`/`perguntar` (~190–250).
  - `toast(msg)` (~3617).
- **supabase.js**: todas as funções de nuvem (auth, perfil, dramas, clubes, feed, reações, favoritos, compatibilidade…). `cloudOn()` em app.js indica se há nuvem.
- **tmdb.js**: busca/detalhes/descobrir/backdrop/providers.
- **styles.css**: variáveis de tema em `:root` (contrato: `--cor-fundo`, `--cor-superficie`, `--cor-superficie-2`, `--cor-texto`, `--cor-texto-suave`, `--cor-primaria`, `--cor-primaria-texto`, `--cor-secundaria`, `--cor-borda`, `--cor-sombra`, `--fonte-base`).
- **supabase/**: migrações numeradas `01 - ... .sql` … `12 - ... .sql` (todas já rodadas pelo usuário). `supabase/README.md` lista elas.

---

## ✅ Checklist de etapas

### Etapa 1 — Tutorial geral do app  → **FEITO** ✅
- [x] Decidir armazenamento do "tutorial visto" → **localStorage** (`dorama-club-tutorial-visto`). Simples, sem migração. (Pode evoluir pra Supabase depois, sem urgência.)
- [x] `tutorialTemplate()` — overlay com cards/slides curtos.
- [x] Estado `tutorial` + passos `TUTORIAL_STEPS`.
- [x] Abrir automaticamente na 1ª vez (guard `tutorialChecked` p/ não dar loop).
- [x] Botões **Pular** e **Ver depois**, navegação (voltar/próximo + dots).
- [x] Entrada permanente em **Perfil**: "❓ Como usar o app".
- [x] `bindTutorial()` ligado no render.
- [x] CSS responsivo (mobile-first) no styles.css.
- [x] `node --check app.js` + `npm run build` OK.
- [x] Commit + push.

### Etapa 2 — Planejamento seguro do casal (código de convite)  → **FEITO** ✅
- [x] Migração `supabase/13 - criar-espaco-do-casal.sql`: tabelas `couples`, `couple_members`, `couple_dramas`, `couple_diary`, `couple_about`, `couple_letters`, RLS, RPC `create_couple`/`join_couple`/`my_couple`/`couple_members_list`.
- [x] Código único do casal; máximo 2 membros; **1 casal por pessoa**; dados privados (só o casal vê via `is_couple_member`). `leave_couple` = delete da própria filiação (policy `couple_members_delete_self`).
- [x] Funções em `supabase.js`: `createCouple`, `joinCouple`, `myCouple`, `coupleMembersList`, `leaveCouple`, `updateCoupleCapa`. (CRUD de dramas/diário/about/cartinhas será adicionado na Etapa 3.)
- [x] Atualizar `supabase/README.md` (linha 13) e `PENDENTE.md` (item 1b: rodar a migração).
- [x] **AÇÃO DO USUÁRIO**: rodar `supabase/13 - criar-espaco-do-casal.sql` no SQL Editor do Supabase. Confirmado pelo usuário.

> Nota: criei TODAS as tabelas do casal já nesta migração (não só o vínculo) pra você rodar SQL uma vez só. A Etapa 3 será só UI + funções CRUD em `supabase.js`, sem nova migração.

### Etapa 3 — Área "Nós dois"  → **FEITO** ✅
- [x] Capa do casal.
- [x] Criar/entrar por código na UI.
- [x] Membros do casal.
- [x] "Assistindo juntos" com doramas vindos da lista pessoal.
- [x] Diário do casal com memórias por episódio/date.
- [x] Sobre nós (chave/valor afetivo).
- [x] Timeline automática inicial.
- [x] Campos afetivos no diário (quem escolheu, notas dele/dela, quem chorou, quem passou raiva).
- [x] Roleta de date.
- [x] Cartinhas/memórias.
- [x] **Correção de robustez**: `loadCoupleData()` marca `coupleFor` mesmo em erro (evita loop infinito de render — mesma classe do crash "Ah, não!" antigo).
- [x] **Polimento**: aviso no hero quando falta a 2ª pessoa entrar (mostra o código + onde usar).
- [x] Todos os handlers ligados em `bindShell` e conferidos (criar/entrar, capa, +dorama, episódio, memória, sobre nós, cartinha, roleta, copiar código, sair, apagar).

> **Falta só validação manual em 2 contas** (não dá pra automatizar — precisa de 2 logins reais). Checklist de teste abaixo, em "O que ainda falta testar".

### Etapa 4 — Navegação ("Nós dois" como AMBIENTE separado)  → **FEITO (código) / falta rodar SQL 14** ✅
Decisão do usuário: o casal não é mais uma aba espremida — é um **ambiente próprio** ("outro mundo"), com navegação própria e **tema compartilhado**.
- [x] Estado `state.space = "solo" | "couple"` (persistido). Tirado "Nós dois" da barra normal → mobile respira (5 itens).
- [x] **Portal de entrada**: card de destaque na Home (`homeCoupleCard`) + botão no rodapé da sidebar (desktop). No mobile, entrada pelo card (botão da sidebar escondido).
- [x] **Shell do casal**: `coupleSidebarTemplate` (marca + seções + "Voltar pro app") e `coupleSpaceView` (roteador). Seções: **Início · Assistindo · Diário · Sobre nós · Cartinhas · Tema**.
- [x] `coupleTemplate` fatiado em `coupleInicioSection` + seções já existentes + `coupleTemaSection`.
- [x] "Voltar pro app" (`leaveCoupleSpace`) só troca de ambiente; "Sair deste casal" desfaz o vínculo e volta pro solo.
- [x] **Tema compartilhado**: migração 14 (`couples.tema`/`tema_custom`), `saveCoupleTheme`, `salvarTemaCasal`/`usarDoramaComoTemaCasal`, `aplicarTemaAmbiente` (aplica o tema do casal no ambiente, restaura o pessoal ao voltar). Mesma mecânica de hoje (cores + buscar dorama); quando um muda, vale pros dois (sincroniza ao abrir/recarregar).
- [x] Mobile: reaproveita `.sidebar`/`.nav` (vira barra inferior); "Voltar" entra na barra.
- [ ] **AÇÃO DO USUÁRIO**: rodar `supabase/14 - tema-do-casal.sql` no Supabase (sem ela, só o tema-do-casal não salva).

### Etapa 5 — Tutorial específico do casal  → **PENDENTE**
- [x] Tutorial geral já menciona a aba "Nós dois".
- [ ] Acrescentar tutorial específico/mais detalhado do casal (criar espaço, enviar código, entrar no casal certo, registrar memórias, roleta, privacidade).

---

## 🧠 Decisões tomadas
- **2026-06-21**: "tutorial visto" começa em **localStorage** (sem migração). Reavaliar Supabase só se quiser sincronizar entre aparelhos.
- **2026-06-21**: Tutorial = overlay próprio (não reaproveita `modal`/`uiModal`) pra ter slides com navegação e visual de boas-vindas.
- **2026-06-21**: "Ver depois" fecha sem marcar como visto permanentemente (reaparece em sessão futura); "Pular" e concluir marcam como visto. Guard `tutorialChecked` evita reabrir na mesma sessão e evita loop de render.

---

## 📂 Arquivos alterados (acumulado)
- **Etapa 1**: `app.js` (estado + `tutorialTemplate`/`bindTutorial` + auto-abrir + entrada no Perfil), `styles.css` (estilos do overlay), `PLANO_CASAL_E_TUTORIAL.md`.
- **Etapa 2**: `supabase/13 - criar-espaco-do-casal.sql` (novo), `supabase.js` (funções do casal), `supabase/README.md`, `PENDENTE.md`, `PLANO_CASAL_E_TUTORIAL.md`.
- **Etapa 3** (Codex + Claude): `app.js` (toda a aba "Nós dois": setup, hero, stats, timeline automática, capa, lista, diário com campos afetivos, sobre nós, cartinhas, roleta + handlers; correção anti-loop em `loadCoupleData`; aviso "falta sua pessoa"), `supabase.js` (CRUD: dramas/diário/about/cartinhas do casal), `styles.css` (estilos do casal + `.couple-waiting`), `PLANO_CASAL_E_TUTORIAL.md`.
- **Etapa 4**: `supabase/14 - tema-do-casal.sql` (novo), `supabase.js` (`saveCoupleTheme`), `app.js` (ambiente do casal: `state.space`, shell/sidebar do casal, `coupleSpaceView` + seções, portal Home/sidebar, tema compartilhado `aplicarTemaAmbiente`/`salvarTemaCasal`/`usarDoramaComoTemaCasal`, `mapCoupleRow`), `styles.css` (`.couple-portal-btn`, `.couple-home-card`, regras mobile), `supabase/README.md`, `PENDENTE.md`, `PLANO_CASAL_E_TUTORIAL.md`.
- **Etapa 3 primeira versão**: `supabase.js` (CRUD do casal), `app.js` (aba "Nós dois" + handlers), `styles.css` (visual do cantinho), `PENDENTE.md`, `PLANO_CASAL_E_TUTORIAL.md`.

---

## 🗄️ Migrações SQL necessárias
- Etapa 1: **nenhuma** (localStorage).
- Etapa 2: `supabase/13 - criar-espaco-do-casal.sql` (rodada pelo usuário em 2026-06-21).

---

## 🧪 O que ainda falta testar
- Etapa 1: abrir no celular (largura pequena), conferir que o auto-abrir só ocorre 1x, que "Pular" não reabre, que "Como usar o app" no Perfil reabre, e que não atrapalha quem já usa.
- **Etapa 3 — teste em 2 contas (manual, peça ajuda à sua pessoa ou use 2 logins):**
  1. Conta A: aba **Nós dois → Criar nosso espaço** → aparece o hero com o código + aviso "falta sua pessoa entrar".
  2. Conta A: **Copiar código** e mandar pra conta B.
  3. Conta B: **Nós dois → Entrar com código** → confirmação "Entrar neste espaço?" → entra; o aviso some nas duas contas (2 membros).
  4. Conta B (ou A): **Adicionar dorama** da lista pessoal → aparece em "Assistindo juntos" para os dois.
  5. **Registrar memória** com campos afetivos → some na lista do diário para os dois.
  6. **Sobre nós** e **Cartinha** → cada um vê o do outro.
  7. **Sortear date** → modal com dorama + lanche + missão.
  8. Segurança: conta C tentando entrar com o mesmo código → erro "já está completo (2 pessoas)". Conta já em casal tentando criar/entrar em outro → erro "já está em um espaço de casal".
  9. **Sair deste casal** (confirmação forte) → volta pra tela de criar/entrar; o outro continua com o espaço.

---

## 👉 Instruções para o próximo agente
1. Leia este arquivo inteiro antes de tocar em código.
2. Confira o **status** de cada etapa acima — só avance pra próxima quando a anterior estiver "feito" e commitada.
3. Para o casal: **crie migração nova** (`13 - ...`), não edite as antigas; atualize `supabase/README.md` e `PENDENTE.md`.
4. Mantenha os padrões (full re-render, `data-*` + `bindShell`, `cloudOn()` antes de chamar nuvem).
5. Rode `node --check app.js` e `npm run build` antes de commitar; faça commit por etapa e push no final de cada etapa estável.
6. Atualize ESTE arquivo ao concluir cada etapa.

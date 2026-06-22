# 🔥 Nós 2.0 — Fases e metas

> Redesign da aba privada **🔥 Nós** (só o casal + PIN): de "pontos calculados" para uma
> **economia de pontos real (ledger)**, com progressão por níveis, clima do dia, missões,
> loja com aceite, conquistas e Telegram. Tudo **sem mídia** (só metadados/texto).
> Criado em 2026-06-22. Baseado no brief `aba_nos_2_0_sistema_de_pontos.md`.

---

## 🧭 Princípio nº 1: o LEDGER é a fundação
Hoje o saldo é **derivado** (conta eps, memórias, cartinhas em tempo real) — isso pode contar
duas vezes, contar coisa apagada e dar ponto retroativo. **Antes de qualquer coisa nova**, trocar por:

```
Saldo atual = Σ (pontos do couple_points_ledger)
```

- Começa em **0**. Todo ponto vem de **uma ação registrada** → vira **uma linha** no ledger.
- **Anti-duplicação**: chave única `couple_id + user_id + source_type + source_id` (o mesmo
  desafio/episódio/cartinha nunca pontua 2×).
- **Estorno**: apagar algo que deu ponto, ou cancelar resgate, gera linha de estorno (não some "fingindo que nada houve").
- **Dois saldos diferentes** (importante pra progressão):
  - **Pontos acumulados** (lifetime de `earned`) → desbloqueiam **categorias/níveis**.
  - **Saldo atual** (`earned - spent - lost + refunded`) → gasta em **vales** e em **desbloquear desafios**.

---

## 🔐 Regras de ouro (valem em todas as fases)
- **Consentimento acima de tudo**: desbloquear ≠ cumprir; resgatar ≠ obrigar; **aceitar** confirma o momento.
- **Recusar nunca tira ponto** (por limite, desconforto, falta de clima, remarcar). Perda só em casos combinados (aceitou e largou sem remarcar, etc.).
- **Sem mídia**: o app guarda só **nome, descrição, combinado, status e pontos**. Foto/vídeo/áudio íntimo **só no Telegram**, fora do app.
- **Área adulta**: níveis altos exigem **ativar área adulta + confirmar 18+ + PIN + limites compatíveis dos dois**.
- **Nome público discreto + descrição privada** (revelada só depois do PIN/aceite), pra não expor na tela e pra deixar o combinado escrito.

---

## 🗄️ Modelo de dados novo (migrações futuras)
| Tabela | Pra quê |
|---|---|
| `couple_points_ledger` | extrato de pontos (a base) — id, couple_id, user_id, points, type(earned/spent/lost/refunded), reason, source_type, source_id, created_at |
| `couple_daily_checkins` | clima do dia por pessoa (+ pontos) |
| `couple_consent_history` | mudanças de limite (limite fixo + **limite do dia**) |
| `couple_challenges_catalog` | desafios prontos: title_public, description_private, couple_agreement, category, level, cost, requires_pin/adult/acceptance, is_preset |
| `couple_unlocks` | o que o casal já desbloqueou (categoria/desafio) usando saldo |
| `couple_missions` | missões (diária/semanal) + status |
| `couple_surprises` | surpresas programadas (revelar em data) |
| `couple_achievements` | conquistas/medalhas |
| `couple_telegram_events` | eventos "continuou no Telegram" (sem conteúdo) |

> Reaproveita o que já existe: `couple_rewards`, `couple_reward_claims`, `couple_member_prefs`,
> `couple_challenge_log`. O **ledger** passa a ser a verdade dos pontos (os outros viram "fontes").

---

## 🚦 Decisões a tomar antes de codar
1. **Saldo inicial:** começar **do zero** (como o brief pede) **ou** fazer **um backfill único**
   dos eps/memórias/cartinhas que já existem? → *Recomendo: backfill único como `earned`, pra não
   "resetar" o casal, e daí pra frente tudo pelo ledger.* (decidir)
2. **Valores de pontos/custos/thresholds:** começo com a tabela do brief (dá pra ajustar depois, é só dado).
3. **Quão explícito** os níveis 5/6 ficam escritos no app: o app guarda só **rótulo + "envio pelo Telegram, conforme combinado"** (sem detalhe gráfico). O conteúdo é de vocês, fora do app.

---

## 📦 Fases

### Fase 0 — Ledger de pontos (a fundação) ✅ **FEITO** (migração 22)
> Decisão: **saldo começa do zero** (sem backfill). Saldo/acumulados vêm do extrato.
> Já hooka: episódio junto (+5), memória (+3), cartinha/recado (+6), pergunta do quiz (+2),
> desafio (+5/8/12 por nível); gasto no resgate de vale; estorno ao cancelar resgate / apagar
> memória / apagar cartinha. Card de saldo + extrato recente no "Nós 🔥".
- Migração: `couple_points_ledger` (+ índice/único anti-dup).
- `saldo()` e `pontosAcumulados()` passam a ler o ledger (substituem `nosPontosGanhos`/`nosGastos`).
- **Hooks de ganho** (com anti-dup por source): episódio assistido junto, memória, cartinha,
  responder pergunta, desafio concluído, date, surpresa, check-in.
- **Hooks de gasto/estorno**: resgate de vale (−), cancelar resgate (+ estorno), apagar memória/cartinha/desafio que deu ponto (estorno).
- **Card de saldo + extrato** ("Ver extrato", "Como ganhar pontos").
- *Meta:* nenhum ponto solto; tudo rastreável; saldo confiável.

### Fase 1 — Progressão por níveis (categorias + desafios desbloqueáveis) ✅ **FEITO** (sem migração)
> 6 níveis (1 Safadinho leve liberado → 6 Ultra privado). Categorias liberam por **pontos
> acumulados** (0/200/350/550/800/1200) — sem gastar saldo. Desafios pagos **desbloqueiam com saldo**
> (registrado no ledger como `unlock:<key>`, anti-dup). Consentimento = menor limite dos dois (1–6);
> níveis 4–6 só com **18+** confirmado (localStorage). **Aceite** (ler descrição + aceitar/recusar)
> antes de concluir os íntimos; recusar nunca pune. Tela de evolução + catálogo com estados 🔒/✅.
> Sem mídia: níveis altos são só rótulo + "pelo Telegram, conforme combinado".
- 6 níveis: **1 Safadinho leve (liberado) · 2 Provocante · 3 Sensual · 4 Íntimo · 5 Picante · 6 Ultra privado**.
- **Categorias** desbloqueiam por **pontos acumulados** (ex.: 0/200/350/550/800/1200) — **sem gastar saldo**.
- **Desafios internos** desbloqueiam **gastando saldo** (ficam liberados pro casal).
- Catálogo `couple_challenges_catalog` (nome público + descrição privada + combinado + custo + nível + requires).
- **Ativação da área adulta** + 18+ + PIN + limites compatíveis. Estados visuais: 🔒 categoria / 🔒 desafio / ✅ liberado.
- **Aceite antes de cumprir** (ler descrição completa → aceitar/remarcar/recusar).
- *Meta:* progressão real, "difícil e viciante", com consentimento blindado.

### Fase 2 — Clima do dia + limite do dia + desafio inteligente 🗄️
- `couple_daily_checkins` (cada um marca o clima; +pontos; bônus se os dois no mesmo dia).
- **Limite do dia** (override do limite fixo) em `couple_consent_history`.
- **Desafio do dia** passa a considerar: menor limite + clima + histórico + nível liberado.

### Fase 3 — Loja de vales 2.0 + resgate com aceite (status) 🗄️
- Vales com **categoria, validade, custo, quem cria, quem resgata, precisa de aceite**.
- **Fluxo com status:** solicitado → aceito → (em andamento) → cumprido / remarcado / recusado / cancelado / expirado / reaberto.
- Pontos **reservados** no resgate → **descontados** no aceite → **estorno** se cancelar. Recusar não pune.

### Fase 4 — Missões, surpresas, perguntas e conquistas 🗄️
- `couple_missions` (diária/semanal: fofinha, saudade, dorama, flerte, Telegram…), +pontos.
- `couple_surprises` (surpresa programada, revela em data).
- **Perguntas do casal** por categoria (reaproveita o quiz; pode dar pontos com limite diário).
- `couple_achievements` (medalhas: 1º desafio, 1ª cartinha, 7 dias de carinho, 1º vale cumprido…).

### Fase 5 — Modo saudade (à distância) 🟢/🗄️
- Dias sem se ver + contagem pro próximo encontro (já temos o countdown).
- Missões de saudade, "lista quando a gente se ver", mensagem de saudade.

### Fase 6 — Telegram (continua o brief `CASAL_DISTANCIA_PLANO.md`) 🛰️
- `couple_telegram_events` (só metadados) + botões: Abrir Telegram / Enviei / Recebi / Concluir.
- Depois: bot @BotFather + Edge Function (webhook) + `telegram_link` pra notificações reais.

---

## 🗺️ Ordem recomendada
1. **Fase 0 (ledger)** — sem ela nada do resto é confiável.
2. **Fase 1 (progressão/níveis)** — o coração do "jogo do casal".
3. **Fase 2 (clima + limite do dia)**.
4. **Fase 3 (loja com aceite)**.
5. **Fase 4 (missões/surpresas/conquistas)**.
6. **Fase 5 (saudade)** e **Fase 6 (Telegram)**.

## ✅ Definição de pronto (resumo do brief)
Saldo começa em 0 · todo ponto vem de ação real · tudo vira lançamento no extrato · nada pontua 2× ·
todo gasto/cancelamento aparece/estorna · perda só em regra combinada · recusar nunca pune ·
Nível 1 liberado (já com toque safadinho leve) · categorias por pontos acumulados · desafios por saldo ·
quanto mais íntimo, mais caro · todo desafio escrito + com aceite · conteúdo fora do app · **app nunca salva mídia**.

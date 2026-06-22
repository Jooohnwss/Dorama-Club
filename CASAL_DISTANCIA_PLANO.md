# 💞 Casal à distância — o que dá pra fazer no Dorama Club

> Análise do brief (app de casal à distância, privacidade total, **zero mídia**, gamificação,
> Telegram pro conteúdo sensível) mapeado ao **nosso app real** (PWA vanilla JS + Supabase).
> Criado em 2026-06-21.

---

## 🧭 A boa notícia: nossa filosofia já é essa
O princípio central do brief — **o app NÃO guarda foto/vídeo/áudio/mensagem íntima, só metadados e experiência** — é **exatamente como o Dorama Club já funciona**. Tudo que temos é texto, datas, pontos, status. A mídia sensível **nunca** passa pelo app. Então a base filosófica está pronta; o que muda é adicionar features e (se quiser) o canal Telegram.

**Legenda de esforço:**
- ✅ **já temos** (no ambiente do casal / "Nós 🔥")
- 🟢 **dá pra fazer** (só front, sem banco)
- 🗄️ **precisa migração** (tabela/coluna nova)
- 🛰️ **precisa infra nova** (bot Telegram + Edge Function, push, biometria)

---

## 📋 Funcionalidades do brief → status no nosso app

| Funcionalidade desejada | Status | Onde / como |
|---|---|---|
| App privado só do casal | ✅ | Espaço "Nós dois" (RLS) + "Nós 🔥" (hash de e-mail + PIN) |
| Não armazenar mídia | ✅ | O app só guarda texto/datas/pontos. Já é assim. |
| Gamificação (pontos, conquistas, níveis) | ✅/🟢 | Pontos em "Nós 🔥", certificados, pet, bingo. **Níveis** = derivar dos pontos (🟢) |
| Perguntas pra aumentar conexão | ✅ | Quiz do casal (semanal) + "Sobre nós" |
| Compatibilidade por interesses | ✅ | Quiz do casal já dá % de compatibilidade |
| Wishlist compartilhada (presentes/experiências) | 🗄️ | Temos wishlist de **doramas**; criar `couple_wishlist` (item + quem quer + feito) |
| Cofre de lembranças sem mídia | ✅ | Diário do casal (por tipo) + cartinhas — é literalmente isso |
| Desafios diários com níveis de intensidade | 🗄️ | Pool de desafios + sorteio do dia + nível (leve→ousado) + `couple_challenge_log` (metadados) |
| Calendário de encontros virtuais | 🗄️ | `couple_dates` (data, tipo, título) — agenda + RSVP simples |
| Contagem regressiva pro próximo encontro presencial | 🗄️ | 1 campo `next_meet_date` em `couples` → countdown no painel |
| Limites e preferências por usuário (consentimento) | 🗄️ | `couple_member_prefs` (intensidade máx., categorias on/off) — **gate** os desafios |
| Notificações discretas | 🛰️ | Push real precisa de VAPID + service worker + sender (Edge Function). Hoje só aviso **interno** |
| Bloqueio por biometria | 🛰️/🟢 | PIN já existe (🟢). Biometria via **WebAuthn** dá, mas é instável em PWA — fica pra depois |
| **Integração com Telegram** | 🛰️ | **A grande peça nova** — ver seção abaixo |

---

## 🛰️ Telegram — como funcionaria (e o que precisa)

**O que dá HOJE, fácil (🟢):**
- **Deep links**: botões no app que abrem o Telegram do parceiro/ um chat / o bot
  (`https://t.me/<usuario>` ou `https://t.me/<bot>?start=<token>`). Zero infra — é só link.
- Fluxo "vá pro Telegram → volte e marque como concluído" **sem o app ver nada** do conteúdo.

**O que precisa de infra (🛰️):**
- **Bot oficial** (criado no @BotFather) + um **webhook** que recebe os eventos do bot.
  No nosso stack, isso roda numa **Supabase Edge Function** (serverless) — não precisa servidor próprio.
- **Vincular conta**: app gera um token → usuário abre `t.me/<bot>?start=<token>` → o bot
  associa o `chat_id` do Telegram ao `user_id` (tabela `telegram_link`). Aí o bot consegue
  mandar lembrete/notificação pra aquela pessoa.
- **Regra de ouro do brief**: o app/bot **só usa eventos explícitos** (ex.: a pessoa clicou
  "concluí" no bot) e **nunca lê nem guarda o conteúdo** das conversas. Guardamos só
  metadados (desafio X concluído, data/hora, categoria, pontos).

> Resumo: **deep links já dá pra usar agora**; o **bot + notificações** é um mini-projeto à parte
> (Edge Function), mas viável e sem servidor dedicado.

---

## 🗄️ Modelo de dados novo (proposto — migrações futuras)

- `couples.next_meet_date date` — contagem regressiva.
- `couple_wishlist (id, couple_id, title, kind, wanted_by, done, created_at)` — wishlist de presentes/experiências.
- `couple_dates (id, couple_id, title, kind, when_at, status, created_at)` — calendário de encontros virtuais.
- `couple_challenge_log (id, couple_id, challenge_key, intensity, started_by, done, done_at)` — **só metadados** dos desafios.
- `couple_member_prefs (couple_id, user_id, max_intensity, categorias jsonb, updated_at)` — limites/consentimento por pessoa.
- `telegram_link (user_id, chat_id, username, linked_at)` — vínculo com o bot (fase Telegram).
- Pool de **desafios** e **perguntas**: client-side (array no código), com nível de intensidade.

Tudo com **RLS** "só os 2 membros" (mesmo padrão das migrações 13–19).

---

## 🔒 Privacidade, consentimento e LGPD (resumo honesto)

- **Minimização de dados**: guardamos só o necessário (metadados). Já fazemos isso. ✔️
- **Consentimento explícito**: cada um define **intensidade máxima** e **categorias** que aceita;
  um desafio só aparece se **ambos** consentem o nível. Sempre com opção de **pular/recusar** sem punição.
- **Conteúdo sensível fora do app**: vai pro Telegram; o app nunca vê. ✔️ (alinha com o brief)
- **Direitos LGPD**: poder **exportar** e **apagar** tudo do casal (já temos "Sair/Excluir";
  dá pra reforçar com um "apagar todos os dados do casal").
- **Não incentivar abuso/NCII**: nada de cobrança, ranking de "performance" ou pressão.
  Sempre enquadrar como **opcional, consensual e revogável**. Aviso 18+ no acesso à área.
- **Segurança**: RLS no banco + gate por e-mail (hash) + PIN local. Biometria = evolução.

---

## 🚀 MVP recomendado (o que dá pra entregar JÁ, sem Telegram)

Tudo isso é **dentro do nosso app**, sem depender de bot:

1. **Contagem regressiva** pro próximo encontro (campo + card no painel). ✅ FEITO (migração 20)
2. **Limites & consentimento por pessoa** (intensidade máx.) — a base de tudo. ✅ FEITO (migração 20, em "Nós 🔥")
3. **Desafios diários** com níveis (respeitando o MENOR limite dos dois). ✅ FEITO (migração 20, em "Nós 🔥")
4. **Wishlist compartilhada** de presentes/experiências (com "quem quer" e "feito"). 🗄️ a fazer
5. **Calendário de encontros virtuais** (agendar + lembrar dentro do app). 🗄️ a fazer
6. **Níveis/level** derivados dos pontos que já existem. 🟢 a fazer
7. **Deep link pro Telegram** nos desafios que pedem mídia. 🟢 a fazer (Fase 2)

## 🗺️ Roadmap (fases)

- **Fase 1 (sem infra):** itens 1–7 acima. Entrega rápida, alto valor, zero servidor.
- **Fase 2 (Telegram de verdade):** bot @BotFather + Edge Function (webhook) + `telegram_link`
  → notificações/lembretes e eventos "concluído" vindos do bot.
- **Fase 3 (polimento):** push discreto (VAPID), biometria (WebAuthn), exportar/apagar dados (LGPD).

---

## 👉 Decisão pra começar
Sugiro **Fase 1** e, dentro dela, começar por **limites & consentimento (#2)** + **contagem regressiva (#1)** + **desafios diários (#3)** — é o coração do "casal à distância" e não precisa de Telegram nem servidor. O Telegram entra na Fase 2 como mini-projeto separado.

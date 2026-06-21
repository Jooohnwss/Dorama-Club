# 🌱 Backlog de ideias — o que ainda NÃO temos

> Lista de coisas a fazer (só o que **ainda não existe** no app). Criado em 2026-06-21.
> Trabalho em etapas, alternando Claude/Codex — ver também `PLANO_CASAL_E_TUTORIAL.md`.

**Legenda de esforço/dependência:**
- 🟢 só front (sem banco)
- 🗄️ precisa **migração** nova (próximo número: `15 - ...`)
- 🎬 precisa mexer no **TMDB** (`tmdb.js`)

---

## ✅ Pra não confundir — isso JÁ existe (não refazer)
Roleta de date · tema do casal por dorama (compartilhado) · diário do casal com campos afetivos (quem escolheu, notas dele/dela, quem chorou/raiva) · sortear com clima/humor · certificado **pessoal** de conclusão (card de compartilhar) · timeline automática básica · stats básicas do casal (episódios/doramas/memórias) · tutorial geral + tutorial do casal · favoritos especiais + estatísticas pessoais · ranking do clube com títulos + compatibilidade.

---

## ⭐ Prioridade do Jonatas (fazer primeiro)
1. **Modo presente** (1ª visita dela) + **Cartinha fixa no topo** + **Certificado de dorama finalizado juntos** → dá cara de presente de verdade.
2. **Certificados desbloqueáveis** (inclui por **horas** via TMDB).
3. **Pet do casal** (leve, afetivo — não vira tarefa).
4. **Joguinho** — começar pelo **Bingo do episódio**.

---

## 💝 Nós dois — emocional / presente
- [x] ✅ **Modo presente (1ª visita dela)** — overlay especial só na 1ª entrada de quem NÃO criou o casal (a parceira): mostra a cartinha fixa (ou um texto padrão) + botão "Entrar no nosso cantinho". Guardado em `dorama-club-presente-visto`. *(commit Prioridade 1)*
- [x] ✅ **Cartinha fixa no topo** — `couples.pinned_letter` (migração 15); card no topo da seção Início + edição; também alimenta a tela de modo presente. *(commit Prioridade 1)*
- [ ] 🗄️ **Álbum de memórias** (diário mais bonito): cards estilo álbum com capa do dorama, data, episódio, frase interna, "momento favorito". (front + talvez guardar `cover`/`tmdb_id` já existe no diário)
- [ ] 🟢 **Nosso placar** (fofo): quem chorou mais, quem escolheu mais doramas, episódios juntos, nº de memórias, **lanche mais citado** — agregando o que já está no diário.
- [ ] 🗄️ **Date da semana**: toda semana o app sugere dorama + lanche + missão + pergunta pra responder depois. (precisa guardar a sugestão/semana)
- [ ] 🟢 **Perguntas de casal ao registrar memória**: prompts rotativos ("O que você amou assistir com ela hoje?", "Qual cena pareceu a gente?", "Qual frase virou piada?").
- [ ] 🗄️ **Nosso Top 5**: top 5 doramas do casal, casais fictícios, cenas, personagens odiados. (tabela `couple_tops` ou reusar `couple_about`)
- [ ] 🗄️ **Cápsula do tempo**: cartinha pra abrir depois (em 1 mês / no aniversário / ao terminar um dorama) — fica trancada até a data. (campo `open_at` em `couple_letters`)
- [ ] 🗄️ **Playlist / histórico de dates**: registrar dates feitos (dia, dorama, lanche, nota, memória) e ver o histórico. (tabela `couple_dates` — ou derivar do diário)
- [ ] 🗄️ **Upload/escolha de capa ou foto do casal** (capa da capa). (precisa storage — avaliar Supabase Storage)
- [ ] 🟢 **Botão "eu te avisei"**: registrar quando um personagem decepciona (piadinha interna).
- [ ] 🗄️ **Mural privado de surtos do casal**: tipo Doramigas, mas só dos dois, separado do diário.
- [ ] 🟢 **Resumo mensal do casal**: "Em junho vocês assistiram 12 eps, guardaram 4 memórias e passaram raiva 3 vezes." (deriva do diário/lista)
- [ ] 🟢 **Timeline mais emocional/visual** (melhorar a atual).
- [ ] 🟢 **"Sobre nós" mais guiado** (perguntas em vez de campo livre).

## 🎓 Certificados (do casal)
- [x] ✅ **Horas assistidas juntos** — TMDB `episode_run_time` (`getEpisodeRuntime`, fallback 60 min) × eps; cache em memória, busca preguiçosa na seção Certificados. *(commit Prioridade 2)*
- [x] ✅ **Certificado de Maratona** (por horas): 10/25/50/100h. *(commit Prioridade 2)*
- [x] ✅ **Certificado de Dorama Finalizado Juntos** — botão 🎓 nos doramas "Já vimos/Favorito" gera card-imagem (capa, título, episódios, **horas estimadas**, nome do casal, notas dele/dela do diário, frase final). *(commit Prioridade 1 + 2)*
- [x] ✅ **Certificado de Casal Desbloqueado** (marcos): 1ª memória, 1ª cartinha, 1º finalizado, 10 eps juntos. *(commit Prioridade 2)*
- [x] ✅ **Certificado de Sofrimento**: 3+ memórias com choro/raiva/surto. *(commit Prioridade 2)*
- [x] ✅ **Certificado "Eu te avisei"**: ligado à frase interna do diário. *(commit Prioridade 2)*
- [x] ✅ **Certificado de Lanche Oficial**: mesmo lanche citado 3×. *(commit Prioridade 2)*
- [x] ✅ **Exportar certificado como imagem** — botão "Compartilhar" nos desbloqueados (reaproveita o canvas, `compartilharCertificadoMarco`). *(commit Prioridade 2)*

> Nova **seção "Certificados"** no ambiente do casal: mostra horas estimadas + grade de certificados (bloqueado/desbloqueado) com compartilhar.

## 🏆 Pontuação / Gamificação
- [ ] 🗄️ **Pontos do casal** (e talvez pessoal/clube): ações geram pontos.
- [ ] 🟢 **Badges/conquistas do casal** ("frases desbloqueáveis": maratonistas oficiais, 10 eps juntos, 1ª crise por personagem).
- [ ] 🗄️ **Ranking semanal/mensal** (precisa eventos datados).
- [ ] 🟢 **Streak leve de uso** (sem punição — só incentivo).
- [ ] 🟢 **Recompensas visuais desbloqueáveis** (acessórios/temas extras).

## 🐶 Pet do casal  → ✅ FEITO (Prioridade 3)
- [x] ✅ **Criar/nomear o pet** + escolher a carinha (8 opções) — tabela `couple_pet` (migração 16).
- [x] ✅ **Cuidar**: carinho/petisco/banho/passear (+ surpresa) com reações fofas aleatórias.
- [x] ✅ **Felicidade derivada das ações** (episódios, memórias, cartinhas, "sobre nós") — sem morrer/punir; status "com saudade" quando tá baixa.
- [x] ✅ **Acessórios desbloqueáveis** por marcos (ossinho, coleira aos 5 eps, brinquedo às 3 memórias, roupinha ao 1º finalizado, carteiro à 1ª cartinha, coroa aos 50 eps).
- [x] ✅ **Pet entrega surpresa** (botão 💌 com mensagem fofa).
- [x] ✅ **Pet aparece na aba Nós dois** (seção "Nosso pet", mascote animado).
- [x] ✅ **"Nosso cantinho" (estilo Couple2/PrettyCat)**: quartinho fofo com o bichinho (gato em destaque) + **decorações desbloqueáveis no quarto** (sofá, TV, plantinha, quadro, pipoca, abajur, laço, coroa). Sem migração. *(commit Nosso cantinho)*
- [ ] 🟢 *Futuro:* passeio ligar de verdade na roleta de date; mais móveis/skins; arrastar pra decorar.

## 🎮 Joguinhos
- [x] ✅ **Bingo do episódio**: cartela 3×3 de clichês, marca células, fecha linha (↔↕⤢) = BINGO + compartilhar card. Local (localStorage), sem migração. *(commit Bingo)*
- [ ] 🟢 **Quiz do casal**: "Quem escolheu esse dorama?", "Qual nossa frase interna?", "Quem chorou mais?" (usa dados do diário).
- [ ] 🟢 **Quiz de doramas** (cultura dorameira geral).
- [ ] 🟢 **"Quem disse isso?"**: mostra frase interna salva e adivinha se foi você, ela ou personagem.
- [ ] 🟢 **"Passei pano ou condeno?"**: mostra personagem/cena e votam (passei pano / cadeia / terapia / eu defenderia).
- [ ] 🗄️ **Jogo de previsões**: antes do episódio (vai ter beijo? alguém trai? vamos passar raiva?) e marca acertos depois.
- [ ] 🟢 **Roleta de desafios/penalidades** (evolução da roleta de date).
- [ ] 🗄️ **Minijogo que dá pontos** pro casal/clube.

## 👯 Doramigas / Clube
- [ ] 🟢 **Feed do clube mais vivo** (mais tipos de atividade).
- [ ] 🗄️ **Enquetes pra escolher dorama** do clube.
- [ ] 🗄️ **Desafios do clube**.
- [ ] 🟢 **Ranking de surtos** / 🟢 mural de memes/frases.
- [ ] 🟢 **Melhorar troca entre vários clubes** + tela "meus clubes" mais clara.

## 🔎 Busca (melhorada)
- [x] ✅ **Buscar em séries + filmes** (`/search/multi`).
- [x] ✅ **Vários idiomas** (pt-BR + en-US, merge/dedupe) e **aceita título original**.
- [x] ✅ **Etiquetas** nos resultados (Filme/Série + país: Coreia, Tailândia, Japão…).
- [x] ✅ **Adicionar manualmente** quando não encontra no TMDB.
- [x] ✅ Detalhes de **filme** (runtime, 1 "episódio") além de série. *(commit Busca++)*

## 🎨 Experiência geral / polimento
- [ ] 🟢 **Estados vazios mais bonitos** (ilustração + copy fofa).
- [ ] 🟢 **Botões e cards mais consistentes** (design system leve).
- [ ] 🟢 **Melhor uso das imagens do TMDB** (backdrops, blur, capas).
- [ ] 🟢 **Microinterações/animações leves**.
- [ ] 🟢 **Melhor tratamento de erro** (mensagens claras + retry).
- [ ] 🟢 **Centro de notificações interno**.
- [ ] 🟢 **Revisar TUDO no celular** (passe final mobile).
- [ ] 🟢 **Melhor experiência de convidar alguém**.

## 🔭 Sessão coletiva (do brainstorm antigo, ainda pendente)
- [ ] 🗄️ **"Vamos assistir juntas"**: agendar sessão, RSVP, mural por sessão (vale pro clube e pro casal).

---

## 🧭 Ordem sugerida (consolidada com a preferência do Jonatas)
1. **Modo presente** + **Cartinha fixa** + **Certificado de dorama finalizado juntos** (🟢/🗄️)
2. **Horas via TMDB** + **Certificados desbloqueáveis** (🎬/🟢)
3. **Pet do casal** (🗄️/🟢)
4. **Bingo do episódio** (🗄️)
5. **Placar / Top 5 / Resumo mensal** (fofuras do diário)
6. Quizzes e jogos restantes
7. Polimento geral + mobile

> Regra: nunca editar migração antiga; criar `15 - ...`, `16 - ...`. Atualizar `supabase/README.md` e este arquivo a cada entrega.

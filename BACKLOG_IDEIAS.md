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
- [ ] 🎬 **Horas assistidas juntos**: buscar `episode_run_time` no TMDB (com fallback 1 ep = 60 min) e calcular eps×duração. Base pros certificados de maratona.
- [ ] 🟢 **Certificado de Maratona** (por horas): 10h "Primeira maratona" · 25h "Casal Dorameiro Oficial" · 50h "Sobreviventes do Sofrimento" · 100h "Lenda dos Doramas".
- [x] ✅ **Certificado de Dorama Finalizado Juntos** — botão 🎓 nos doramas "Já vimos/Favorito" gera card-imagem (capa, título, episódios, nome do casal, notas dele/dela vindas do diário, frase final). Reaproveita o canvas de card (`gerarCardMeuDia` com `opts.casal`). Falta só somar **horas** (depende do TMDB — Prioridade 2). *(commit Prioridade 1)*
- [ ] 🟢 **Certificado de Casal Desbloqueado** (marcos): 1ª memória, 1º date, 1ª cartinha, 1º dorama finalizado, 10 eps juntos.
- [ ] 🟢 **Certificado de Sofrimento**: muitos registros de "choramos/raiva/surto" no diário.
- [ ] 🟢 **Certificado "Eu te avisei"**: ligado à frase interna / botão de personagem suspeito.
- [ ] 🟢 **Certificado de Lanche Oficial**: mesmo lanche citado X vezes → "Pipoca doce oficialmente aprovada".
- [ ] 🟢 **Exportar certificado como imagem** (reaproveitar o canvas de card que já existe).

## 🏆 Pontuação / Gamificação
- [ ] 🗄️ **Pontos do casal** (e talvez pessoal/clube): ações geram pontos.
- [ ] 🟢 **Badges/conquistas do casal** ("frases desbloqueáveis": maratonistas oficiais, 10 eps juntos, 1ª crise por personagem).
- [ ] 🗄️ **Ranking semanal/mensal** (precisa eventos datados).
- [ ] 🟢 **Streak leve de uso** (sem punição — só incentivo).
- [ ] 🟢 **Recompensas visuais desbloqueáveis** (acessórios/temas extras).

## 🐶 Pet do casal
- [ ] 🗄️ **Criar/nomear o pet** + escolher aparência/personalidade (tabela `couple_pet`).
- [ ] 🟢 **Cuidar**: carinho/petisco/banho/passeio (passeio pode ligar na roleta de date).
- [ ] 🟢 **Felicidade ligada às ações** (episódios, memórias, dates, cartinhas) — sem morrer/punir, só "com saudade".
- [ ] 🟢 **Acessórios desbloqueáveis** por marcos (coleira aos 5 eps, brinquedo às 3 memórias, roupinha ao completar date).
- [ ] 🟢 **Pet entrega cartinha/surpresa**.
- [ ] 🟢 **Pet aparece na aba Nós dois** (mascote vivo, leve).

## 🎮 Joguinhos
- [ ] 🗄️ **Bingo do episódio** (começar por esse): cartela de clichês (quase beijo, trauma de infância, CEO frio amolece, alguém chora na chuva…), marca durante/depois, fechou bingo → certificado.
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

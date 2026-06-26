# Plano completo dos Clubes

Documento para guiar a evolucao dos clubes do Dorama Club.

Objetivo: transformar cada clube em uma comunidade viva, com feed, chat, doramas em destaque, membros, eventos, enquetes, desafios, ranking e moderacao.

---

## Visao geral

Um clube precisa responder bem a 5 perguntas:

1. O que esta acontecendo agora?
2. O que estamos assistindo juntos?
3. Quem faz parte daqui?
4. Como eu participo sem ficar perdido?
5. O que me faz voltar amanha?

Para isso, a experiencia principal deve ter:

- Feed do clube.
- Chat do clube.
- Doramas do clube.
- Membros e cargos.
- Enquetes e decisoes coletivas.
- Desafios, maratonas e eventos.
- Ranking e conquistas.
- Regras, moderacao e seguranca.

---

## Navegacao sugerida

Tela do clube com topo fixo/resumido:

- Capa do clube.
- Nome do clube.
- Quantidade de membros.
- Botao entrar/sair.
- Botao convidar.
- Cargo da pessoa no clube.
- Descricao curta.
- Dorama em destaque.

Abas principais:

1. Feed
2. Chat
3. Doramas
4. Eventos
5. Membros
6. Sobre

No mobile, usar abas horizontais ou menu inferior dentro do clube.

---

## Fase 1 - Clube com vida basica

Meta: ao entrar em um clube, a pessoa ja entende o que fazer.

### Feed do clube

- [ ] Criar posts no clube.
- [ ] Listar posts recentes.
- [ ] Comentar em posts.
- [ ] Reagir a posts.
- [ ] Excluir proprio post.
- [ ] Dono/moderador pode excluir qualquer post.
- [ ] Estado vazio bonito: chamar para criar o primeiro post.

Tipos de post:

- Texto livre.
- Recomendacao de dorama.
- Surto/comentario de episodio.
- Pergunta para o clube.
- Aviso de moderador.

Campos sugeridos:

- `id`
- `club_id`
- `user_id`
- `type`
- `content`
- `drama_tmdb_id`
- `drama_title`
- `episode_number`
- `has_spoiler`
- `created_at`
- `updated_at`

### Comentarios

- [ ] Comentar em post.
- [ ] Excluir proprio comentario.
- [ ] Moderador pode excluir comentario.
- [ ] Mostrar contador de comentarios.

Campos sugeridos:

- `id`
- `post_id`
- `club_id`
- `user_id`
- `content`
- `created_at`

### Reacoes

- [ ] Curtir.
- [ ] Reacao "surtei".
- [ ] Reacao "tambem acho".
- [ ] Reacao "sem spoilers".
- [ ] Uma reacao por pessoa por post, ou multiplas se ficar simples no front.

Campos sugeridos:

- `id`
- `post_id`
- `club_id`
- `user_id`
- `reaction`
- `created_at`

---

## Fase 2 - Dorama da semana/mes

Meta: o clube ter um motivo coletivo para existir.

### Dorama em destaque

- [ ] Definir dorama da semana.
- [ ] Definir dorama do mes.
- [ ] Mostrar capa, titulo, sinopse curta, ano e status.
- [ ] Botao "estou assistindo".
- [ ] Botao "ja terminei".
- [ ] Botao "comentar sem spoiler".
- [ ] Botao "area com spoiler".

Campos sugeridos:

- `id`
- `club_id`
- `tmdb_id`
- `title`
- `poster_path`
- `overview`
- `status`: `featured`, `watching`, `finished`, `archived`
- `period_type`: `week`, `month`, `free`
- `starts_at`
- `ends_at`
- `created_by`
- `created_at`

### Check-in de episodio

- [ ] Membro marca ate qual episodio assistiu.
- [ ] Mostrar progresso medio do clube.
- [ ] Mostrar "sem spoiler ate ep X".
- [ ] Usar esse dado para proteger comentarios por episodio.

Campos sugeridos:

- `id`
- `club_id`
- `club_drama_id`
- `user_id`
- `current_episode`
- `status`: `watching`, `paused`, `finished`, `dropped`
- `updated_at`

---

## Fase 3 - Enquetes e decisoes coletivas

Meta: os membros ajudarem a escolher o rumo do clube.

### Enquetes

- [ ] Criar enquete.
- [ ] Votar em uma opcao.
- [ ] Encerrar enquete.
- [ ] Mostrar resultado.
- [ ] Opcao de enquete anonima ou aberta.
- [ ] Opcao de data limite.

Usos:

- Escolher proximo dorama.
- Escolher horario da maratona.
- Escolher tema do mes.
- Votar em melhor casal/personagem.
- Decidir capa/tema do clube.

Campos sugeridos:

- `club_polls`
  - `id`
  - `club_id`
  - `created_by`
  - `question`
  - `is_anonymous`
  - `allow_multiple`
  - `closes_at`
  - `created_at`

- `club_poll_options`
  - `id`
  - `poll_id`
  - `label`
  - `tmdb_id`
  - `sort_order`

- `club_poll_votes`
  - `id`
  - `poll_id`
  - `option_id`
  - `user_id`
  - `created_at`

---

## Fase 4 - Chat do clube

Meta: dar sensacao de presenca em tempo real.

### Chat simples

- [ ] Aba Chat.
- [ ] Enviar mensagem.
- [ ] Listar mensagens recentes.
- [ ] Mostrar autor e horario.
- [ ] Apagar propria mensagem.
- [ ] Moderador pode apagar mensagem.
- [ ] Aviso visual para spoilers.

Campos sugeridos:

- `id`
- `club_id`
- `user_id`
- `content`
- `has_spoiler`
- `episode_number`
- `created_at`

### Canais futuros

- Geral.
- Spoilers.
- Recomendacoes.
- Dorama da semana.
- Off-topic.

Comecar com um chat unico. Canais podem vir depois.

---

## Fase 5 - Eventos, maratonas e watch party

Meta: criar encontros marcados dentro do clube.

### Eventos

- [ ] Criar evento.
- [ ] Tipo de evento: maratona, watch party, debate, votacao, desafio.
- [ ] Data e horario.
- [ ] Dorama vinculado.
- [ ] Membros confirmam presenca.
- [ ] Notificacao/aviso no topo do clube.

Campos sugeridos:

- `club_events`
  - `id`
  - `club_id`
  - `created_by`
  - `type`
  - `title`
  - `description`
  - `tmdb_id`
  - `starts_at`
  - `ends_at`
  - `created_at`

- `club_event_rsvps`
  - `id`
  - `event_id`
  - `club_id`
  - `user_id`
  - `status`: `going`, `maybe`, `not_going`
  - `created_at`

---

## Fase 6 - Membros, cargos e moderacao

Meta: clube organizado e seguro.

### Cargos

- Dono: controla tudo.
- Moderador: cuida de posts, comentarios, chat, eventos e enquetes.
- Membro: participa.

Permissoes:

- [ ] Dono pode editar nome, capa, descricao e regras.
- [ ] Dono pode promover/rebaixar moderador.
- [ ] Dono pode remover membro.
- [ ] Moderador pode remover conteudo inadequado.
- [ ] Membro pode sair do clube.

Campos sugeridos na tabela de membros:

- `club_id`
- `user_id`
- `role`: `owner`, `moderator`, `member`
- `joined_at`
- `muted_until`
- `banned_at`

### Regras do clube

- [ ] Descricao longa.
- [ ] Regras.
- [ ] Aviso de spoiler.
- [ ] Tema do clube.
- [ ] Idioma/estilo do clube.

Campos sugeridos no clube:

- `description`
- `rules`
- `cover_url`
- `visibility`: `public`, `private`, `invite_only`
- `join_policy`: `open`, `approval`, `invite`

---

## Fase 7 - Ranking, pontos e conquistas

Meta: incentivar participacao sem virar obrigacao chata.

### Pontos

Acoes que podem gerar pontos:

- Criar post.
- Comentar.
- Participar de enquete.
- Confirmar presenca em evento.
- Fazer check-in de episodio.
- Concluir dorama do clube.
- Participar de desafio.

Evitar pontuar spam:

- Limite diario por tipo de acao.
- Comentarios muito curtos nao contam.
- Moderador pode remover pontos de conteudo apagado.

Campos sugeridos:

- `club_points_ledger`
  - `id`
  - `club_id`
  - `user_id`
  - `source_type`
  - `source_id`
  - `points`
  - `reason`
  - `created_at`

### Ranking

- [ ] Ranking semanal.
- [ ] Ranking mensal.
- [ ] Ranking geral.
- [ ] Mostrar top 10.
- [ ] Mostrar posicao da pessoa logada.

### Conquistas

Ideias:

- Fundador do clube.
- Maratonista.
- Comentarista.
- Rainha/Rei do surto.
- Sem medo de votar.
- Fiscal de spoiler.
- Finalizou o dorama do clube.
- Participou da primeira watch party.

Campos sugeridos:

- `club_badges`
- `club_user_badges`

---

## Fase 8 - Desafios e missoes

Meta: deixar o clube divertido semanalmente.

### Desafios

- [ ] Criar desafio semanal.
- [ ] Membro marca como concluido.
- [ ] Clube ve progresso geral.
- [ ] Desafio pode estar ligado a dorama.

Exemplos:

- Assistir 3 episodios na semana.
- Comentar uma cena favorita.
- Indicar um dorama escondido.
- Participar da enquete.
- Escrever uma teoria.
- Fazer check-in sem spoiler.

Campos sugeridos:

- `club_challenges`
  - `id`
  - `club_id`
  - `created_by`
  - `title`
  - `description`
  - `points`
  - `starts_at`
  - `ends_at`
  - `created_at`

- `club_challenge_entries`
  - `id`
  - `challenge_id`
  - `club_id`
  - `user_id`
  - `status`
  - `proof_text`
  - `completed_at`

---

## Fase 9 - Spoilers bem cuidados

Meta: permitir conversa boa sem estragar a experiencia de ninguem.

### Regras de spoiler

- [ ] Todo post/comentario pode marcar `has_spoiler`.
- [ ] Pode informar episodio.
- [ ] Conteudo com spoiler fica escondido ate clicar.
- [ ] Feed pode filtrar "sem spoilers".
- [ ] Area separada para spoilers do dorama em destaque.

Comportamento:

- Se `has_spoiler = true`, mostrar capa/aviso em vez do texto.
- Se `episode_number` existir, mostrar "Spoiler ate episodio X".
- Se a pessoa esta em episodio menor, manter oculto.

---

## Fase 10 - Convites, privacidade e descoberta

Meta: clubes crescerem do jeito certo.

### Convites

- [ ] Link de convite.
- [ ] Codigo de convite.
- [ ] Convite expira opcionalmente.
- [ ] Dono/moderador pode revogar convite.

Campos sugeridos:

- `club_invites`
  - `id`
  - `club_id`
  - `created_by`
  - `code`
  - `max_uses`
  - `used_count`
  - `expires_at`
  - `created_at`

### Privacidade

Tipos:

- Publico: aparece na busca e qualquer pessoa entra.
- Privado: aparece na busca, mas precisa aprovacao.
- Secreto: so entra com convite.

---

## Fase 11 - Notificacoes

Meta: trazer a pessoa de volta quando algo importante acontece.

Notificar quando:

- Novo post em clube favorito.
- Responderam seu post.
- Comentaram no seu post.
- Nova enquete.
- Enquete encerrando.
- Evento vai comecar.
- Novo dorama da semana.
- Voce ganhou badge.

Comecar com notificacoes internas no app. Push pode vir depois.

Campos sugeridos:

- `notifications`
  - `id`
  - `user_id`
  - `type`
  - `title`
  - `body`
  - `target_type`
  - `target_id`
  - `read_at`
  - `created_at`

---

## Fase 12 - Personalizacao do clube

Meta: cada clube ter identidade.

Opcoes:

- Capa.
- Cor/tema.
- Icone.
- Frase do clube.
- Dorama favorito fixado.
- Regras visuais.
- Template de post.

Nao exagerar no comeco. Prioridade:

1. Capa.
2. Descricao.
3. Regras.
4. Dorama fixado.

---

## Ordem recomendada de implementacao

### MVP 1 - Clube habitado

- [ ] Feed.
- [ ] Posts.
- [ ] Comentarios.
- [ ] Reacoes.
- [ ] Membros/cargos basicos.
- [ ] Regras e descricao.

### MVP 2 - Clube com assunto

- [ ] Dorama da semana.
- [ ] Check-in de episodio.
- [ ] Area de spoiler.
- [ ] Enquete para proximo dorama.

### MVP 3 - Clube com encontro

- [ ] Eventos.
- [ ] Maratonas/watch party.
- [ ] Confirmar presenca.
- [ ] Avisos no topo.

### MVP 4 - Clube com progresso

- [ ] Pontos.
- [ ] Ranking.
- [ ] Badges.
- [ ] Desafios semanais.

### MVP 5 - Clube maduro

- [ ] Convites.
- [ ] Privacidade.
- [ ] Moderacao completa.
- [ ] Notificacoes.
- [ ] Personalizacao.

---

## Sugestao de migracoes Supabase

Como ja existe a migracao `28 - telegram-por-pessoa.sql`, as proximas podem seguir a numeracao seguinte.

Sugestao:

- `29 - clubes-feed-posts.sql`
- `30 - clubes-doramas-e-progresso.sql`
- `31 - clubes-enquetes.sql`
- `32 - clubes-chat.sql`
- `33 - clubes-eventos.sql`
- `34 - clubes-pontos-badges-desafios.sql`
- `35 - clubes-convites-notificacoes.sql`

Se preferirmos ir mais rapido, podemos juntar algumas:

- `29 - clubes-core-social.sql`
- `30 - clubes-watch-party.sql`
- `31 - clubes-gamificacao.sql`

---

## Componentes de interface

Componentes provaveis:

- `renderClubPage`
- `renderClubHeader`
- `renderClubTabs`
- `renderClubFeed`
- `renderClubPostComposer`
- `renderClubPostCard`
- `renderClubComments`
- `renderClubDramaHighlight`
- `renderClubPoll`
- `renderClubChat`
- `renderClubEvents`
- `renderClubMembers`
- `renderClubAbout`
- `renderClubRanking`
- `renderClubChallenges`

Estados importantes:

- Carregando.
- Clube vazio.
- Sem permissao.
- Usuario nao entrou no clube.
- Usuario banido/silenciado.
- Erro de Supabase.
- Sem internet.

---

## Funcoes Supabase/JS provaveis

Funcoes de clubes:

- `getClubDetails(clubId)`
- `updateClubDetails(clubId, payload)`
- `joinClub(clubId)`
- `leaveClub(clubId)`
- `getClubMembers(clubId)`
- `updateClubMemberRole(clubId, userId, role)`
- `removeClubMember(clubId, userId)`

Feed:

- `getClubPosts(clubId)`
- `createClubPost(clubId, payload)`
- `deleteClubPost(postId)`
- `getClubComments(postId)`
- `createClubComment(postId, content)`
- `deleteClubComment(commentId)`
- `setClubPostReaction(postId, reaction)`

Doramas:

- `getClubDramas(clubId)`
- `setClubFeaturedDrama(clubId, payload)`
- `updateClubDramaProgress(clubDramaId, payload)`

Enquetes:

- `getClubPolls(clubId)`
- `createClubPoll(clubId, payload)`
- `voteClubPoll(pollId, optionId)`
- `closeClubPoll(pollId)`

Eventos:

- `getClubEvents(clubId)`
- `createClubEvent(clubId, payload)`
- `setClubEventRsvp(eventId, status)`

Gamificacao:

- `getClubRanking(clubId, period)`
- `grantClubPoints(clubId, source)`
- `getClubBadges(clubId)`
- `getClubChallenges(clubId)`
- `completeClubChallenge(challengeId, payload)`

---

## Regras de seguranca/RLS

Principios:

- So membro ve conteudo de clube privado/secreto.
- Clube publico pode mostrar preview, mas interacao exige entrar.
- Membro so edita/exclui o que criou.
- Moderador pode remover conteudo do clube.
- Dono pode gerenciar cargos e configuracoes.
- Banido nao pode postar, comentar, votar, entrar no chat ou confirmar evento.
- Silenciado nao pode postar/comentar/chat ate `muted_until`.

Checklist por tabela:

- [ ] `select` respeita visibilidade do clube.
- [ ] `insert` exige usuario autenticado e membro ativo.
- [ ] `update` exige dono do registro ou cargo permitido.
- [ ] `delete` exige dono do registro ou moderador/dono.
- [ ] Triggers atualizam contadores quando necessario.

---

## Experiencia ideal da tela inicial do clube

Ao abrir o clube, mostrar:

1. Header com identidade do clube.
2. Dorama em destaque.
3. Proximo evento ou enquete ativa.
4. Composer de post.
5. Feed recente.

Se a pessoa ainda nao entrou:

- Mostrar preview do clube.
- Mostrar quantidade de membros.
- Mostrar regras.
- Mostrar botao "Entrar no clube".
- Esconder chat e posts privados se necessario.

Se o clube estiver vazio:

- Sugerir criar primeiro post.
- Sugerir escolher dorama da semana.
- Sugerir convidar membros.

---

## Ideias extras para depois

- Thread por episodio.
- Biblioteca do clube.
- Top 10 do clube.
- Mural de teorias.
- Area "passei pano ou condeno".
- Certificado de maratona do clube.
- Card compartilhavel do ranking semanal.
- Resumo mensal do clube.
- Integracao com Telegram por pessoa/clube.
- Recomendacao automatica de doramas pelo gosto dos membros.
- Calendario compartilhavel.
- Exportar evento para Google Calendar.
- Canal de spoilers por episodio.
- Pedido para entrar em clube privado.
- Denunciar post/comentario.
- Fixar posts importantes.
- Busca dentro do clube.

---

## Prioridade pratica agora

Para sair do "ta muito ruim" rapido:

1. Criar Feed + posts + comentarios. Status: iniciado usando o mural atual de comentarios.
2. Criar Dorama da semana. Status: feito no app + migracao 31 rodada no Supabase.
3. Criar Enquete simples. Status: feito no app + migracao 32 rodada no Supabase.
4. Melhorar topo do clube. Status: feito no app, com painel/resumo do clube.
5. Criar aba Membros/Sobre. Status: feito no app + migracao 30.

Depois disso, o clube ja fica com cara de comunidade. Chat, eventos e ranking entram como a proxima camada.

---

## Diario de execucao

### 2026-06-25 - Codex

- Criado `CLUBES_PLANO_COMPLETO.md` como roteiro principal dos clubes.
- Implementada primeira reorganizacao da tela de clube:
  - Abas novas: Feed, Doramas, Ranking, Sobre.
  - Header/painel do clube com nome, descricao, membros, cargo, codigo e destaque.
  - Aba Sobre com descricao, regras, membros, convidar, renomear e sair.
- Criada a migracao `30 - clubes-sobre-e-cargos.sql`.
  - Adiciona `clubs.description`.
  - Adiciona `clubs.rules`.
  - Adiciona `club_members.role`.
  - Atualiza `club_members_list` para retornar cargo.
  - Cria `update_club_details`.
- Usuario confirmou que rodou a migracao 30 no Supabase.
- Build validado com `npm.cmd run build`.

### 2026-06-25 - Codex, continuacao

- Criada a migracao `31 - clube-dorama-em-destaque.sql`.
  - Tabela `club_featured_dramas`.
  - Tabela `club_drama_checkins`.
  - RPC `set_club_featured_drama`.
  - RPC `save_club_drama_checkin`.
  - RPC `club_current_featured_drama`.
- Implementado no app:
  - Card "Dorama do clube" na aba Doramas.
  - Dono/moderador pode fixar um dorama da propria lista como destaque.
  - Membro pode salvar check-in com episodio atual e status.
  - Header do clube passa a mostrar o dorama oficial quando existir.
  - Card mostra media de episodios e check-ins dos membros.
- Build validado com `npm.cmd run build`.
- Usuario confirmou que rodou a migracao 31 no Supabase em 2026-06-26.

### Proximo bloco sugerido

- Chat do clube.
- Pontos e desafios semanais.

### 2026-06-26 - Codex

- Commit criado antes de avancar:
  - `c6c535a` - `Melhora clubes com sobre e dorama em destaque`.
- Criada a migracao `32 - clubes-enquetes-livres.sql`.
  - Tabela `club_polls`.
  - Tabela `club_poll_options`.
  - Tabela `club_poll_votes`.
  - RPC `create_club_poll`.
  - RPC `vote_club_poll`.
  - RPC `close_club_poll`.
  - RPC `club_polls_feed`.
- Implementado no app:
  - Secao "Enquetes do clube" na aba Doramas.
  - Criar enquete com opcoes por linha.
  - Votar em uma opcao.
  - Ver resultados com barra de progresso.
  - Dono/moderador pode encerrar enquete.
- Pendente:
  - Usuario confirmou que rodou a migracao 32 no Supabase em 2026-06-26.
  - Validar criando uma enquete real no clube.

### 2026-06-26 - Codex, eventos

- Criada a migracao `33 - clubes-eventos-e-presenca.sql`.
  - Tabela `club_events`.
  - Tabela `club_event_rsvps`.
  - RPC `create_club_event`.
  - RPC `set_club_event_rsvp`.
  - RPC `cancel_club_event`.
  - RPC `club_events_feed`.
- Implementado no app:
  - Nova aba `Eventos` dentro do clube.
  - Criar watch party, maratona, debate, votacao ou evento livre.
  - Vincular evento a um dorama da lista ou ao dorama oficial do clube.
  - Confirmar presenca: vou, talvez, nao vou.
  - Dono/moderador pode cancelar evento.
- Pendente:
  - Usuario confirmou que rodou a migracao 33 no Supabase em 2026-06-26.
  - Validar criando um evento real no clube.

### Proximo bloco em andamento

- Pontos e desafios semanais do clube.

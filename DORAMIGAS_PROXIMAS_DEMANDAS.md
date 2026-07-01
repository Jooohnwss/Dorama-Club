# Doramigas - Proximas demandas

Documento para organizar as proximas melhorias da area Doramigas.

Objetivo: deixar cada clube mais organizado, social e seguro, com conversa por episodio, perfis internos, moderacao clara e mural menos misturado.

---

## 1. Modo Episodio

### 1.1. Objetivo

Criar uma area propria para cada episodio do dorama atual do clube.

Hoje a conversa do clube pode misturar comentarios gerais, spoilers, teorias e progresso. O Modo Episodio resolve isso separando tudo por episodio.

### 1.2. Demandas

1. Criar uma lista de episodios para o dorama atual do clube.
2. Mostrar cards de episodio, por exemplo: `Ep. 1`, `Ep. 2`, `Ep. 3`.
3. Permitir que cada pessoa marque `Ja vi este episodio`.
4. Permitir que cada pessoa desmarque o episodio se marcou errado.
5. Mostrar quantas pessoas do clube ja viram cada episodio.
6. Mostrar se a pessoa logada ja viu aquele episodio.
7. Abrir uma tela ou painel de detalhes do episodio.
8. Separar comentarios/surtos por episodio.
9. Bloquear comentarios com spoiler para quem ainda nao marcou aquele episodio como visto.
10. Mostrar aviso quando o conteudo estiver bloqueado por spoiler.

### 1.3. Nota do episodio

1. Permitir nota de `1 a 5 estrelas` para cada episodio.
2. Cada pessoa pode votar uma vez por episodio.
3. A pessoa pode alterar sua nota depois.
4. Mostrar a nota da pessoa logada.
5. Mostrar a media do clube para aquele episodio.
6. Mostrar quantidade de avaliacoes.
7. Usar estrelas na interface, com fallback textual no documento:
   - `1 estrela`
   - `2 estrelas`
   - `3 estrelas`
   - `4 estrelas`
   - `5 estrelas`
8. Permitir estado sem nota: `Ainda sem nota`.

### 1.4. Indicadores por episodio

1. Media do clube.
2. Quantidade de pessoas que ja viram.
3. Quantidade de comentarios.
4. Quantidade de teorias.
5. Episodio mais bem avaliado.
6. Episodio mais comentado.
7. Episodio mais surtado.

### 1.5. Primeira versao sugerida

1. Criar tabela/funcoes no Supabase para progresso por episodio.
2. Criar tabela/funcoes no Supabase para nota por episodio.
3. Criar tela/lista de episodios no front.
4. Criar botao `Ja vi`.
5. Criar seletor de estrelas.
6. Exibir media e total de votos.
7. Ligar comentarios do mural ao episodio.

---

## 2. Mural com Abas

### 2.1. Objetivo

Organizar o mural do clube para nao misturar tudo no mesmo lugar.

### 2.2. Abas sugeridas

1. Geral
2. Episodios
3. Teorias
4. Memes
5. Agenda
6. Finalizados

### 2.3. Demandas

1. Criar filtro visual por aba no mural.
2. Manter `Geral` como aba padrao.
3. Fazer posts de episodio aparecerem na aba `Episodios`.
4. Fazer posts marcados como teoria aparecerem na aba `Teorias`.
5. Permitir posts leves/divertidos na aba `Memes`.
6. Mostrar eventos e encontros na aba `Agenda`.
7. Mostrar historico de doramas encerrados na aba `Finalizados`.
8. Manter a trava de spoiler funcionando em todas as abas.
9. Evitar duplicar conteudo quando a pessoa muda de aba.
10. Criar estado vazio especifico para cada aba.

### 2.4. Relacao com Modo Episodio

1. A aba `Episodios` deve ser a porta de entrada para o Modo Episodio.
2. Comentarios de episodio devem aparecer dentro do episodio certo.
3. A aba `Geral` nao deve ficar poluida com todos os comentarios de episodio.

---

## 3. Perfis dentro do Clube

### 3.1. Objetivo

Dar mais identidade para cada membro dentro do clube.

### 3.2. Informacoes do perfil no clube

1. Nome.
2. Foto/avatar.
3. Cargo no clube:
   - dono
   - moderador
   - membro
4. Progresso no dorama atual.
5. Ultimo check-in.
6. Quantidade de doramas em comum com voce.
7. Compatibilidade.
8. Generos favoritos.
9. Badges sociais do clube.

### 3.3. Badges possiveis

1. Mais ativo.
2. Teorico do grupo.
3. Maratonista.
4. Rei/Rainha dos surtos.
5. Sempre vota.
6. Comentou mais episodios.
7. Terminou primeiro.
8. Especialista em romance.
9. Especialista em sofrimento.

### 3.4. Demandas

1. Criar card de membro mais completo.
2. Abrir painel de perfil ao tocar em um membro.
3. Mostrar cargo e progresso.
4. Mostrar compatibilidade com a pessoa logada.
5. Mostrar doramas em comum.
6. Mostrar estatisticas basicas no clube.
7. Mostrar badges quando existirem.
8. Preparar espaco para acoes de moderacao quando a pessoa logada for dona/moderadora.

---

## 4. Moderacao Melhor

### 4.1. Objetivo

Dar ferramentas reais para dono/moderador manter o clube organizado.

### 4.2. Demandas para dono

1. Promover membro para moderador.
2. Rebaixar moderador para membro.
3. Remover membro.
4. Transferir dono quando necessario.
5. Excluir clube.
6. Editar nome do clube.
7. Editar descricao.
8. Editar regras.
9. Editar tags/vibes do clube.
10. Fixar aviso do clube.

### 4.3. Demandas para moderador

1. Remover membro comum.
2. Apagar comentario inadequado.
3. Fixar aviso.
4. Editar regras, se permitido.
5. Ajudar a organizar eventos e enquetes.

### 4.4. Regras de seguranca

1. Moderador nao pode remover dono.
2. Moderador nao pode remover outro moderador.
3. Membro comum nao ve acoes administrativas.
4. Toda acao destrutiva precisa de confirmacao.
5. Excluir clube deve ser permitido apenas para dono.
6. Transferencia de dono deve exigir confirmacao clara.

### 4.5. Avisos e regras fixadas

1. Criar campo `Aviso fixado`.
2. Mostrar aviso no topo do clube.
3. Permitir editar/remover aviso.
4. Criar area de regras com texto curto e objetivo.
5. Mostrar regras no Sobre do clube.

---

## 5. Relatorios e Memoria do Clube

### 5.1. Objetivo

Aproveitar os dados do Modo Episodio para criar memoria coletiva.

### 5.2. Relatorio do dorama finalizado

1. Melhor episodio pela media de estrelas.
2. Episodio mais comentado.
3. Episodio mais surtado.
4. Media final do dorama no clube.
5. Quem terminou primeiro.
6. Quantas pessoas terminaram.
7. Quantos comentarios o dorama gerou.
8. Linha do tempo do clube durante o dorama.

### 5.3. Arquivo do clube

1. Lista de doramas ja assistidos.
2. Nota media de cada dorama.
3. Melhor episodio de cada dorama.
4. Comentarios mais reagidos.
5. Pessoas que participaram.
6. Data de inicio e fim.

---

## 6. Ordem recomendada de implementacao

### 6.1. Fase 1 - Base do Modo Episodio

1. Criar migracao de progresso por episodio.
2. Criar migracao de nota por episodio.
3. Criar funcoes Supabase para salvar/listar progresso.
4. Criar funcoes Supabase para salvar/listar notas.
5. Criar UI de lista de episodios.
6. Criar botao `Ja vi`.
7. Criar seletor de estrelas.
8. Mostrar media do episodio.

### 6.2. Fase 2 - Comentarios por episodio

1. Vincular comentario a episodio.
2. Mostrar comentarios dentro do episodio.
3. Aplicar trava de spoiler por episodio.
4. Criar contador de comentarios por episodio.
5. Separar teorias de comentarios gerais.

### 6.3. Fase 3 - Mural com Abas

1. Criar abas no mural.
2. Mover comentarios de episodio para aba `Episodios`.
3. Criar aba `Teorias`.
4. Criar aba `Agenda`.
5. Criar aba `Finalizados`.

### 6.4. Fase 4 - Perfis do Clube

1. Melhorar cards de membros.
2. Criar painel de perfil do membro.
3. Mostrar progresso, compatibilidade e doramas em comum.
4. Mostrar badges.
5. Integrar acoes de moderacao ao perfil.

### 6.5. Fase 5 - Moderacao e Memoria

1. Melhorar a tela Sobre/Regras.
2. Criar aviso fixado.
3. Melhorar acoes de dono/moderador.
4. Criar relatorio do dorama finalizado.
5. Criar arquivo do clube.

---

## 7. Prioridade pratica

1. `Modo Episodio + estrelas` deve vir primeiro.
2. `Comentarios por episodio` vem logo depois.
3. `Mural com abas` organiza a experiencia.
4. `Perfis do clube` aumenta senso de comunidade.
5. `Moderacao melhor` deixa o clube seguro para crescer.
6. `Relatorios e arquivo` deixam memoria e valor de longo prazo.

---

## 8. Observacoes de produto

1. Evitar transformar Doramigas em rede social generica.
2. Toda feature deve ajudar o clube a assistir, comentar ou decidir melhor.
3. Spoiler precisa ser tratado como regra central.
4. Estrelas por episodio devem ser simples e rapidas.
5. A tela precisa continuar leve no celular.
6. Dono/moderador deve ter ferramentas claras, mas sem poluir a experiencia de membro comum.

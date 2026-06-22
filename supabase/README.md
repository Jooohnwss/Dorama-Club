# Migrações SQL do Supabase

Rode cada arquivo **em ordem** no painel do Supabase:
**SQL Editor → New query → cole o conteúdo → Run.**

Cada arquivo é seguro pra rodar de novo (usa `if not exists` / `or replace`).

## Ordem

| # | Arquivo | O que faz | Fase |
|---|---------|-----------|------|
| 01 | `01 - criar-tabelas-perfil-e-doramas.sql` | Cria `profiles` e `dramas` + RLS + trigger de novo usuário | A (pronta) |
| 02 | `02 - criar-clube-feed-e-comentarios.sql` | Cria `clubs`, `club_members`, `activities`, `comments` + RLS + funções `create_club` / `join_club` / `my_clubs` / `club_members_list` | B |
| 03 | `03 - area-de-administradores.sql` | Função `is_admin()` + funções de painel (`admin_overview`, `admin_users`, `admin_clubs`, `admin_comments`, `admin_delete_comment`) | Admin |
| 04 | `04 - adicionar-semaforo-no-dorama.sql` | Coluna `semaforo` em `dramas` (Vale assistir?) | A |
| 05 | `05 - admin-excluir-usuario.sql` | Função `admin_delete_user` (admin exclui qualquer usuária + dados em cascata) | Admin |
| 06 | `06 - feed-do-clube.sql` | Função `club_feed` (mural do clube com autor) — comentários com trava de spoiler | B |
| 07 | `07 - criar-diario-de-surtos-e-casais.sql` | Tabelas `surtos` (diário por episódio) e `casais` (que eu shippo) + RLS | Pessoal |
| 08 | `08 - social-do-clube.sql` | Feed automático, "posso comentar com quem", dorama do mês (`club_picks`), ranking e diário compartilhado | B |
| 09 | `09 - codigo-de-convite-e-indicacao.sql` | Código de convite por pessoa (`invite_code`) + `invited_by` (quem convidou quem); `admin_users` mostra indicações | Social |
| 10 | `10 - reacoes-comuns-e-lista-compartilhada.sql` | Reações no mural (`comment_reactions`), doramas em comum (`club_dramas`) e lista compartilhada (`club_list` + votos) | B |
| 11 | `11 - favoritos-ranking-e-compatibilidade.sql` | `favoritos` (vilão/cena/trilha) + `club_ranking` turbinado + `club_compatibility` (% entre doramigas) | B |
| 12 | `12 - tema-na-conta-e-renomear-clube.sql` | `profiles.tema`/`tema_custom` (tema segue a conta) + `rename_club` | Polimento |
| 13 | `13 - criar-espaco-do-casal.sql` | Espaço do casal "Nós dois": `couples` (+código único), `couple_members` (máx. 2), `couple_dramas`, `couple_diary`, `couple_about`, `couple_letters` + RLS (só os 2 veem) + RPC `create_couple` / `join_couple` / `my_couple` / `couple_members_list` | Casal |
| 14 | `14 - tema-do-casal.sql` | Tema **compartilhado** do casal: colunas `tema` / `tema_custom` em `couples` (quando um muda, vale pros dois). Usa a policy de update da 13 | Casal |
| 15 | `15 - cartinha-fixa-do-casal.sql` | Coluna `pinned_letter` em `couples`: cartinha fixa no topo do casal (e usada na tela de "modo presente") | Casal |
| 16 | `16 - pet-do-casal.sql` | Tabela `couple_pet` (nome + carinha do mascote) + RLS (só o casal). Felicidade/acessórios são derivados das ações | Casal |
| 17 | `17 - tipo-de-pagina-do-diario.sql` | Coluna `kind` em `couple_diary`: diário vira álbum por tipo (episódio/date/cartinha/surto/momento/marco) | Casal |
| 18 | `18 - quiz-do-casal.sql` | Tabela `couple_quiz_answers` (resposta por pessoa/semana/pergunta) + RLS: quiz de compatibilidade semanal | Casal |
| 19 | `19 - recompensas-do-casal.sql` | Tabelas `couple_rewards` + `couple_reward_claims` + RLS: loja privada de vales/recompensas ("Nós 🔥") | Casal |
| 20 | `20 - distancia-desafios-e-limites.sql` | `couples.next_meet_date` (countdown) + `couple_member_prefs` (intensidade/consentimento) + `couple_challenge_log` (desafios, só metadados) + RLS | Casal/Distância |
| 21 | `21 - planos-do-casal.sql` | `couple_wishlist` (presentes/experiências) + `couple_dates` (calendário de encontros virtuais) + RLS | Casal/Distância |

## Convenção de nome

- Formato: **`NN - verbo-o-que-faz.sql`** (NN = 01, 02, 03...).
- O nome descreve a **ação** da migração, com verbo: `criar-`, `adicionar-`, `alterar-`, `remover-`.
  - Bom: `03 - adicionar-coluna-onde-assistir.sql`
  - Evite genérico: `03 - onde-assistir.sql`
- Nunca editar uma migração já rodada em produção; criar a próxima com o número seguinte.

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

## Convenção de nome

- Formato: **`NN - verbo-o-que-faz.sql`** (NN = 01, 02, 03...).
- O nome descreve a **ação** da migração, com verbo: `criar-`, `adicionar-`, `alterar-`, `remover-`.
  - Bom: `03 - adicionar-coluna-onde-assistir.sql`
  - Evite genérico: `03 - onde-assistir.sql`
- Nunca editar uma migração já rodada em produção; criar a próxima com o número seguinte.

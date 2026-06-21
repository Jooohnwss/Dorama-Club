# 📌 Pendências do Dorama Club

Coisas que ficaram pra depois — não esquecer. Atualizado em 2026-06-21.

---

## 🔧 Configuração (rápido, mas precisa fazer)

### 1. Rodar a migração 12 no Supabase
- Onde: painel do Supabase → **SQL Editor** → New query
- O quê: colar o conteúdo de `supabase/12 - tema-na-conta-e-renomear-clube.sql` e clicar em **Run**
- Pra quê: faz o **tema seguir a conta** (em qualquer aparelho) e habilita **renomear o clube**
- Sem isso: trocar tema não acompanha a pessoa em outro celular; renomear clube dá erro

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

# 🔔 Push com o app FECHADO — passo a passo

O código já está pronto. Faltam **4 passos seus** (uma vez só). Sem isso, o app
continua funcionando com avisos só com o app aberto/2º plano.

---

## 1) Rodar a migração 62
No Supabase → SQL Editor, rode `supabase/62 - push-subscriptions.sql`.

## 2) Gerar as chaves VAPID
No seu PC (precisa do Node):

```
npx web-push generate-vapid-keys
```

Vai imprimir uma **Public Key** e uma **Private Key**. Guarde as duas.

## 3) Colocar a chave PÚBLICA no app
Abra `config.js` e cole a **Public Key**:

```js
export const VAPID_PUBLIC_KEY = "COLE_A_PUBLIC_KEY_AQUI";
```

Faça commit/deploy (Vercel). Pronto do lado do app.

> Obs.: se o seu build **regenera** o config.js a partir de variáveis de
> ambiente, adicione `VAPID_PUBLIC_KEY` também nas envs do Vercel e no gerador.

## 4) Subir a função de envio (Supabase CLI)
Instale a CLI (se não tiver): https://supabase.com/docs/guides/cli

```
supabase login
supabase link --project-ref ieikmuxqunkajqhuoios

# segredos da função (a private NUNCA vai pro app):
supabase secrets set VAPID_PUBLIC_KEY="SUA_PUBLIC_KEY"
supabase secrets set VAPID_PRIVATE_KEY="SUA_PRIVATE_KEY"
supabase secrets set VAPID_SUBJECT="mailto:seu-email@exemplo.com"

# deploy da função (o código já está em supabase/functions/send-push):
supabase functions deploy send-push
```

---

## Testar
1. No app (celular), vá em **Nós → Ajustes → 🔔 Ativar avisos** e aceite.
2. Feche o app.
3. Pela sua namorada (ou outra aba logada como ela), **mande uma carta** no baralho.
4. Deve chegar a notificação no seu celular. 🎉

## Como funciona (resumo)
- Ao ativar, o app registra a **inscrição de push** do aparelho na tabela
  `push_subscriptions`.
- Ao mandar uma carta, o app chama a função **send-push**, que valida que vocês
  são do mesmo casal e envia o push com a chave privada (que só a função tem).
- O **service worker** (`sw.js`) recebe o push e mostra a notificação, mesmo com
  o app fechado.

Hoje o push está ligado pra **carta do baralho**. Depois dá pra estender pra
mensagem no chat do clube, mêsversário, etc. — é só chamar `sendPush(...)` no
evento que quiser.

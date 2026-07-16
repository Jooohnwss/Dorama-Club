# 🔔 Push com o app FECHADO — passo a passo

O código já está pronto. Faltam **4 passos seus** (uma vez só). Sem isso, o app
continua funcionando com avisos só com o app aberto/2º plano.

---

## 1) Rodar a migração 62
No Supabase → SQL Editor, rode `supabase/62 - push-subscriptions.sql`.

## 2) ✅ FEITO — chaves VAPID geradas
- Public: `BWxJTRjGZh3XttOSu4wWK6oVlXjfCWW86DAzR6yVOgGAUC0g0yXe_Pf0A0Z7sFVypB-oEikI6RoPO3R2hghTFCE`
- Private: armazenada somente nos Secrets da Edge Function. Nunca salve a chave privada no repositório.

## 3) ✅ FEITO — chave pública já no app
Está no `config.js` e no gerador do build (`scripts/generate-config.mjs`).

## 4) Subir a função de envio — jeito FÁCIL (pelo painel, sem CLI)
No **Supabase → Edge Functions**:
1. **Create a new function** → nome: `send-push`.
2. Cole o código de `supabase/functions/send-push/index.ts` → **Deploy**.
3. Vá em **Edge Functions → Secrets** (ou Project Settings → Edge Functions) e
   adicione:
   - `VAPID_PUBLIC_KEY` = a chave pública configurada em `scripts/generate-config.mjs`
   - `VAPID_PRIVATE_KEY` = a chave privada correspondente (não coloque no repositório)
   - `VAPID_SUBJECT` = `mailto:seu-email@exemplo.com`
   (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem sozinhos.)

### Alternativa (CLI, se preferir)
```
npx supabase login
npx supabase link --project-ref ieikmuxqunkajqhuoios
npx supabase secrets set VAPID_PUBLIC_KEY="..." VAPID_PRIVATE_KEY="..." VAPID_SUBJECT="mailto:seu-email@exemplo.com"
npx supabase functions deploy send-push
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

// Função Edge: envia push (app fechado) pra um usuário.
// Deploy: supabase functions deploy send-push
// Secrets necessários (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex.: mailto:voce@email.com)
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente da função.)
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:contato@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { toUser, title, body, url } = await req.json();
    if (!toUser) return new Response(JSON.stringify({ error: "toUser obrigatório" }), { status: 400, headers: cors });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Quem chamou? (valida o JWT do Authorization)
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(jwt);
    const caller = userData?.user?.id;
    if (!caller) return new Response(JSON.stringify({ error: "não autenticado" }), { status: 401, headers: cors });

    // Anti-abuso: só manda push pra quem é do MESMO casal que você.
    const { data: meus } = await admin.from("couple_members").select("couple_id").eq("user_id", caller);
    const { data: dele } = await admin.from("couple_members").select("couple_id").eq("user_id", toUser);
    const compartilham = (meus || []).some((a) => (dele || []).some((b) => b.couple_id === a.couple_id));
    if (!compartilham) return new Response(JSON.stringify({ error: "sem vínculo" }), { status: 403, headers: cors });

    const { data: subs } = await admin.from("push_subscriptions").select("endpoint, subscription").eq("user_id", toUser);
    const payload = JSON.stringify({ title: title || "Dorama Club", body: body || "", url: url || "/" });

    await Promise.all((subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(s.subscription, payload);
      } catch (e) {
        // inscrição expirada/invalida -> limpa
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }));

    return new Response(JSON.stringify({ ok: true, sent: (subs || []).length }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});

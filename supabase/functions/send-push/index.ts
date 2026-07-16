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
    const { toUser, toClub, title, body, url } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Quem chamou? (valida o JWT do Authorization)
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(jwt);
    const caller = userData?.user?.id;
    if (!caller) return new Response(JSON.stringify({ error: "não autenticado" }), { status: 401, headers: cors });

    // Descobre PRA QUEM enviar (lista de user_ids), validando vínculo com quem chamou.
    let alvos: string[] = [];
    if (toClub) {
      // Só se o caller também for membro do clube. Manda pra todo mundo, menos ele.
      const { data: membros } = await admin.from("club_members").select("user_id").eq("club_id", toClub);
      const ids = (membros || []).map((m) => m.user_id);
      if (!ids.includes(caller)) return new Response(JSON.stringify({ error: "sem vínculo" }), { status: 403, headers: cors });
      alvos = ids.filter((id) => id !== caller);
    } else if (toUser) {
      // Só se compartilham um casal.
      // Enviar para si mesmo é permitido para o botão de diagnóstico.
      const { data: meus } = await admin.from("couple_members").select("couple_id").eq("user_id", caller);
      const { data: dele } = caller === toUser
        ? { data: meus }
        : await admin.from("couple_members").select("couple_id").eq("user_id", toUser);
      const ok = caller === toUser || (meus || []).some((a) => (dele || []).some((b) => b.couple_id === a.couple_id));
      if (!ok) return new Response(JSON.stringify({ error: "sem vínculo" }), { status: 403, headers: cors });
      alvos = [toUser];
    } else {
      return new Response(JSON.stringify({ error: "toUser ou toClub obrigatório" }), { status: 400, headers: cors });
    }
    if (!alvos.length) return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...cors, "Content-Type": "application/json" } });

    const { data: subs } = await admin.from("push_subscriptions").select("endpoint, subscription, user_id").in("user_id", alvos);
    const payload = JSON.stringify({ title: title || "Dorama Club", body: body || "", url: url || "/" });

    const resultados = await Promise.all((subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(s.subscription, payload);
        return { ok: true };
      } catch (e) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
        return { ok: false, status: e?.statusCode || 0, error: e?.body || e?.message || String(e) };
      }
    }));

    const sent = resultados.filter((r) => r.ok).length;
    const failures = resultados.filter((r) => !r.ok);
    return new Response(JSON.stringify({
      ok: failures.length === 0,
      sent,
      failed: failures.length,
      error: failures[0]?.error || null,
      errors: failures.slice(0, 3),
    }), {
      status: failures.length && sent === 0 ? 502 : 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});

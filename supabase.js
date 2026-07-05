// Cliente Supabase: auth + sincronização da lista de doramas na nuvem.
// Usamos ?bundle (versão fixada) para baixar TUDO num arquivo só, em vez de
// uma cascata de ~10 requests ao CDN — isso deixava o primeiro load lento.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.108.2?bundle";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export function supabaseReady() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const supabase = supabaseReady()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

// ---------- AUTH ----------
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user || null;
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(session?.user || null, event));
  return () => data.subscription.unsubscribe();
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(String(email).trim(), {
    redirectTo: location.origin,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function renameClub(clubId, name) {
  const { error } = await supabase.rpc("rename_club", { p_club: clubId, p_name: name });
  if (error) throw error;
}

export async function updateClubDetails(clubId, payload) {
  const { error } = await supabase.rpc("update_club_details", {
    p_club: clubId,
    p_description: payload.description || "",
    p_rules: payload.rules || "",
    p_tags: payload.tags || [],
  });
  if (error) throw error;
}

// ---------- Push (notificações com app fechado) ----------
export async function savePushSubscription(userId, sub) {
  const j = sub.toJSON ? sub.toJSON() : sub;
  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: userId, endpoint: j.endpoint, subscription: j },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}
// Dispara um push pra outra pessoa (via função Edge send-push).
export async function sendPush(toUser, title, body, url) {
  try {
    await supabase.functions.invoke("send-push", { body: { toUser, title, body, url } });
  } catch { /* silencioso: se a função não estiver configurada, não atrapalha */ }
}
// Dispara um push pra todo o clube (menos quem chamou).
export async function sendPushClub(toClub, title, body, url) {
  try {
    await supabase.functions.invoke("send-push", { body: { toClub, title, body, url } });
  } catch { /* silencioso */ }
}

// ---------- Palpites do dorama ----------
export async function clubPredictionsFeed(clubId) {
  const { data, error } = await supabase.rpc("club_predictions_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}
export async function createClubPrediction(clubId, question, options, featuredId) {
  const { data, error } = await supabase.rpc("create_club_prediction", { p_club: clubId, p_question: question, p_options: options, p_featured: featuredId || null });
  if (error) throw error;
  return data;
}
export async function voteClubPrediction(predictionId, choice) {
  const { error } = await supabase.rpc("vote_club_prediction", { p_prediction: predictionId, p_choice: Number(choice) });
  if (error) throw error;
}
export async function resolveClubPrediction(predictionId, answer) {
  const { error } = await supabase.rpc("resolve_club_prediction", { p_prediction: predictionId, p_answer: Number(answer) });
  if (error) throw error;
}

export async function clubVotersTally(clubId) {
  const { data, error } = await supabase.rpc("club_voters_tally", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

// ---------- Hall da Fama ----------
export async function archiveClubHall(featuredId) {
  const { error } = await supabase.rpc("archive_club_hall", { p_featured: featuredId });
  if (error) throw error;
}
export async function clubHallList(clubId) {
  const { data, error } = await supabase.rpc("club_hall_list", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function setClubNotice(clubId, text) {
  const { error } = await supabase.rpc("set_club_notice", { p_club: clubId, p_text: text || "" });
  if (error) throw error;
}

export async function manageClubMember(clubId, userId, action) {
  const { error } = await supabase.rpc("manage_club_member", {
    p_club: clubId,
    p_user: userId,
    p_action: action,
  });
  if (error) throw error;
}

// ---------- PERFIL ----------
export async function loadProfile(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data || !data.name) return null;
  return {
    name: data.name || "",
    nickname: data.nickname || "",
    photo: data.photo || "",
    since: data.since ? String(data.since) : "",
    type: data.type || "",
    gender: data.gender || "",
    inviteCode: data.invite_code || "",
    invitedBy: data.invited_by || null,
    tema: data.tema || "",
    temaCustom: data.tema_custom || "",
  };
}

export async function saveTheme(userId, temaId, temaCustomJson) {
  const { error } = await supabase.from("profiles").update({ tema: temaId, tema_custom: temaCustomJson || null }).eq("id", userId);
  if (error) throw error;
}

// Procura quem tem aquele código de convite (retorna { id, name } ou null).
export async function findInviter(code) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name")
    .eq("invite_code", String(code).toUpperCase())
    .maybeSingle();
  if (error) return null;
  return data || null;
}

// Marca quem me convidou (uma vez só).
export async function setInvitedBy(userId, inviterId) {
  const { error } = await supabase.from("profiles").update({ invited_by: inviterId }).eq("id", userId);
  if (error) throw error;
}

export async function saveProfile(userId, profile) {
  const row = {
    id: userId,
    name: profile.name || "",
    nickname: profile.nickname || "",
    photo: profile.photo || "",
    since: profile.since ? Number(profile.since) : null,
    type: profile.type || "",
    gender: profile.gender || null,
  };
  const { error } = await supabase.from("profiles").upsert(row);
  if (error) throw error;
}

// ---------- DORAMAS ----------
// Converte entre o formato da UI (camelCase) e o do banco (snake_case).
function toRow(userId, drama) {
  return {
    id: drama.id,
    user_id: userId,
    tmdb_id: drama.tmdbId ?? null,
    title: drama.title,
    year: drama.year ? Number(drama.year) : null,
    episodes: drama.episodes ? Number(drama.episodes) : null,
    genres: Array.isArray(drama.genres) ? drama.genres : [],
    rating: drama.rating === "" || drama.rating == null ? null : Number(drama.rating) || null,
    cover: drama.cover || "",
    synopsis: drama.synopsis || "",
    status: drama.status || "wishlist",
    current_episode: Number(drama.currentEpisode || 0),
    mood: drama.mood || "",
    priority: drama.priority || "",
    reason: drama.reason || "",
    pause_reason: drama.pauseReason || "",
    drop_reason: drama.dropReason || "",
    favorite: Boolean(drama.favorite),
    comfort: Boolean(drama.comfort),
    note: drama.note || "",
    cry: String(drama.cry ?? ""),
    laugh: String(drama.laugh ?? ""),
    hype: String(drama.hype ?? ""),
    rage: String(drama.rage ?? ""),
    personal_rating: String(drama.personalRating ?? ""),
    recommend: drama.recommend || "",
    semaforo: drama.semaforo || "",
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row) {
  return {
    id: row.id,
    tmdbId: row.tmdb_id ?? undefined,
    title: row.title,
    year: row.year ?? "",
    episodes: row.episodes ?? 16,
    genres: row.genres || [],
    rating: row.rating ?? "",
    cover: row.cover || "",
    synopsis: row.synopsis || "",
    status: row.status || "wishlist",
    currentEpisode: row.current_episode ?? 0,
    mood: row.mood || "",
    priority: row.priority || "",
    reason: row.reason || "",
    pauseReason: row.pause_reason || "",
    dropReason: row.drop_reason || "",
    favorite: Boolean(row.favorite),
    comfort: Boolean(row.comfort),
    note: row.note || "",
    cry: row.cry || "",
    laugh: row.laugh || "",
    hype: row.hype || "",
    rage: row.rage || "",
    personalRating: row.personal_rating || "",
    recommend: row.recommend || "",
    semaforo: row.semaforo || "",
  };
}

export async function loadDramas(userId) {
  const { data, error } = await supabase
    .from("dramas")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function upsertDrama(userId, drama) {
  const { error } = await supabase.from("dramas").upsert(toRow(userId, drama));
  if (error) throw error;
}

export async function deleteDramaRemote(id) {
  const { error } = await supabase.from("dramas").delete().eq("id", id);
  if (error) throw error;
}

// ---------- CLUBES ----------
export async function createClub(name) {
  const { data, error } = await supabase.rpc("create_club", { p_name: name });
  if (error) throw error;
  return data; // linha de clubs
}

export async function joinClub(code) {
  const { data, error } = await supabase.rpc("join_club", { p_code: code });
  if (error) throw error;
  return data;
}

export async function myClubs() {
  const { data, error } = await supabase.rpc("my_clubs");
  if (error) throw error;
  return data || [];
}

export async function clubMembersList(clubId) {
  const { data, error } = await supabase.rpc("club_members_list", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function leaveClub(clubId) {
  const { error } = await supabase.rpc("leave_club", { p_club: clubId });
  if (error) throw error;
}

export async function deleteClub(clubId) {
  const { error } = await supabase.rpc("delete_club", { p_club: clubId });
  if (error) throw error;
}

// ---------- FEED / MURAL DO CLUBE ----------
export async function clubFeed(clubId) {
  const { data, error } = await supabase.rpc("club_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

// Data do último comentário do clube (pra avisar "tem novidade").
export async function clubLatestComment(clubId) {
  const { data, error } = await supabase
    .from("comments")
    .select("created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.created_at || null;
}

// Instante da coisa mais recente do clube (mural, novidades, chat, eventos).
export async function clubLastNewsAt(clubId) {
  const { data, error } = await supabase.rpc("club_last_news_at", { p_club: clubId });
  if (error) return null;
  return data || null;
}

export async function postComment(userId, clubId, comment) {
  const kind = ["geral", "teoria", "meme"].includes(comment.kind) ? comment.kind : "geral";
  const { error } = await supabase.from("comments").insert({
    club_id: clubId,
    user_id: userId,
    body: comment.body,
    tmdb_id: comment.tmdbId ?? null,
    drama_title: comment.dramaTitle || null,
    spoiler_episode: Number(comment.spoilerEpisode) || 0,
    kind,
    photo: comment.photo || null,
  });
  if (error) throw error;
}

export async function deleteOwnComment(id) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

// ---------- DIÁRIO DE SURTOS ----------
export async function loadSurtos(dramaId) {
  const { data, error } = await supabase
    .from("surtos")
    .select("*")
    .eq("drama_id", dramaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addSurto(userId, surto) {
  const { error } = await supabase.from("surtos").insert({
    user_id: userId,
    drama_id: surto.dramaId,
    episode: Number(surto.episode) || 0,
    body: surto.body,
    shared: Boolean(surto.shared),
  });
  if (error) throw error;
}

export async function deleteSurto(id) {
  const { error } = await supabase.from("surtos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- CASAIS QUE EU SHIPPO ----------
export async function loadCasais(userId) {
  const { data, error } = await supabase
    .from("casais")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCasal(userId, casal) {
  const { error } = await supabase.from("casais").insert({
    user_id: userId,
    names: casal.names,
    category: casal.category || null,
    drama_title: casal.dramaTitle || null,
  });
  if (error) throw error;
}

export async function deleteCasal(id) {
  const { error } = await supabase.from("casais").delete().eq("id", id);
  if (error) throw error;
}

// ---------- ESPAÇO DO CASAL ("Nós dois") ----------
// Criar espaço (gera código, entra como membro). Erros do banco sobem com mensagem.
export async function createCouple(title) {
  const { data, error } = await supabase.rpc("create_couple", { p_title: title || null });
  if (error) throw error;
  return data; // linha de couples
}

// Entrar por código (banco valida: existe / não cheio / já estou em um casal).
export async function joinCouple(code) {
  const { data, error } = await supabase.rpc("join_couple", { p_code: code });
  if (error) throw error;
  return data;
}

// Meu casal (ou null se não estou em nenhum).
// Busca direto pelas tabelas (fonte da verdade) — mais confiável que o RPC,
// e sempre traz a linha COMPLETA do casal (com o código).
export async function myCouple() {
  const { data: mem, error: e1 } = await supabase
    .from("couple_members")
    .select("couple_id")
    .limit(1)
    .maybeSingle();
  if (e1) throw e1;
  if (!mem) return null; // não estou em nenhum casal
  const { data, error } = await supabase
    .from("couples")
    .select("*")
    .eq("id", mem.couple_id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function coupleMembersList(coupleId) {
  const { data, error } = await supabase.rpc("couple_members_list", { p_couple: coupleId });
  if (error) throw error;
  return data || [];
}

// Sair / desfazer vínculo (apaga só a minha filiação).
export async function leaveCouple(coupleId) {
  const { error } = await supabase.from("couple_members").delete().eq("couple_id", coupleId);
  if (error) throw error;
}

// Editar a capa do casal (nome, frase, data especial).
export async function updateCoupleCapa(coupleId, capa) {
  const { error } = await supabase
    .from("couples")
    .update({
      title: capa.title ?? null,
      tagline: capa.tagline ?? null,
      special_date: capa.specialDate || null,
    })
    .eq("id", coupleId);
  if (error) throw error;
}

// Tema compartilhado do casal: quando um muda, vale pros dois (vive no casal).
export async function saveCoupleTheme(coupleId, temaId, temaCustomJson) {
  const { error } = await supabase
    .from("couples")
    .update({ tema: temaId, tema_custom: temaCustomJson || null })
    .eq("id", coupleId);
  if (error) throw error;
}

// Cartinha fixa do topo (e tela de "modo presente").
export async function saveCouplePinnedLetter(coupleId, texto) {
  const { error } = await supabase
    .from("couples")
    .update({ pinned_letter: texto || null })
    .eq("id", coupleId);
  if (error) throw error;
}

// ---------- CLIMA / LIMITE DO DIA (Nós 2.0 Fase 2) ----------
export async function loadCoupleCheckins(coupleId, day) {
  const { data, error } = await supabase
    .from("couple_daily_checkins")
    .select("user_id, mood, day_limit, day")
    .eq("couple_id", coupleId)
    .eq("day", day);
  if (error) throw error;
  return data || [];
}

export async function upsertCoupleCheckin(coupleId, userId, day, fields) {
  const row = { couple_id: coupleId, user_id: userId, day };
  if (fields.mood !== undefined) row.mood = fields.mood;
  if (fields.dayLimit !== undefined) row.day_limit = fields.dayLimit;
  const { error } = await supabase.from("couple_daily_checkins").upsert(row, { onConflict: "couple_id,user_id,day" });
  if (error) throw error;
}

// ---------- LEDGER DE PONTOS (Nós 2.0) ----------
export async function loadPointsLedger(coupleId) {
  const { data, error } = await supabase
    .from("couple_points_ledger")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Lança uma linha no extrato. Anti-duplicação: ignora se (fonte) já existe.
export async function addPointsLedger(coupleId, userId, entry) {
  const { error } = await supabase.from("couple_points_ledger").upsert(
    {
      couple_id: coupleId,
      user_id: userId,
      points: Number(entry.points) || 0,
      type: entry.type || "earned",
      reason: entry.reason || null,
      source_type: entry.sourceType || "",
      source_id: String(entry.sourceId ?? ""),
    },
    { onConflict: "couple_id,source_type,source_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

// ---------- À DISTÂNCIA: encontro, limites e desafios ----------
export async function updateCoupleMeetDate(coupleId, date) {
  const { error } = await supabase.from("couples").update({ next_meet_date: date || null }).eq("id", coupleId);
  if (error) throw error;
}

export async function updateCoupleLastMet(coupleId, date) {
  const { error } = await supabase.from("couples").update({ last_met_date: date || null }).eq("id", coupleId);
  if (error) throw error;
}

// ---- Telegram do casal (Fase 6) ----
export async function updateCoupleTelegram(coupleId, link) {
  const { error } = await supabase.from("couples").update({ telegram_link: link || null }).eq("id", coupleId);
  if (error) throw error;
}
export async function loadTelegramEvents(coupleId) {
  const { data, error } = await supabase
    .from("couple_telegram_events")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}
export async function addTelegramEvent(coupleId, userId, kind, note) {
  const { data, error } = await supabase.from("couple_telegram_events").insert({
    couple_id: coupleId, user_id: userId, kind: kind || "done", note: note || null,
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}
export async function deleteTelegramEvent(id) {
  const { error } = await supabase.from("couple_telegram_events").delete().eq("id", id);
  if (error) throw error;
}

// ---- Modo saudade (Fase 5) ----
export async function loadReunionList(coupleId) {
  const { data, error } = await supabase
    .from("couple_reunion_list")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addReunionItem(coupleId, userId, text) {
  const { error } = await supabase.from("couple_reunion_list").insert({
    couple_id: coupleId, created_by: userId, text,
  });
  if (error) throw error;
}
export async function setReunionDone(id, done) {
  const { error } = await supabase.from("couple_reunion_list").update({ done }).eq("id", id);
  if (error) throw error;
}
export async function deleteReunionItem(id) {
  const { error } = await supabase.from("couple_reunion_list").delete().eq("id", id);
  if (error) throw error;
}

export async function loadSaudade(coupleId) {
  const { data, error } = await supabase
    .from("couple_saudade")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}
export async function addSaudade(coupleId, userId, note) {
  const { error } = await supabase.from("couple_saudade").insert({
    couple_id: coupleId, user_id: userId, note: note || null,
  });
  if (error) throw error;
}
export async function deleteSaudade(id) {
  const { error } = await supabase.from("couple_saudade").delete().eq("id", id);
  if (error) throw error;
}

export async function loadCouplePrefs(coupleId) {
  const { data, error } = await supabase.from("couple_member_prefs").select("user_id, max_intensity, telegram").eq("couple_id", coupleId);
  if (error) throw error;
  return data || [];
}

export async function saveCoupleTelegram(coupleId, userId, telegram) {
  const { error } = await supabase.from("couple_member_prefs").upsert({
    couple_id: coupleId,
    user_id: userId,
    telegram: telegram || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "couple_id,user_id" });
  if (error) throw error;
}

export async function saveCouplePref(coupleId, userId, maxIntensity) {
  const { error } = await supabase.from("couple_member_prefs").upsert({
    couple_id: coupleId,
    user_id: userId,
    max_intensity: Number(maxIntensity) || 1,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function loadCoupleChallenges(coupleId) {
  const { data, error } = await supabase
    .from("couple_challenge_log")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCoupleChallengeLog(coupleId, userId, entry) {
  const { data, error } = await supabase.from("couple_challenge_log").insert({
    couple_id: coupleId,
    challenge_key: entry.key,
    intensity: Number(entry.intensity) || 1,
    done_by: userId,
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

export async function deleteCoupleChallengeLog(id) {
  const { error } = await supabase.from("couple_challenge_log").delete().eq("id", id);
  if (error) throw error;
}

// ---------- PLANOS DO CASAL (wishlist + calendário) ----------
export async function loadCoupleWishlist(coupleId) {
  const { data, error } = await supabase.from("couple_wishlist").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addCoupleWishlist(coupleId, userId, item) {
  const { error } = await supabase.from("couple_wishlist").insert({
    couple_id: coupleId, title: item.title, kind: item.kind || "presente", wanted_by: userId,
  });
  if (error) throw error;
}
export async function setWishlistDone(id, done) {
  const { error } = await supabase.from("couple_wishlist").update({ done }).eq("id", id);
  if (error) throw error;
}
export async function deleteWishlist(id) {
  const { error } = await supabase.from("couple_wishlist").delete().eq("id", id);
  if (error) throw error;
}

export async function loadCoupleDates(coupleId) {
  const { data, error } = await supabase.from("couple_dates").select("*").eq("couple_id", coupleId).order("when_at", { ascending: true });
  if (error) throw error;
  return data || [];
}
export async function addCoupleDate(coupleId, userId, date) {
  const { error } = await supabase.from("couple_dates").insert({
    couple_id: coupleId, title: date.title, kind: date.kind || "chamada", when_at: date.whenAt || null, created_by: userId,
  });
  if (error) throw error;
}
export async function setDateDone(id, done) {
  const { error } = await supabase.from("couple_dates").update({ done }).eq("id", id);
  if (error) throw error;
}
export async function deleteCoupleDate(id) {
  const { error } = await supabase.from("couple_dates").delete().eq("id", id);
  if (error) throw error;
}

// ---------- RECOMPENSAS DO CASAL ("Nós 🔥") ----------
export async function loadCoupleRewards(coupleId) {
  const { data, error } = await supabase
    .from("couple_rewards")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCoupleReward(coupleId, userId, reward) {
  const { error } = await supabase.from("couple_rewards").insert({
    couple_id: coupleId,
    title: reward.title,
    kind: reward.kind || "fofo",
    cost: Number(reward.cost) || 10,
    created_by: userId,
  });
  if (error) throw error;
}

export async function deleteCoupleReward(id) {
  const { error } = await supabase.from("couple_rewards").delete().eq("id", id);
  if (error) throw error;
}

export async function loadCoupleClaims(coupleId) {
  const { data, error } = await supabase
    .from("couple_reward_claims")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCoupleClaim(coupleId, userId, reward) {
  const { data, error } = await supabase.from("couple_reward_claims").insert({
    couple_id: coupleId,
    reward_id: reward.id,
    title: reward.title,
    kind: reward.kind || "fofo",
    cost: Number(reward.cost) || 0,
    claimed_by: userId,
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

export async function setClaimUsed(id, used) {
  const { error } = await supabase.from("couple_reward_claims").update({ used }).eq("id", id);
  if (error) throw error;
}

export async function setClaimStatus(id, status) {
  const { error } = await supabase
    .from("couple_reward_claims")
    .update({ status, used: status === "cumprido" })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCoupleClaim(id) {
  const { error } = await supabase.from("couple_reward_claims").delete().eq("id", id);
  if (error) throw error;
}

// ---- Surpresas programadas (Fase 4) ----
export async function loadCoupleSurprises(coupleId) {
  const { data, error } = await supabase
    .from("couple_surprises")
    .select("*")
    .eq("couple_id", coupleId)
    .order("reveal_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addCoupleSurprise(coupleId, userId, { title, message, reveal_date }) {
  const { data, error } = await supabase.from("couple_surprises").insert({
    couple_id: coupleId,
    created_by: userId,
    title: title || null,
    message,
    reveal_date,
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

export async function deleteCoupleSurprise(id) {
  const { error } = await supabase.from("couple_surprises").delete().eq("id", id);
  if (error) throw error;
}

// ---- Missoes secretas / cofrinho / fetiches (Fase 7) ----
export async function loadSecretMissions(coupleId) {
  const { data, error } = await supabase
    .from("couple_secret_missions")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addSecretMission(coupleId, userId, mission) {
  const { data, error } = await supabase.from("couple_secret_missions").insert({
    couple_id: coupleId,
    created_by: userId,
    target_user: mission.targetUser || null,
    title: mission.title,
    kind: mission.kind || "mensagem",
    intensity: Number(mission.intensity) || 1,
    due: mission.due || "hoje",
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

export async function setSecretMissionStatus(id, status) {
  const { error } = await supabase
    .from("couple_secret_missions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSecretMission(id) {
  const { error } = await supabase.from("couple_secret_missions").delete().eq("id", id);
  if (error) throw error;
}

export async function loadCoupleDesires(coupleId) {
  const { data, error } = await supabase
    .from("couple_desires")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCoupleDesire(coupleId, userId, desire) {
  const { data, error } = await supabase.from("couple_desires").insert({
    couple_id: coupleId,
    created_by: userId,
    category: desire.category || "mensagem",
    intensity: Number(desire.intensity) || 1,
    body: desire.body,
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

export async function voteRevealDesire(desire, userId) {
  const updates = desire.reveal_requested_by && desire.reveal_requested_by !== userId
    ? { revealed: true }
    : { reveal_requested_by: userId };
  const { error } = await supabase.from("couple_desires").update(updates).eq("id", desire.id);
  if (error) throw error;
}

export async function deleteCoupleDesire(id) {
  const { error } = await supabase.from("couple_desires").delete().eq("id", id);
  if (error) throw error;
}

export async function loadFetishPrefs(coupleId) {
  const { data, error } = await supabase
    .from("couple_fetish_prefs")
    .select("*")
    .eq("couple_id", coupleId);
  if (error) throw error;
  return data || [];
}

export async function saveFetishPref(coupleId, userId, tag, status) {
  const { error } = await supabase.from("couple_fetish_prefs").upsert({
    couple_id: coupleId,
    user_id: userId,
    tag,
    status,
    updated_at: new Date().toISOString(),
  }, { onConflict: "couple_id,user_id,tag" });
  if (error) throw error;
}

// ---------- QUIZ DO CASAL ----------
export async function loadCoupleQuiz(coupleId, week) {
  const { data, error } = await supabase
    .from("couple_quiz_answers")
    .select("q, user_id, answer")
    .eq("couple_id", coupleId)
    .eq("week", week);
  if (error) throw error;
  return data || [];
}

export async function saveCoupleQuizAnswer(coupleId, userId, week, q, answer) {
  const { error } = await supabase.from("couple_quiz_answers").upsert({
    couple_id: coupleId,
    week,
    q,
    user_id: userId,
    answer,
  });
  if (error) throw error;
}

// ---------- PET DO CASAL ----------
export async function loadCouplePet(coupleId) {
  const { data, error } = await supabase
    .from("couple_pet")
    .select("*")
    .eq("couple_id", coupleId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function saveCouplePet(coupleId, pet) {
  const { error } = await supabase.from("couple_pet").upsert({
    couple_id: coupleId,
    name: pet.name || null,
    species: pet.species || "🐶",
    color: pet.color || "",
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function loadCoupleDramas(coupleId) {
  const { data, error } = await supabase
    .from("couple_dramas")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCoupleDrama(coupleId, userId, drama) {
  const { error } = await supabase.from("couple_dramas").insert({
    couple_id: coupleId,
    tmdb_id: drama.tmdbId ?? null,
    title: drama.title,
    cover: drama.cover || null,
    status: drama.status || "wishlist",
    current_episode: Number(drama.currentEpisode || 0),
    episodes: Number(drama.episodes || 0),
    added_by: userId,
  });
  if (error) throw error;
}

export async function updateCoupleDrama(id, patch) {
  const row = {};
  if (patch.status != null) row.status = patch.status;
  if (patch.currentEpisode != null) row.current_episode = Number(patch.currentEpisode || 0);
  const { error } = await supabase.from("couple_dramas").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteCoupleDrama(id) {
  const { error } = await supabase.from("couple_dramas").delete().eq("id", id);
  if (error) throw error;
}

export async function loadCoupleDiary(coupleId) {
  const { data, error } = await supabase
    .from("couple_diary")
    .select("*")
    .eq("couple_id", coupleId)
    .order("watched_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCoupleDiary(coupleId, userId, entry) {
  const { data, error } = await supabase.from("couple_diary").insert({
    couple_id: coupleId,
    kind: entry.kind || "episodio",
    tmdb_id: entry.tmdbId ?? null,
    drama_title: entry.dramaTitle || null,
    episode: Number(entry.episode || 0),
    watched_on: entry.watchedOn || null,
    place: entry.place || null,
    snack: entry.snack || null,
    mood: entry.mood || null,
    chosen_by: entry.chosenBy || null,
    fav_moment: entry.favMoment || null,
    inside_joke: entry.insideJoke || null,
    note_him: entry.noteHim || null,
    note_her: entry.noteHer || null,
    who_cried: entry.whoCried || null,
    who_raged: entry.whoRaged || null,
    comment: entry.comment || null,
    photo: entry.photo || null,
    author_id: userId,
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

export async function deleteCoupleDiary(id) {
  const { error } = await supabase.from("couple_diary").delete().eq("id", id);
  if (error) throw error;
}

export async function loadCoupleAbout(coupleId) {
  const { data, error } = await supabase.from("couple_about").select("*").eq("couple_id", coupleId);
  if (error) throw error;
  return data || [];
}

export async function saveCoupleAbout(coupleId, userId, key, value) {
  const { error } = await supabase.from("couple_about").upsert(
    {
      couple_id: coupleId,
      key,
      value,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "couple_id,key" },
  );
  if (error) throw error;
}

export async function loadCoupleLetters(coupleId) {
  const { data, error } = await supabase
    .from("couple_letters")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addCoupleLetter(coupleId, userId, letter) {
  const { data, error } = await supabase.from("couple_letters").insert({
    couple_id: coupleId,
    kind: letter.kind || "memoria",
    body: letter.body,
    photo: letter.photo || null,
    reveal_at: letter.revealAt || null,
    author_id: userId,
  }).select("id").single();
  if (error) throw error;
  return data?.id || null;
}

export async function deleteCoupleLetter(id) {
  const { error } = await supabase.from("couple_letters").delete().eq("id", id);
  if (error) throw error;
}

// ---------- SOCIAL DO CLUBE ----------
const mesAtual = () => new Date().toISOString().slice(0, 7); // YYYY-MM

export async function logActivity(userId, clubId, text) {
  const { error } = await supabase.from("activities").insert({ club_id: clubId, user_id: userId, text });
  if (error) throw error;
}

export async function clubActivities(clubId) {
  const { data, error } = await supabase.rpc("club_activities", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function clubDramaProgress(clubId, tmdbId) {
  const { data, error } = await supabase.rpc("club_drama_progress", { p_club: clubId, p_tmdb: tmdbId });
  if (error) throw error;
  return data || [];
}

export async function pickMonth(userId, clubId, drama) {
  const { error } = await supabase.from("club_picks").upsert(
    {
      club_id: clubId,
      user_id: userId,
      month: mesAtual(),
      tmdb_id: drama.tmdbId ?? null,
      title: drama.title,
      cover: drama.cover || null,
    },
    { onConflict: "club_id,user_id,month" },
  );
  if (error) throw error;
}

export async function clubPicksTally(clubId) {
  const { data, error } = await supabase.rpc("club_picks_tally", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function clubRanking(clubId) {
  const { data, error } = await supabase.rpc("club_ranking", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function clubSharedSurtos(clubId) {
  const { data, error } = await supabase.rpc("club_shared_surtos", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

// ---------- Reações ----------
export async function clubReactions(clubId) {
  const { data, error } = await supabase.rpc("club_reactions", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function toggleReaction(commentId, emoji) {
  const { error } = await supabase.rpc("toggle_reaction", { p_comment: commentId, p_emoji: emoji });
  if (error) throw error;
}

export async function clubSurtoReactions(clubId) {
  const { data, error } = await supabase.rpc("club_surto_reactions", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function toggleSurtoReaction(surtoId, emoji) {
  const { error } = await supabase.rpc("toggle_surto_reaction", { p_surto: surtoId, p_emoji: emoji });
  if (error) throw error;
}

// ---------- Doramas em comum ----------
export async function clubDramas(clubId) {
  const { data, error } = await supabase.rpc("club_dramas", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

// ---------- Lista compartilhada ----------
export async function clubListFeed(clubId) {
  const { data, error } = await supabase.rpc("club_list_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function clubListAdd(clubId, drama) {
  const { error } = await supabase.rpc("club_list_add", {
    p_club: clubId,
    p_tmdb: drama.tmdbId ?? null,
    p_title: drama.title,
    p_cover: drama.cover || null,
  });
  if (error) throw error;
}

export async function clubListVote(listId, vote) {
  const { error } = await supabase.rpc("club_list_vote", { p_list: listId, p_vote: vote });
  if (error) throw error;
}

export async function clubListRemove(listId) {
  const { error } = await supabase.rpc("club_list_remove", { p_list: listId });
  if (error) throw error;
}

// ---------- Dorama em destaque do clube ----------
// Histórico de doramas do clube (atual + finalizados) — pro mural por dorama.
export async function clubFeaturedHistory(clubId) {
  const { data, error } = await supabase
    .from("club_featured_dramas")
    .select("tmdb_id, title, cover, status, starts_at")
    .eq("club_id", clubId)
    .order("starts_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function clubCurrentFeaturedDrama(clubId) {
  const { data, error } = await supabase.rpc("club_current_featured_drama", { p_club: clubId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] || null : data || null;
}

// ---- Ciclo de temporada do clube ----
export async function clubCycle(clubId) {
  const { data, error } = await supabase.rpc("club_cycle", { p_club: clubId });
  if (error) throw error;
  return Array.isArray(data) ? data[0] || null : data || null;
}
export async function clubOpenVoting(clubId) {
  const { error } = await supabase.rpc("club_open_voting", { p_club: clubId });
  if (error) throw error;
}
export async function clubCloseVoting(clubId) {
  const { error } = await supabase.rpc("club_close_voting", { p_club: clubId });
  if (error) throw error;
}

export async function setClubFeaturedDrama(clubId, drama, periodType = "week") {
  const { data, error } = await supabase.rpc("set_club_featured_drama", {
    p_club: clubId,
    p_tmdb: drama.tmdbId ?? null,
    p_title: drama.title,
    p_cover: drama.cover || null,
    p_period_type: periodType,
  });
  if (error) throw error;
  return data;
}

export async function saveClubDramaCheckin(featuredId, episode, status) {
  const { error } = await supabase.rpc("save_club_drama_checkin", {
    p_featured: featuredId,
    p_episode: Number(episode) || 0,
    p_status: status || "watching",
  });
  if (error) throw error;
}

// ---------- Modo Episódio: nota por episódio ----------
export async function clubEpisodeRatings(featuredId) {
  const { data, error } = await supabase.rpc("club_episode_ratings", { p_featured: featuredId });
  if (error) throw error;
  return data || [];
}

export async function rateClubEpisode(featuredId, episode, stars) {
  const { error } = await supabase.rpc("rate_club_episode", {
    p_featured: featuredId,
    p_episode: Number(episode) || 0,
    p_stars: Number(stars) || 0,
  });
  if (error) throw error;
}

// ---------- Enquetes livres do clube ----------
export async function clubPollsFeed(clubId) {
  const { data, error } = await supabase.rpc("club_polls_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function createClubPoll(clubId, question, options) {
  const { data, error } = await supabase.rpc("create_club_poll", {
    p_club: clubId,
    p_question: question,
    p_options: options,
  });
  if (error) throw error;
  return data;
}

export async function voteClubPoll(pollId, optionId) {
  const { error } = await supabase.rpc("vote_club_poll", { p_poll: pollId, p_option: optionId });
  if (error) throw error;
}

export async function closeClubPoll(pollId) {
  const { error } = await supabase.rpc("close_club_poll", { p_poll: pollId });
  if (error) throw error;
}

// ---------- Eventos do clube ----------
export async function clubEventsFeed(clubId) {
  const { data, error } = await supabase.rpc("club_events_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function createClubEvent(clubId, event) {
  const { data, error } = await supabase.rpc("create_club_event", {
    p_club: clubId,
    p_type: event.type || "watch_party",
    p_title: event.title,
    p_description: event.description || "",
    p_tmdb: event.tmdbId ?? null,
    p_drama_title: event.dramaTitle || null,
    p_starts_at: event.startsAt,
  });
  if (error) throw error;
  return data;
}

export async function setClubEventRsvp(eventId, status) {
  const { error } = await supabase.rpc("set_club_event_rsvp", { p_event: eventId, p_status: status });
  if (error) throw error;
}

export async function cancelClubEvent(eventId) {
  const { error } = await supabase.rpc("cancel_club_event", { p_event: eventId });
  if (error) throw error;
}

// ---------- Pontos e desafios do clube ----------
export async function clubPointsRanking(clubId) {
  const { data, error } = await supabase.rpc("club_points_ranking", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function clubChallengesFeed(clubId) {
  const { data, error } = await supabase.rpc("club_challenges_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function createClubChallenge(clubId, challenge) {
  const { data, error } = await supabase.rpc("create_club_challenge", {
    p_club: clubId,
    p_title: challenge.title,
    p_description: challenge.description || "",
    p_points: Number(challenge.points) || 10,
    p_ends_at: challenge.endsAt || null,
  });
  if (error) throw error;
  return data;
}

export async function completeClubChallenge(challengeId, proofText) {
  const { error } = await supabase.rpc("complete_club_challenge", {
    p_challenge: challengeId,
    p_proof_text: proofText || "",
  });
  if (error) throw error;
}

export async function closeClubChallenge(challengeId) {
  const { error } = await supabase.rpc("close_club_challenge", { p_challenge: challengeId });
  if (error) throw error;
}

// ---------- Chat do clube ----------
export async function clubChatFeed(clubId) {
  const { data, error } = await supabase.rpc("club_chat_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function createClubChatMessage(clubId, message) {
  const { data, error } = await supabase.rpc("create_club_chat_message", {
    p_club: clubId,
    p_body: message.body,
    p_has_spoiler: Boolean(message.hasSpoiler),
    p_episode_number: Number(message.episodeNumber) || 0,
    p_reply_to: message.replyTo || null,
  });
  if (error) throw error;
  return data;
}

export async function deleteClubChatMessage(messageId) {
  const { error } = await supabase.rpc("delete_club_chat_message", { p_message: messageId });
  if (error) throw error;
}

export async function clubChatReactions(clubId) {
  const { data, error } = await supabase.rpc("club_chat_reactions", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function toggleClubChatReaction(messageId, emoji) {
  const { error } = await supabase.rpc("toggle_club_chat_reaction", { p_message: messageId, p_emoji: emoji });
  if (error) throw error;
}

// ---------- Realtime do clube: chat ao vivo + presença (quem está online) ----------
export function subscribeClubRealtime(clubId, { onChatInsert, onChatDelete, onPresence, me } = {}) {
  if (!supabase) return null;
  const channel = supabase.channel(`club:${clubId}`, {
    config: { presence: { key: me?.id || "anon" } },
  });
  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "club_chat_messages", filter: `club_id=eq.${clubId}` }, (payload) => onChatInsert?.(payload.new))
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "club_chat_messages", filter: `club_id=eq.${clubId}` }, (payload) => onChatDelete?.(payload.old?.id))
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const online = [];
      for (const key of Object.keys(state)) {
        for (const p of state[key]) online.push(p);
      }
      onPresence?.(online);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED" && me?.id) {
        try { await channel.track({ user_id: me.id, name: me.name || "Membro" }); } catch { /* ignore */ }
      }
    });
  return channel;
}

export function unsubscribeChannel(channel) {
  if (channel && supabase) supabase.removeChannel(channel);
}

// Realtime do casal: avisa quando o "sobre" muda (ex.: carta do baralho enviada).
export function subscribeCoupleRealtime(coupleId, { onAboutChange } = {}) {
  if (!supabase) return null;
  const channel = supabase.channel(`couple:${coupleId}`);
  channel
    .on("postgres_changes", { event: "*", schema: "public", table: "couple_about", filter: `couple_id=eq.${coupleId}` }, (payload) => onAboutChange?.(payload))
    .subscribe();
  return channel;
}

// Meu extrato de pontos no clube (pra mostrar COMO pontuei).
export async function clubMyPointsLedger(clubId, userId) {
  const { data, error } = await supabase
    .from("club_points_ledger")
    .select("source_type, points, reason, created_at")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---------- Favoritos especiais ----------
export async function loadFavoritos(userId) {
  const { data, error } = await supabase.from("favoritos").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addFavorito(userId, fav) {
  const { error } = await supabase.from("favoritos").insert({
    user_id: userId,
    category: fav.category,
    value: fav.value,
    drama_title: fav.dramaTitle || null,
  });
  if (error) throw error;
}

export async function deleteFavorito(id) {
  const { error } = await supabase.from("favoritos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Compatibilidade ----------
export async function clubCompatibility(clubId) {
  const { data, error } = await supabase.rpc("club_compatibility", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

// ---------- ADMIN ----------
// E-mails dos admins não ficam em texto puro — só os hashes (djb2).
const ADMIN_HASHES = ["7mtvr7", "obnuib"];

function djb2(s) {
  let h = 5381;
  s = String(s || "").toLowerCase().trim();
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function isAdminEmail(email) {
  return ADMIN_HASHES.includes(djb2(email));
}

export async function adminOverview() {
  const { data, error } = await supabase.rpc("admin_overview");
  if (error) throw error;
  return data;
}

export async function adminUsers() {
  const { data, error } = await supabase.rpc("admin_users");
  if (error) throw error;
  return data || [];
}

export async function adminClubs() {
  const { data, error } = await supabase.rpc("admin_clubs");
  if (error) throw error;
  return data || [];
}

export async function adminDeleteUser(id) {
  const { error } = await supabase.rpc("admin_delete_user", { p_id: id });
  if (error) throw error;
}

export async function adminDeleteClub(id) {
  const { error } = await supabase.rpc("admin_delete_club", { p_id: id });
  if (error) throw error;
}

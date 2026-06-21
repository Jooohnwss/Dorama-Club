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
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return () => data.subscription.unsubscribe();
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
    inviteCode: data.invite_code || "",
    invitedBy: data.invited_by || null,
  };
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
  const { error } = await supabase.from("club_members").delete().eq("club_id", clubId);
  if (error) throw error;
}

// ---------- FEED / MURAL DO CLUBE ----------
export async function clubFeed(clubId) {
  const { data, error } = await supabase.rpc("club_feed", { p_club: clubId });
  if (error) throw error;
  return data || [];
}

export async function postComment(userId, clubId, comment) {
  const { error } = await supabase.from("comments").insert({
    club_id: clubId,
    user_id: userId,
    body: comment.body,
    tmdb_id: comment.tmdbId ?? null,
    drama_title: comment.dramaTitle || null,
    spoiler_episode: Number(comment.spoilerEpisode) || 0,
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
export const ADMIN_EMAILS = ["jonatas.w.silva.w@gmail.com", "abikeila_2001@outlook.com"];

export function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(String(email || "").toLowerCase());
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

export async function adminComments() {
  const { data, error } = await supabase.rpc("admin_comments");
  if (error) throw error;
  return data || [];
}

export async function adminDeleteComment(id) {
  const { error } = await supabase.rpc("admin_delete_comment", { p_id: id });
  if (error) throw error;
}

export async function adminDeleteUser(id) {
  const { error } = await supabase.rpc("admin_delete_user", { p_id: id });
  if (error) throw error;
}

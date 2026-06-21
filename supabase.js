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
  };
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

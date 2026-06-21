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
  const { error } = await supabase.from("couple_diary").insert({
    couple_id: coupleId,
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
    author_id: userId,
  });
  if (error) throw error;
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
  const { error } = await supabase.from("couple_letters").insert({
    couple_id: coupleId,
    kind: letter.kind || "memoria",
    body: letter.body,
    author_id: userId,
  });
  if (error) throw error;
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

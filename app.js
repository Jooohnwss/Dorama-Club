import { searchDramas, getDramaDetails, getEpisodeRuntime, getWatchProviders, getBackdrop, trendingWeek, discoverDramas, tmdbReady } from "./tmdb.js";
import { temas, acharTema, temaPadrao, categorias } from "./temas.js";
import {
  supabaseReady,
  getCurrentUser,
  signUp,
  signIn,
  signOut,
  onAuthChange,
  loadProfile,
  saveProfile as saveProfileRemote,
  findInviter,
  setInvitedBy,
  resetPassword,
  updatePassword,
  renameClub,
  updateClubDetails,
  manageClubMember,
  setClubNotice,
  saveTheme,
  loadDramas,
  upsertDrama,
  deleteDramaRemote,
  createClub,
  joinClub,
  myClubs,
  clubMembersList,
  leaveClub,
  deleteClub,
  clubFeed,
  clubLatestComment,
  clubLastNewsAt,
  postComment,
  deleteOwnComment,
  loadSurtos,
  addSurto,
  deleteSurto,
  loadCasais,
  addCasal,
  deleteCasal,
  logActivity,
  clubActivities,
  clubDramaProgress,
  pickMonth,
  clubPicksTally,
  clubRanking,
  clubSharedSurtos,
  clubReactions,
  toggleReaction,
  clubSurtoReactions,
  toggleSurtoReaction,
  clubDramas,
  clubListFeed,
  clubListAdd,
  clubListVote,
  clubListRemove,
  clubCurrentFeaturedDrama,
  clubFeaturedHistory,
  clubCycle,
  clubOpenVoting,
  clubCloseVoting,
  setClubFeaturedDrama,
  saveClubDramaCheckin,
  clubEpisodeRatings,
  rateClubEpisode,
  clubPollsFeed,
  createClubPoll,
  voteClubPoll,
  closeClubPoll,
  clubEventsFeed,
  createClubEvent,
  setClubEventRsvp,
  cancelClubEvent,
  clubPointsRanking,
  clubChallengesFeed,
  createClubChallenge,
  completeClubChallenge,
  closeClubChallenge,
  clubChatFeed,
  createClubChatMessage,
  deleteClubChatMessage,
  clubChatReactions,
  toggleClubChatReaction,
  subscribeClubRealtime,
  subscribeCoupleRealtime,
  unsubscribeChannel,
  clubMyPointsLedger,
  loadFavoritos,
  addFavorito,
  deleteFavorito,
  clubCompatibility,
  isAdminEmail,
  adminOverview,
  adminUsers,
  adminClubs,
  adminDeleteUser,
  adminDeleteClub,
  createCouple,
  joinCouple,
  myCouple,
  coupleMembersList,
  leaveCouple,
  updateCoupleCapa,
  saveCoupleTheme,
  saveCouplePinnedLetter,
  loadCouplePet,
  saveCouplePet,
  loadCoupleQuiz,
  saveCoupleQuizAnswer,
  loadCoupleRewards,
  addCoupleReward,
  deleteCoupleReward,
  loadCoupleClaims,
  addCoupleClaim,
  setClaimUsed,
  setClaimStatus,
  deleteCoupleClaim,
  loadCoupleSurprises,
  addCoupleSurprise,
  deleteCoupleSurprise,
  loadSecretMissions,
  addSecretMission,
  setSecretMissionStatus,
  deleteSecretMission,
  loadCoupleDesires,
  addCoupleDesire,
  voteRevealDesire,
  deleteCoupleDesire,
  loadFetishPrefs,
  saveFetishPref,
  updateCoupleMeetDate,
  loadCouplePrefs,
  saveCouplePref,
  saveCoupleTelegram,
  loadCoupleChallenges,
  addCoupleChallengeLog,
  deleteCoupleChallengeLog,
  loadPointsLedger,
  addPointsLedger,
  loadCoupleCheckins,
  upsertCoupleCheckin,
  loadCoupleWishlist,
  addCoupleWishlist,
  setWishlistDone,
  deleteWishlist,
  loadCoupleDates,
  addCoupleDate,
  setDateDone,
  deleteCoupleDate,
  updateCoupleLastMet,
  updateCoupleTelegram,
  loadTelegramEvents,
  addTelegramEvent,
  deleteTelegramEvent,
  loadReunionList,
  addReunionItem,
  setReunionDone,
  deleteReunionItem,
  loadSaudade,
  addSaudade,
  deleteSaudade,
  loadCoupleDramas,
  addCoupleDrama,
  updateCoupleDrama,
  deleteCoupleDrama,
  loadCoupleDiary,
  addCoupleDiary,
  deleteCoupleDiary,
  loadCoupleAbout,
  saveCoupleAbout,
  loadCoupleLetters,
  addCoupleLetter,
  deleteCoupleLetter,
} from "./supabase.js";

const STORAGE_KEY = "dorama-club-state-v1";

const POSTER_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='120' height='180' fill='%23ffe2ef'/><text x='60' y='104' font-size='52' text-anchor='middle' fill='%23df4f94'>♥</text></svg>`,
  );

const AVATAR_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='96' height='96' fill='%23ffe2ef'/><circle cx='48' cy='38' r='18' fill='%23df4f94'/><path d='M16 86c0-18 14-28 32-28s32 10 32 28' fill='%23df4f94'/></svg>`,
  );

function avatarUrl(profile) {
  return profile?.photo || AVATAR_PLACEHOLDER;
}

// Lê uma imagem do aparelho e devolve um data URL JPEG redimensionado (leve).
function resizeImage(file, max = 256) {
  const desenhar = (bitmapOrImg, w0, h0, revoke) => {
    const scale = Math.min(1, max / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmapOrImg, 0, 0, w, h);
    if (revoke) URL.revokeObjectURL(revoke);
    return canvas.toDataURL("image/jpeg", 0.82);
  };
  // Caminho 1 (mais robusto p/ fotos grandes): createImageBitmap.
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file)
      .then((bmp) => desenhar(bmp, bmp.width, bmp.height))
      .catch(() => resizeImageFallback(file, max, desenhar));
  }
  return resizeImageFallback(file, max, desenhar);
}
function resizeImageFallback(file, max, desenhar) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try { resolve(desenhar(img, img.width, img.height, url)); }
      catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("não deu pra decodificar a imagem (formato?)")); };
    img.src = url;
  });
}

const statuses = [
  { key: "watching", label: "Assistindo" },
  { key: "wishlist", label: "Quero assistir" },
  { key: "finished", label: "Já assisti" },
  { key: "paused", label: "Pausados" },
  { key: "dropped", label: "Dropei" },
  { key: "favorites", label: "Favoritos" },
  { key: "comfort", label: "Dorama conforto" },
];

const pauseReasons = ["Estava sem tempo", "Ficou meio lento", "Quero voltar depois", "Não estava no clima", "Preciso de psicológico", "Comecei outro e esqueci"];
const dropReasons = ["Ficou chato", "Muito enrolado", "Casal sem química", "Passei raiva demais", "Não era meu estilo", "Talvez eu volte depois", "Não aguentei o protagonista", "Me prometeram tudo e entregaram nada"];
const semaforoOptions = [
  ["", "—"],
  ["verde", "🟢 Sim, perfeito"],
  ["amarelo", "🟡 Só se tiver paciência"],
  ["vermelho", "🔴 Não recomendo"],
  ["partido", "💔 Só se quiser sofrer"],
];

const dramaTypes = [
  "A que chora em todo episódio",
  "A que ama um CEO frio",
  "A que passa raiva e continua assistindo",
  "A que torce pelo vilão",
  "A que dropa no episódio 3",
  "A que só assiste romance",
  "A que ama sofrer",
  "A que sempre recomenda dorama triste",
];

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Forma canônica de um dorama. Serve de base para migração: qualquer dorama
// salvo antes de um campo existir recebe o valor padrão ao carregar o estado.
const dramaDefaults = {
  title: "",
  year: new Date().getFullYear(),
  episodes: 16,
  genres: [],
  rating: "",
  cover: "",
  synopsis: "",
  status: "wishlist",
  currentEpisode: 0,
  mood: "",
  priority: "",
  reason: "",
  pauseReason: "",
  dropReason: "",
  favorite: false,
  comfort: false,
  note: "",
  cry: "",
  laugh: "",
  hype: "",
  rage: "",
  personalRating: "",
  recommend: "",
  semaforo: "",
};

function normalizeDrama(drama) {
  return { ...dramaDefaults, ...drama, genres: Array.isArray(drama.genres) ? drama.genres : [] };
}

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaults));
}

const defaults = {
  view: "home",
  activeList: "watching",
  profile: null,
  dramas: [],
  club: null,
  clubs: [],
  couple: null,
  space: "solo", // "solo" (app normal) | "couple" (ambiente do casal "Nós dois")
};

let state = loadState();
let modal = null;
let uiModal = null; // confirm/prompt bonito (substitui os popups do navegador)

function uiModalTemplate() {
  if (!uiModal) return "";
  if (uiModal.type === "confirm") {
    return `
      <div class="modal ui-modal">
        <section class="modal-card ui-card">
          <h3>${esc(uiModal.message)}</h3>
          ${uiModal.sub ? `<p class="muted">${esc(uiModal.sub)}</p>` : ""}
          <div class="actions" style="justify-content:flex-end;margin-top:16px">
            <button class="btn ghost" data-ui-cancel>${esc(uiModal.cancel || "Cancelar")}</button>
            <button class="btn ${uiModal.danger ? "danger-solid" : ""}" data-ui-ok>${esc(uiModal.ok || "Confirmar")}</button>
          </div>
        </section>
      </div>`;
  }
  return `
    <div class="modal ui-modal">
      <section class="modal-card ui-card">
        <h3>${esc(uiModal.message)}</h3>
        <form id="ui-prompt-form" class="form-grid" style="margin-top:12px">
          <div class="field full">
            <input id="ui-input" name="v" type="${uiModal.inputType || "text"}" value="${esc(uiModal.value ?? "")}" placeholder="${esc(uiModal.placeholder || "")}" ${uiModal.inputType === "number" ? 'min="0"' : ""} autocomplete="off" />
          </div>
          <div class="actions field full" style="justify-content:flex-end">
            <button class="btn ghost" type="button" data-ui-cancel>Cancelar</button>
            <button class="btn" type="submit">${esc(uiModal.ok || "OK")}</button>
          </div>
        </form>
      </section>
    </div>`;
}

function bindUiModal() {
  if (!uiModal) return;
  const fechar = (valor) => {
    const resolver = uiModal.resolve;
    uiModal = null;
    render();
    resolver(valor);
  };
  listen(document.querySelector("[data-ui-cancel]"), "click", () => fechar(uiModal.type === "confirm" ? false : null));
  listen(document.querySelector("[data-ui-ok]"), "click", () => fechar(true));
  const form = document.querySelector("#ui-prompt-form");
  if (form) listen(form, "submit", (event) => { event.preventDefault(); fechar(document.querySelector("#ui-input").value); });
  const input = document.querySelector("#ui-input");
  if (input) { input.focus(); input.select?.(); }
}

function confirmar(message, opts = {}) {
  return new Promise((resolve) => {
    uiModal = { type: "confirm", message, ...opts, resolve };
    render();
  });
}

function perguntar(message, value = "", opts = {}) {
  return new Promise((resolve) => {
    uiModal = { type: "prompt", message, value, ...opts, resolve };
    render();
  });
}
let toastTimer = null;
// Estado transitório da busca (não persiste no localStorage).
let search = { query: "", loading: false, results: [], selected: null, error: "" };
let manualAdd = false; // form de adicionar manualmente (quando não acha no TMDB)
// Auth (preenchido em tempo de execução quando o Supabase está configurado).
let authUser = null;
let authMode = "signin"; // "signin" | "signup"
let authBusy = false;
let recovery = false; // tela de "definir nova senha" após clicar no link do e-mail
let renderEvents = null;
let initStarted = false;
let unsubscribeAuth = null;
// Membros do clube atual (carregados sob demanda).
let clubMembers = [];
let clubMembersFor = null; // id do clube cujos membros já buscamos (evita loop)
let clubFeedItems = [];
let clubFeedFor = null; // id do clube cujo feed já buscamos (evita loop)
let clubTab = "inicio"; // aba interna da tela Doramigas (lobby)
let epDetailOpen = null; // episódio aberto no Modo Episódio (discussão por ep)
let clubProfileOpen = null; // user_id do membro com o perfil aberto (aba Sobre)
let revealedPosts = new Set(); // posts cujo spoiler o leitor escolheu ver
let clubMuralFilter = null; // null = dorama atual; "all" = tudo; ou um tmdb_id
let clubMuralTab = "geral"; // aba de tipo do mural: geral | episodios | teorias | memes | agenda | finalizados
let clubChannel = null; // canal Realtime do clube (chat + presença)
let clubChannelFor = null; // id do clube cujo canal está ativo
let coupleChannel = null; // canal Realtime do casal (baralho ao vivo)
let coupleChannelFor = null;
let clubOnline = []; // [{user_id, name}] presentes agora
let clubChatSpoilerOn = false; // toggle de spoiler no compositor do chat
let chatDraft = ""; // texto do chat preservado entre re-renders
let revealedChat = new Set(); // mensagens de spoiler reveladas pelo leitor
let chatReactPicker = null; // id da mensagem com o seletor de reação aberto
let commentDraft = null; // id do dorama pré-selecionado ao "comentar surto"
let clubDebateDraft = null; // dorama avulso da lista do clube para abrir debate no mural
let listSort = "recente"; // ordenação da Minhas listas
let listView = "lista"; // "lista" | "grade"
let addingClub = false; // mostrar formulários de criar/entrar mesmo já tendo clube

// ---------- Tutorial / onboarding ----------
const TUTORIAL_KEY = "dorama-club-tutorial-visto";
const TUTORIAL_CASAL_KEY = "dorama-club-tutorial-casal-visto";
let tutorial = null; // { step, kind } quando aberto ("geral" | "casal")
let tutorialChecked = false; // auto-abrir geral só 1x por sessão (e evita loop de render)
let tutorialCasalChecked = false; // auto-abrir casal só 1x por sessão

// Passos do tutorial geral (slides curtos). emoji + título + corpo.
const TUTORIAL_STEPS = [
  { emoji: "💜", title: "Bem-vinda ao Dorama Club", body: "Seu cantinho pra organizar doramas, marcar seus surtos e dividir tudo com as doramigas. Vou te mostrar o básico em alguns toques — leva menos de um minuto." },
  { emoji: "➕", title: "Adicionar doramas", body: "Toque em <strong>Descobrir</strong> ou use a busca pra achar um dorama. Ao adicionar, ele entra nas suas <strong>Listas</strong> (quero ver, assistindo, terminei…)." },
  { emoji: "▶️", title: "Atualizar episódios", body: "Na sua lista, toque no número do episódio pra dizer onde parou. Dá pra somar de um em um ou colocar o número exato — sem ficar apertando o + mil vezes." },
  { emoji: "😭", title: "Registrar surtos", body: "Abrindo um dorama você marca se <strong>chorou</strong>, <strong>surtou</strong> ou <strong>passou raiva</strong>, dá sua nota e guarda o momento favorito. Tudo vira sua linha do tempo dorameira." },
  { emoji: "👯", title: "Doramigas e clube", body: "Na aba <strong>Doramigas</strong> você cria ou entra num clube pelo código, surta no mural (com trava de spoiler!), vê o dorama do mês e o quanto combinam." },
  { emoji: "🌈", title: "Humor do dia", body: "Na <strong>Início</strong>, diz como tá se sentindo e o app sugere um dorama pra esse humor. Bom dia de chorar, dia de rir, dia de raiva — tem pra tudo." },
  { emoji: "🎨", title: "Temas", body: "No <strong>Perfil</strong> você troca o tema do app. Dá até pra montar um tema com as cores do seu dorama favorito. O símbolo lá em cima muda de cor junto. 💅" },
  { emoji: "💕", title: "Nós dois", body: "Tem um cantinho só do casal: doramas vistos juntos, memórias, cartinhas, dates, um pet e um tema só de vocês. Crie no seu <strong>Perfil → Espaço do casal</strong> e mande o código pra sua pessoa — depois um alternador <strong>🏠 / 💕</strong> aparece no topo pra trocar de ambiente." },
];

// Passos do tutorial do casal — só aparece pra quem já TEM um casal.
const TUTORIAL_STEPS_CASAL = [
  { emoji: "💕", title: "Bem-vindos ao cantinho de vocês", body: "Esse é o ambiente privado do casal: doramas vistos juntos, memórias, cartinhas, dates e um tema só de vocês. Só vocês dois enxergam. Te mostro rapidinho como usar." },
  { emoji: "🔑", title: "O código de vocês", body: "Cada casal tem um <strong>código</strong> (aparece na capa, em Início). Se a sua pessoa ainda não entrou, toque em <strong>Copiar código</strong> e mande pra ela — é por ele que ela entra no casal certo." },
  { emoji: "📺", title: "Assistindo juntos", body: "Na seção <strong>Assistindo</strong>, adicione um dorama da sua lista pessoal pro casal e marque em que episódio vocês estão. É a lista de vocês dois, separada da sua." },
  { emoji: "📖", title: "Registrar memória", body: "Em <strong>Diário</strong> (ou no botão “Memória” de um dorama), guarde cada date: lanche, onde assistiram, quem escolheu, quem chorou mais, notas dele/dela e o momento favorito. Vira o álbum de vocês." },
  { emoji: "🎲", title: "Sortear date", body: "Sem saber o que ver? Toque em <strong>Sortear date</strong> na capa: o app escolhe um dorama, um lanche e uma missão fofa pra noite de vocês." },
  { emoji: "🎨", title: "Tema de nós dois", body: "Na seção <strong>Tema</strong>, escolham as cores do cantinho (ou montem com um dorama favorito). É <strong>compartilhado</strong>: quando um muda, vale pros dois. 💞" },
  { emoji: "🔒", title: "É privado de verdade", body: "Nada do casal aparece nas Doramigas nem pra mais ninguém. Para trocar entre o app pessoal e o cantinho do casal, use o alternador <strong>Pessoal / Casal</strong>. Para encerrar o vínculo existe <strong>Sair deste casal</strong> em Ajustes." },
];

function tutorialSteps() {
  return tutorial?.kind === "casal" ? TUTORIAL_STEPS_CASAL : TUTORIAL_STEPS;
}
function tutorialVisto() {
  try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch { return false; }
}
function tutorialCasalVisto() {
  try { return localStorage.getItem(TUTORIAL_CASAL_KEY) === "1"; } catch { return false; }
}
function marcarTutorialVisto(kind) {
  try { localStorage.setItem(kind === "casal" ? TUTORIAL_CASAL_KEY : TUTORIAL_KEY, "1"); } catch { /* ignore */ }
}
function abrirTutorial(step = 0, kind = "geral") {
  tutorial = { step, kind };
  render();
}
function fecharTutorial(marcar) {
  if (marcar) marcarTutorialVisto(tutorial?.kind);
  tutorial = null;
  render();
}
function passoTutorial(delta) {
  if (!tutorial) return;
  const novo = tutorial.step + delta;
  if (novo < 0) return;
  if (novo >= tutorialSteps().length) { fecharTutorial(true); return; }
  tutorial = { ...tutorial, step: novo };
  render();
}

function tutorialTemplate() {
  if (!tutorial) return "";
  const steps = tutorialSteps();
  const i = Math.min(tutorial.step, steps.length - 1);
  const s = steps[i];
  const ultimo = i === steps.length - 1;
  return `
    <div class="modal tutorial-overlay">
      <section class="tutorial-card">
        <button class="tutorial-skip" type="button" data-tut-skip>Pular</button>
        <div class="tutorial-emoji">${s.emoji}</div>
        <h2>${s.title}</h2>
        <p>${s.body}</p>
        <div class="tutorial-dots">
          ${steps.map((_, n) => `<span class="${n === i ? "on" : ""}"></span>`).join("")}
        </div>
        <div class="tutorial-actions">
          ${i > 0 ? `<button class="btn ghost" type="button" data-tut-prev>Voltar</button>` : `<button class="btn ghost" type="button" data-tut-later>Ver depois</button>`}
          <button class="btn" type="button" data-tut-next>${ultimo ? (tutorial.kind === "casal" ? "Começar 💕" : "Começar 💜") : "Próximo"}</button>
        </div>
      </section>
    </div>`;
}

function bindTutorial() {
  if (!tutorial) return;
  listen(document.querySelector("[data-tut-skip]"), "click", () => fecharTutorial(true));
  listen(document.querySelector("[data-tut-later]"), "click", () => fecharTutorial(false));
  listen(document.querySelector("[data-tut-prev]"), "click", () => passoTutorial(-1));
  listen(document.querySelector("[data-tut-next]"), "click", () => passoTutorial(1));
}

// ---------- Modo presente (tela especial na 1ª visita da parceira) ----------
const PRESENTE_KEY = "dorama-club-presente-visto";
let presente = false;
let presenteChecked = false;
function presenteVisto() {
  try { return localStorage.getItem(PRESENTE_KEY) === "1"; } catch { return false; }
}
function marcarPresenteVisto() {
  try { localStorage.setItem(PRESENTE_KEY, "1"); } catch { /* ignore */ }
}
function presenteTemplate() {
  if (!presente) return "";
  const carta = (state.couple?.pinnedLetter || "").trim();
  return `
    <div class="modal presente-overlay">
      <section class="presente-card">
        <div class="presente-emoji">💝</div>
        <span class="presente-sel">Um cantinho só nosso</span>
        <h2>${esc(state.couple?.title || "Nós dois")}</h2>
        <p>${carta ? esc(carta) : "Eu fiz esse cantinho pra gente guardar nossos doramas, surtos e memórias. 💕"}</p>
        <button class="btn" type="button" data-presente-enter>Entrar no nosso cantinho 💕</button>
      </section>
    </div>`;
}
function bindPresente() {
  if (!presente) return;
  listen(document.querySelector("[data-presente-enter]"), "click", () => {
    marcarPresenteVisto();
    presente = false;
    render();
  });
}

// Troca o clube ativo (recarrega membros/feed/social do novo).
function trocarClubeAtivo(club) {
  state.club = club;
  clubMembers = [];
  clubMembersFor = null;
  clubFeedItems = [];
  clubFeedFor = null;
  clubDebateDraft = null;
  chatReplyTo = null;
  clubSocial = emptyClubSocial(null);
  addingClub = false;
}

function handleSwitchClub(id) {
  const club = (state.clubs || []).find((c) => c.id === id);
  if (club) {
    trocarClubeAtivo(club);
    setState({ club });
  }
}
let clubHasNews = false; // bolinha de novidade na aba Doramigas
const SEEN_CLUB_KEY = "dorama-club-visto";

async function checarNovidadesClube() {
  clubHasNews = false;
  if (!cloudOn() || !state.club) return;
  try {
    // Última coisa que rolou no clube (mural, novidades, chat, eventos).
    const ultimo = await clubLastNewsAt(state.club.id).catch(() => null) || await clubLatestComment(state.club.id);
    if (!ultimo) return;
    const visto = localStorage.getItem(SEEN_CLUB_KEY) || "";
    clubHasNews = new Date(ultimo).getTime() > new Date(visto || 0).getTime();
  } catch {
    /* ignore */
  }
}

function marcarClubeVisto() {
  try {
    localStorage.setItem(SEEN_CLUB_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
  clubHasNews = false;
}
// Social do clube (feed automático, dorama do mês, ranking, diário compartilhado).
function emptyClubSocial(id = null) {
  return {
    for: id,
    activities: [],
    picks: [],
    ranking: [],
    shared: [],
    reactions: [],
    surtoReactions: [],
    commonDramas: [],
    list: [],
    compat: [],
    featured: null,
    polls: [],
    events: [],
    points: [],
    challenges: [],
    chat: [],
    chatReactions: [],
    cycle: null,
    clubDramas: [],
    myPoints: [],
    epRatings: [],
    epCount: 0,
  };
}
let clubSocial = emptyClubSocial(null);
let chatReplyTo = null;
let clubWelcomeCard = null;
// Espaço "Nós dois" (carregado sob demanda).
let coupleFor = null;
let coupleMembers = [];
let coupleDramas = [];
let coupleDiary = [];
let coupleAbout = {};
let coupleLetters = [];
let coupleLoading = false;
let coupleSection = state.coupleSection || "inicio"; // seção interna do ambiente do casal (persistida)
let nosTab = "hoje"; // sub-aba dentro do "Nós 🔥": hoje | brincar | desejos | progresso
let cartaAtual = null; // carta puxada do baralho (ainda não enviada), local
let clubCommentFoto = null; // foto (data URL) pendente pro surto do clube
let coupleMemoryDraft = null; // dorama pré-selecionado ao "Registrar memória"
let coupleDiaryKind = "livre"; // tipo de página do diário sendo criada
let coupleDiaryDay = null; // dia (YYYY-MM-DD) aberto no caderno; null = hoje
let coupleDiaryFoto = null; // foto (data URL) pendente pra próxima página do diário
let coupleLetterFoto = null; // foto (data URL) pendente pra próxima cartinha
let recadoIndex = Math.floor(Math.random() * 1000); // qual recadinho mostrar no topo
let recadosExpandidos = false; // mostrar todos os recadinhos ou só os recentes
let cartinhasExpandidas = false; // mostrar todas as cartinhas ou só as recentes
let coupleAddSearch = { query: "", loading: false, results: [] }; // busca TMDB no add do casal
let clubAddSearch = { query: "", loading: false, results: [] }; // busca TMDB na sala de escolha do clube
let coupleAddCatSel = "watching"; // categoria escolhida no add do casal (persiste no re-render)
let temaSearchCasal = { query: "", loading: false, results: [] }; // busca de tema dentro do casal
let runtimeCache = {}; // tmdbId -> minutos por episódio (TMDB), pra estimar horas
let coupleRuntimesFor = null; // casal cujos runtimes já buscamos (evita loop)
let couplePet = null; // mascote do casal (linha de couple_pet)
let petReacao = ""; // mensagem transitória do pet ao cuidar
let coupleQuiz = []; // respostas do quiz da semana [{q,user_id,answer}]
let coupleQuizFor = null; // "coupleId:week" já carregado (evita loop)
let coupleWishlist = []; // lista de desejos (presentes/experiências)
let coupleDates = []; // calendário de encontros virtuais
let coupleReunion = []; // "pra quando a gente se ver" (modo saudade)
let coupleSaudade = []; // recadinhos de saudade
let planosFor = null; // casal cujos planos já carregamos (evita loop)
// "Nós 🔥": loja privada de recompensas (só pra um casal específico).
// Os e-mails não ficam em texto puro — só os hashes (djb2) deles.
const NOS_HASHES = ["7mtvr7", "obnuib"];
const NOS_PIN_KEY = "dorama-club-nos-pin";
const NOS_UNLOCK_KEY = "dorama-club-nos-unlock"; // carimbo de quando destravou
const NOS_UNLOCK_MS = 20 * 60 * 1000; // segue destravado por 20 min (mesmo no refresh)
let nosRewards = [];
let nosClaims = [];
let couplePrefs = []; // [{user_id, max_intensity}]
let coupleChallenges = []; // log de desafios concluídos
let coupleLedger = []; // extrato de pontos (Nós 2.0)
let coupleCheckins = []; // check-ins de hoje (clima + limite do dia)
let coupleSurprises = []; // surpresas programadas (revela em data)
let coupleTgEvents = []; // eventos do Telegram (só metadados)
let secretMissions = []; // missoes secretas integradas ao Telegram
let coupleDesires = []; // cofrinho de desejos
let fetishPrefs = []; // tags de fetiche por pessoa
let nosExtrasReady = true; // false se a migracao 29 ainda nao foi rodada
let nosFor = null;
let nosUnlocked = nosUnlockValido(); // destravado (segue valendo por 20 min, mesmo no refresh)
let desafioIdx = 0; // pra "outro desafio"
let extratoOpen = false; // popup do extrato de pontos
let missoesOpen = false; // popup das missões
let desafiosOpen = false; // popup com todos os níveis/desafios

function djb2(s) {
  let h = 5381;
  s = String(s || "").toLowerCase().trim();
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function casalPrivadoOn() {
  return cloudOn() && state.couple && NOS_HASHES.includes(djb2(authUser?.email));
}
// Favoritos especiais (aba Perfil).
let favoritos = [];
let favoritosFor = null;
const favoritoCategorias = [
  "Personagem favorito",
  "Vilão favorito",
  "Personagem que eu odeio",
  "Personagem que eu defenderia no tribunal",
  "Cena inesquecível",
  "Frase icônica",
  "Trilha sonora favorita",
];
// "Posso comentar com quem" do dorama aberto no modal.
let detailProgress = null;

// ---------- Convite / indicação ----------
const INVITE_KEY = "dorama-club-convite";

// Captura ?c=CODIGO da URL (link de convite) e guarda pra usar no cadastro.
(function capturarConvite() {
  try {
    const code = new URLSearchParams(location.search).get("c");
    if (code) localStorage.setItem(INVITE_KEY, code.trim().toUpperCase());
  } catch {
    /* ignore */
  }
})();

function getPendingInvite() {
  try {
    return localStorage.getItem(INVITE_KEY) || "";
  } catch {
    return "";
  }
}

function clearPendingInvite() {
  try {
    localStorage.removeItem(INVITE_KEY);
  } catch {
    /* ignore */
  }
}

function inviteLink() {
  const code = state.profile?.inviteCode;
  return code ? `${location.origin}/?c=${code}` : location.origin;
}

// Se entrei por um convite e ainda não estou atribuída, registra quem me chamou.
async function resolveInvite() {
  if (!cloudOn() || !state.profile) return;
  if (state.profile.invitedBy) {
    clearPendingInvite();
    return;
  }
  const code = getPendingInvite();
  if (!code) return;
  try {
    const inviter = await findInviter(code);
    if (inviter && inviter.id !== authUser.id) {
      await setInvitedBy(authUser.id, inviter.id);
      state.profile.invitedBy = inviter.id;
      saveState();
      toast(`Você entrou pelo convite de ${inviter.name || "uma doramiga"} 💜`);
    }
  } catch {
    /* ignore */
  }
  clearPendingInvite();
}

function shareInvite() {
  const text =
    `Vem usar o Dorama Club comigo! 💜 Organiza seus doramas e a gente surta junto.\n\n` +
    `É só abrir e criar sua conta: ${inviteLink()}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

async function copyInvite() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(inviteLink());
  }
  toast("Link de convite copiado.");
}
// "Onde assistir" do dorama aberto no modal: null = carregando, [] = nada.
let detailProviders = null;
// Diário de surtos do dorama aberto no modal: null = carregando, [] = vazio.
let detailSurtos = null;
// Casais (aba Perfil), carregados sob demanda.
let casais = [];
let casaisFor = null;
const casalCategorias = [
  "Casal favorito",
  "Casal com química de milhões",
  "Casal com química de boleto vencido",
  "Casal que merecia final melhor",
  "Casal sem química",
  "Casal que me destruiu",
  "Casal que carregou o dorama",
  "Casal que eu nunca superei",
];
// Aba Descobrir (carregada sob demanda).
let discover = { loaded: false, loading: false, error: "", semana: [], alta: [], top: [], novos: [] };
// Dados da área de administradores (carregados sob demanda).
let admin = { loaded: false, loading: false, error: "", overview: null, users: [], clubs: [], comments: [] };
let adminUserSearch = "";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

// Tratamento conforme o gênero escolhido no perfil. Padrão: feminino
// (a comunidade nasceu como "doramigas"). gx("Bem-vindo","Bem-vinda","Boas-vindas")
function gx(masc, fem, neutro) {
  const g = state?.profile?.gender;
  if (g === "ele") return masc;
  if (g === "neutro") return neutro != null ? neutro : fem;
  return fem;
}

// ---------- Ícones (SVG inline, herdam a cor com currentColor) ----------
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"/>',
  add: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  lists: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  club: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  admin: '<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>',
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  detail: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3"/><circle cx="16" cy="16" r="1.3"/><circle cx="12" cy="12" r="1.3"/>',
  paint: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-.5-.3-.9-.5-1.3-.2-.4-.4-.7-.4-1.1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7.5-9-7.5z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 7"/><path d="M21 3v4h-4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><polygon points="16 8 13 13 8 16 11 11 16 8"/>',
  medal: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  paw: '<circle cx="7" cy="9" r="1.6"/><circle cx="12" cy="7" r="1.6"/><circle cx="17" cy="9" r="1.6"/><path d="M8.5 14c1.5-2 5.5-2 7 0 1.2 1.6.2 3.6-1.8 3.8-1 .1-1.7-.5-2.7-.5s-1.7.6-2.7.5C6.3 17.6 5.3 15.6 6.5 14z"/>',
};

function icon(name) {
  return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}

// Marca do app: dois balões de fala com coraçõezinhos — doramigas conversando
// e surtando juntas. Usa as cores do tema; corações brancos por dentro.
function logoMark() {
  return `<svg class="logo-mark" viewBox="0 0 48 48" aria-hidden="true">
    <rect x="23" y="6" width="21" height="16" rx="7" fill="var(--cor-secundaria)"/>
    <polygon points="31,20 31,27 38,20" fill="var(--cor-secundaria)"/>
    <path d="M33.4 17.6c-2.7-1.6-3.2-2.7-2.6-3.6.6-.9 2.1-.7 2.6.3.5-1 2-1.2 2.6-.3.6.9.1 2-2.6 3.6z" fill="#fff" opacity="0.92"/>
    <rect x="5" y="15" width="25" height="20" rx="8" fill="var(--cor-primaria)"/>
    <polygon points="12,33 9,41 20,33" fill="var(--cor-primaria)"/>
    <path d="M17.3 28.4c-4.4-2.7-5.2-4.6-4.1-6 1.1-1.5 3.6-1.1 4.1.7.5-1.8 3-2.2 4.1-.7 1.1 1.4.3 3.3-4.1 6z" fill="#fff"/>
  </svg>`;
}

// ---------- Temas ----------
const TEMA_KEY = "dorama-club-tema";
const TEMA_CUSTOM_KEY = "dorama-club-tema-custom";

// Tema "ao vivo": se for "custom", lê o tema montado de um dorama (localStorage).
function temaCorrente() {
  const id = temaAtual();
  if (id === "custom") {
    try {
      const t = JSON.parse(localStorage.getItem(TEMA_CUSTOM_KEY) || "null");
      if (t && t.variaveis) return t;
    } catch {
      /* ignore */
    }
  }
  return acharTema(id);
}

// Aplica um objeto de tema já resolvido (variáveis CSS + cena de fundo).
function aplicarTemaObj(tema, fallbackId) {
  const root = document.documentElement;
  root.dataset.tema = tema.id || fallbackId;
  for (const [chave, valor] of Object.entries(tema.variaveis)) {
    root.style.setProperty(chave, valor);
  }
  const veu = "color-mix(in srgb, var(--cor-fundo) 78%, transparent)";
  root.style.setProperty(
    "--bg-cena",
    tema.backdrop ? `linear-gradient(${veu}, ${veu}), url("${tema.backdrop}")` : "none",
  );
}

// Resolve um tema por id (+ JSON custom opcional, ex.: tema do casal).
function resolverTema(id, customJson) {
  if (id === "custom") {
    try {
      const t = JSON.parse(customJson || "null");
      if (t && t.variaveis) return t;
    } catch {
      /* ignore */
    }
  }
  return acharTema(id);
}

function aplicarTema(id) {
  aplicarTemaObj(id === "custom" ? temaCorrente() : acharTema(id), id);
}

// Aplica o tema do ambiente atual: pessoal (solo) ou compartilhado (casal).
function aplicarTemaAmbiente() {
  if (state.space === "couple" && state.couple && (state.couple.tema || state.couple.temaCustom)) {
    const id = state.couple.tema || temaPadrao.id;
    aplicarTemaObj(resolverTema(id, state.couple.temaCustom), id);
  } else {
    aplicarTema(temaAtual());
  }
}

function temaAtual() {
  try {
    return localStorage.getItem(TEMA_KEY) || temaPadrao.id;
  } catch {
    return temaPadrao.id;
  }
}

function salvarTema(id) {
  if (id === temaAtual()) return;
  try {
    localStorage.setItem(TEMA_KEY, id);
  } catch {
    /* ignore */
  }
  aplicarTema(id);
  if (cloudOn()) saveTheme(authUser.id, id, null).catch(() => {});
  render();
}

// ---------- Tema a partir de QUALQUER dorama (TMDB) ----------
let temaSearch = { query: "", loading: false, results: [] };

// Pega a cor mais "viva" da imagem (no canvas). Cai numa cor rosa se falhar.
function extrairCor(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 50;
        c.height = 50;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let best = [223, 79, 148];
        let bestScore = -1;
        for (let i = 0; i < data.length; i += 4) {
          const R = data[i], G = data[i + 1], B = data[i + 2];
          const max = Math.max(R, G, B), min = Math.min(R, G, B);
          const sat = max - min, lum = (max + min) / 2;
          const score = sat - Math.abs(lum - 140) * 0.45;
          if (score > bestScore) { bestScore = score; best = [R, G, B]; }
        }
        resolve(best);
      } catch {
        resolve([223, 79, 148]);
      }
    };
    img.onerror = () => resolve([223, 79, 148]);
    img.src = url;
  });
}

function clarear([r, g, b], minLum = 95) {
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  if (lum < minLum) {
    const f = minLum / Math.max(lum, 1);
    r = Math.min(255, r * f);
    g = Math.min(255, g * f);
    b = Math.min(255, b * f);
  }
  return [Math.round(r), Math.round(g), Math.round(b)];
}

// Monta o objeto de tema "custom" a partir das cores de um dorama (TMDB).
async function montarTemaCustom(drama) {
  const cor = clarear(await extrairCor(drama.cover || drama.backdrop));
  const [r, g, b] = cor;
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  const corTexto = lum > 150 ? "#15101f" : "#ffffff";
  return {
    id: "custom",
    nome: drama.title,
    backdrop: drama.backdrop || drama.cover,
    marca: { emoji: "🎬" },
    variaveis: {
      "--cor-fundo": "#0c0b12",
      "--cor-superficie": "#16141f",
      "--cor-superficie-2": "#1f1b2c",
      "--cor-texto": "#f4f1ff",
      "--cor-texto-suave": "#b6aecd",
      "--cor-primaria": `rgb(${r},${g},${b})`,
      "--cor-primaria-texto": corTexto,
      "--cor-secundaria": `rgb(${Math.min(255, r + 25)},${Math.min(255, g + 15)},${Math.min(255, b + 40)})`,
      "--cor-borda": "#2c2740",
      "--fonte-base": 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    },
  };
}

async function usarDoramaComoTema(drama) {
  toast("Montando o tema…");
  const tema = await montarTemaCustom(drama);
  const customJson = JSON.stringify(tema);
  try {
    localStorage.setItem(TEMA_CUSTOM_KEY, customJson);
    localStorage.setItem(TEMA_KEY, "custom");
  } catch {
    /* ignore */
  }
  if (cloudOn()) saveTheme(authUser.id, "custom", customJson).catch(() => {});
  temaSearch = { query: "", loading: false, results: [] };
  aplicarTema("custom");
  render();
  toast(`Tema: ${drama.title} 🎬`);
}

// ---------- Tema do casal (compartilhado: muda pros dois) ----------
function salvarTemaCasal(id) {
  if (!state.couple) return;
  state.couple.tema = id;
  state.couple.temaCustom = "";
  saveState();
  aplicarTemaAmbiente();
  if (cloudOn()) saveCoupleTheme(state.couple.id, id, null).catch(() => {});
  render();
}

async function usarDoramaComoTemaCasal(drama) {
  if (!state.couple) return;
  toast("Montando o tema de vocês…");
  const tema = await montarTemaCustom(drama);
  const customJson = JSON.stringify(tema);
  state.couple.tema = "custom";
  state.couple.temaCustom = customJson;
  saveState();
  temaSearchCasal = { query: "", loading: false, results: [] };
  aplicarTemaAmbiente();
  if (cloudOn()) saveCoupleTheme(state.couple.id, "custom", customJson).catch(() => {});
  render();
  toast(`Tema de vocês: ${drama.title} 🎬`);
}

async function runTemaSearchCasal(event) {
  event.preventDefault();
  const query = String(new FormData(event.currentTarget).get("q") || "").trim();
  if (!query) return;
  temaSearchCasal = { query, loading: true, results: [] };
  render();
  try {
    temaSearchCasal = { query, loading: false, results: await searchDramas(query) };
  } catch {
    temaSearchCasal = { query, loading: false, results: [] };
  }
  render();
}

async function runTemaSearch(event) {
  event.preventDefault();
  const query = String(new FormData(event.currentTarget).get("q") || "").trim();
  if (!query) return;
  temaSearch = { query, loading: true, results: [] };
  render();
  try {
    temaSearch = { query, loading: false, results: await searchDramas(query) };
  } catch {
    temaSearch = { query, loading: false, results: [] };
  }
  render();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneDefaults();
  try {
    const saved = JSON.parse(raw);
    const merged = { ...cloneDefaults(), ...saved };
    // Migração: garante que doramas salvos antigos recebam campos novos.
    merged.dramas = Array.isArray(saved.dramas) ? saved.dramas.map(normalizeDrama) : merged.dramas;
    merged.club = saved.club || null;
    merged.clubs = Array.isArray(saved.clubs) ? saved.clubs : [];
    // Só aceita casal salvo se estiver completo (id + código). Evita o estado
    // quebrado de "tenho casal" com código vazio até o hydrate confirmar.
    merged.couple = saved.couple && saved.couple.id && saved.couple.code ? saved.couple : null;
    merged.space = saved.space === "couple" && merged.couple ? "couple" : "solo";
    return merged;
  } catch {
    return cloneDefaults();
  }
}

function saveState() {
  // Mantém a navegação do casal entre refreshes (volta pra mesma aba, não pro início).
  if (typeof coupleSection === "string") state.coupleSection = coupleSection;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function resetRenderEvents() {
  renderEvents?.abort();
  renderEvents = new AbortController();
}

function listen(target, type, handler, options = {}) {
  if (!target) return;
  target.addEventListener(type, handler, { ...options, signal: renderEvents.signal });
}

function cloudOn() {
  return supabaseReady() && Boolean(authUser);
}

// Envia um dorama para a nuvem sem travar a UI (fire-and-forget).
function syncDrama(drama) {
  if (!cloudOn()) return;
  upsertDrama(authUser.id, drama).catch(() => toast("Não consegui salvar na nuvem (offline?)."));
}

function statusLabel(key) {
  return statuses.find((status) => status.key === key)?.label || key;
}

function byStatus(key) {
  if (key === "favorites") return state.dramas.filter((drama) => drama.favorite);
  if (key === "comfort") return state.dramas.filter((drama) => drama.comfort);
  return state.dramas.filter((drama) => drama.status === key);
}

function app() {
  return document.querySelector("#app");
}

function render() {
  resetRenderEvents();
  // Veio do link de recuperação de senha: define a nova senha.
  if (recovery) {
    app().innerHTML = `${recoveryTemplate()}<div id="toast-root"></div>`;
    listen(document.querySelector("#recovery-form"), "submit", handleRecoverySubmit);
    return;
  }
  // Com Supabase configurado, exige login antes de tudo.
  if (supabaseReady() && !authUser) {
    app().innerHTML = `${authTemplate()}<div id="toast-root"></div>`;
    bindAuth();
    return;
  }

  if (!state.profile) {
    const setup = supabaseReady() && authUser;
    app().innerHTML = `
      ${setup ? profileSetupTemplate() : welcomeTemplate()}
      ${modal ? modalTemplate() : ""}
      <div id="toast-root"></div>
    `;
    if (setup) {
      listen(document.querySelector("#profile-form"), "submit", saveProfile);
      bindPhotoPicker();
    } else {
      bindWelcome();
    }
    if (modal) bindModal();
    return;
  }

  // Segurança: só dá pra estar no ambiente do casal se existe casal.
  if (state.space === "couple" && !state.couple) state.space = "solo";

  // Abre o tutorial geral automaticamente na primeira vez (só uma vez por sessão).
  if (!tutorialChecked) {
    tutorialChecked = true;
    if (!tutorialVisto()) tutorial = { step: 0, kind: "geral" };
  }
  // Modo presente: tela especial na 1ª visita de QUEM NÃO criou o casal (a parceira).
  if (!tutorial && !presente && state.space === "couple" && state.couple && !presenteChecked) {
    presenteChecked = true;
    const souParceira = authUser && state.couple.createdBy && authUser.id !== state.couple.createdBy;
    if (souParceira && !presenteVisto()) presente = true;
  }
  // Tutorial do casal: só pra quem JÁ tem casal e está no ambiente dele (depois do presente).
  if (!tutorial && !presente && state.space === "couple" && state.couple && !tutorialCasalChecked) {
    tutorialCasalChecked = true;
    if (!tutorialCasalVisto()) tutorial = { step: 0, kind: "casal" };
  }

  const noCasal = state.space === "couple";
  app().innerHTML = `
    <div class="app shell${noCasal ? " couple-space" : ""}">
      ${noCasal ? coupleSidebarTemplate() : sidebarTemplate()}
      <main class="main">
        ${state.couple ? `<div class="main-topbar">${spaceSwitchTemplate()}</div>` : ""}
        ${noCasal ? coupleSpaceView() : viewTemplate()}
      </main>
      ${modal ? modalTemplate() : ""}
      ${uiModalTemplate()}
      ${tutorialTemplate()}
      ${presenteTemplate()}
      <div id="toast-root"></div>
    </div>
  `;
  bindShell();
  if (modal) bindModal();
  bindUiModal();
  bindTutorial();
  bindPresente();
}

function authTemplate() {
  const signup = authMode === "signup";
  return `
    <main class="welcome">
      <section class="welcome-card">
        <div class="logo">${logoMark()}</div>
        <h1>Dorama Club</h1>
        <p>Sua watchlist, seus surtos e suas doramigas no mesmo lugar.</p>
        <div class="tabs">
          <button type="button" class="${!signup ? "active" : ""}" data-auth-mode="signin">Entrar</button>
          <button type="button" class="${signup ? "active" : ""}" data-auth-mode="signup">Criar conta</button>
        </div>
        <form id="auth-form" class="form-grid">
          ${signup ? `
          <div class="field full">
            <label for="name">Seu nome</label>
            <input id="name" name="name" placeholder="Ana" required />
          </div>` : ""}
          <div class="field full">
            <label for="email">E-mail</label>
            <input id="email" name="email" type="email" placeholder="voce@email.com" required />
          </div>
          <div class="field full">
            <label for="password">Senha</label>
            <input id="password" name="password" type="password" minlength="6" placeholder="mínimo 6 caracteres" required />
          </div>
          ${signup ? `
          <div class="field full">
            <label for="invite">Código de convite (opcional)</label>
            <input id="invite" name="invite" value="${esc(getPendingInvite())}" placeholder="Quem te chamou?" autocomplete="off" />
          </div>` : ""}
          <div class="actions field full">
            <button class="btn" type="submit" ${authBusy ? "disabled" : ""}>${authBusy ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}</button>
          </div>
          ${!signup ? `<button type="button" class="linkish" data-forgot>Esqueci minha senha</button>` : ""}
        </form>
      </section>
    </main>
  `;
}

function recoveryTemplate() {
  return `
    <main class="welcome">
      <section class="welcome-card">
        <div class="logo">${logoMark()}</div>
        <h1>Nova senha</h1>
        <p>Escolha uma nova senha pra sua conta.</p>
        <form id="recovery-form" class="form-grid">
          <div class="field full">
            <label for="newpass">Nova senha</label>
            <input id="newpass" name="password" type="password" minlength="6" placeholder="mínimo 6 caracteres" required />
          </div>
          <div class="actions field full"><button class="btn" type="submit">Salvar nova senha</button></div>
        </form>
      </section>
    </main>
  `;
}

function profileSetupTemplate() {
  return `
    <main class="welcome">
      <section class="welcome-card">
        <div class="logo">${logoMark()}</div>
        <h1>Quase lá!</h1>
        <p>Monte seu perfil de dorameira para entrar.</p>
        <form id="profile-form" class="form-grid">
          ${profileFields({ name: authUser?.user_metadata?.name || "", since: "2018", type: dramaTypes[0] })}
          <div class="actions field full">
            <button class="btn" type="submit">Entrar no Dorama Club</button>
          </div>
        </form>
      </section>
    </main>
  `;
}

function welcomeTemplate() {
  return `
    <main class="welcome">
      <section class="welcome-card">
        <div class="logo">${logoMark()}</div>
        <h1>Dorama Club</h1>
        <p>Sua watchlist, seus surtos e suas doramigas no mesmo lugar.</p>
        <div class="actions">
          <button class="btn" data-start>Entrar</button>
          <button class="btn secondary" data-start>Criar conta</button>
        </div>
      </section>
    </main>
  `;
}

function isAdmin() {
  return supabaseReady() && authUser && isAdminEmail(authUser.email);
}

function sidebarTemplate() {
  const items = [
    ["home", "Início", "home"],
    ["lists", "Listas", "lists"],
    ["discover", "Descobrir", "compass"],
    ["club", "Doramigas", "club"],
    ["profile", "Perfil", "profile"],
  ];
  if (isAdmin()) items.push(["admin", "Admin", "admin"]);

  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">${logoMark()}</div>
        <div>
          <h1>Dorama Club</h1>
          <p>watchlist, surtos e doramigas</p>
        </div>
      </div>
      <nav class="nav">
        ${items.map(([key, label, ic]) => `<button class="${state.view === key ? "active" : ""}" data-view="${key}">${icon(ic)}${key === "club" && clubHasNews ? `<span class="nav-dot"></span>` : ""}<span class="nav-label">${label}</span></button>`).join("")}
      </nav>
      ${supabaseReady() ? `<button class="logout" data-logout>${icon("out")}<span>Sair</span></button>` : ""}
    </aside>
  `;
}

// Alternador Pessoal ↔ Nós dois. Só aparece pra quem JÁ TEM casal — igual ao
// app financeiro (sem casal não faz sentido alternar). Cria-se o casal no Perfil.
function spaceSwitchTemplate() {
  if (!state.couple) return "";
  const couple = state.space === "couple";
  const nomeCasal = state.couple.title || "Nós dois";
  return `
    <div class="space-switch" aria-label="Alternar espaço">
      <button type="button" class="${!couple ? "on" : ""}" data-space-go="solo">
        <span class="switch-ico">${icon("home")}</span>
        <span class="switch-copy"><small>Pessoal</small><strong>Meu app</strong></span>
      </button>
      <button type="button" class="${couple ? "on" : ""}" data-space-go="couple">
        <span class="switch-ico">${icon("heart")}</span>
        <span class="switch-copy"><small>Casal</small><strong>${esc(nomeCasal)}</strong></span>
      </button>
    </div>`;
}

// Sidebar do ambiente do casal: seções próprias + voltar pro app.
function coupleSidebarTemplate() {
  const temCasal = Boolean(state.couple);
  const secoes = [
    ["inicio", "Painel", "home"],
    ["assistindo", "Assistindo", "play"],
    ["diario", "Diário", "lists"],
    ["sobre", "Nossa história", "heart"],
    ["planos", "Planos", "calendar"],
    ["diversao", "Diversão", "dice"],
    ...(casalPrivadoOn() ? [["nos", "Nós 🔥", "heart"]] : []),
    ["ajustes", "Ajustes", "paint"],
  ];
  const nome = state.couple?.title || "Nós dois";
  return `
    <aside class="sidebar couple-sidebar">
      <div class="brand">
        <div class="logo">${logoMark()}</div>
        <div>
          <h1>${esc(nome)}</h1>
          <p>nosso cantinho de doramas</p>
        </div>
      </div>
      ${temCasal ? `<nav class="nav">
        ${secoes.map(([key, label, ic]) => `<button class="${coupleSection === key ? "active" : ""}" data-couple-section="${key}">${icon(ic)}<span class="nav-label">${label}</span></button>`).join("")}
      </nav>` : `<nav class="nav"></nav>`}
    </aside>
  `;
}

function viewTemplate() {
  const views = {
    home: homeTemplate,
    discover: discoverTemplate,
    add: addTemplate,
    lists: listsTemplate,
    club: clubTemplate,
    profile: profileTemplate,
    admin: adminTemplate,
  };
  if (state.view === "admin" && !isAdmin()) return homeTemplate();
  return (views[state.view] || homeTemplate)();
}

// Pôster menor (w185) para as miniaturas do Descobrir — metade do peso.
function thumb(cover) {
  return cover ? cover.replace("/w342/", "/w185/") : POSTER_PLACEHOLDER;
}

function discoverRow(lista) {
  if (!lista || !lista.length) return `<div class="empty">Nada por aqui agora.</div>`;
  return `
    <section class="discover-row">
      ${lista
        .slice(0, 10)
        .map(
          (d) => `
        <button class="discover-card" data-discover="${d.tmdbId}" title="${esc(d.title)}">
          <img src="${esc(thumb(d.cover))}" alt="${esc(d.title)}" loading="lazy" decoding="async" />
          <span class="discover-name">${esc(d.title)}</span>
          ${d.rating ? `<span class="discover-rating">⭐ ${d.rating}</span>` : ""}
        </button>`,
        )
        .join("")}
    </section>`;
}

function discoverTemplate() {
  if (!tmdbReady()) {
    return `<div class="section-title"><h2>Descobrir</h2></div><div class="empty">Configure o TMDB pra descobrir doramas.</div>`;
  }
  if (discover.loading && !discover.loaded) {
    return `<div class="section-title"><h2>Descobrir</h2></div><div class="empty">Carregando doramas do momento…</div>`;
  }
  if (discover.error) {
    return `<div class="section-title"><h2>Descobrir</h2></div><div class="empty">${esc(discover.error)}</div>`;
  }

  const destaque = discover.semana[0];
  const heroFundo = destaque?.cover
    ? `linear-gradient(to top, var(--cor-fundo), color-mix(in srgb, var(--cor-fundo) 30%, transparent)), url('${esc(destaque.cover)}')`
    : "";

  return `
    <div class="section-title"><h2>${icon("compass")} Descobrir</h2>
      <button class="btn ghost" data-discover-refresh>${icon("refresh")} Atualizar</button>
    </div>
    ${destaque
      ? `<button class="discover-hero" data-discover="${destaque.tmdbId}" style="background-image:${heroFundo}">
           <span class="tag">🔥 Dorama da semana</span>
           <strong>${esc(destaque.title)}</strong>
           <small>${destaque.year || ""}${destaque.rating ? ` · ⭐ ${destaque.rating}` : ""} · toque para adicionar</small>
         </button>`
      : ""}
    <div class="section-title"><h2>📈 Em alta agora</h2></div>
    ${discoverRow(discover.alta)}
    <div class="section-title"><h2>⭐ Mais bem avaliados</h2></div>
    ${discoverRow(discover.top)}
    <div class="section-title"><h2>🆕 Novidades</h2></div>
    ${discoverRow(discover.novos)}
  `;
}

function adminAvatar(nome, photo) {
  const n = nome || "?";
  if (photo) return `<span class="admin-av"><img src="${esc(photo)}" alt="" loading="lazy" /></span>`;
  const ini = (String(n).trim().charAt(0) || "?").toUpperCase();
  const cor = AVATAR_CORES[hashStr(n) % AVATAR_CORES.length];
  return `<span class="admin-av" style="background:${cor}">${esc(ini)}</span>`;
}

function adminDataCurta(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function adminPersonCard(u) {
  const nome = u.name || "(sem nome)";
  const generoIcon = u.gender === "masc" ? "👦" : u.gender === "fem" ? "👧" : u.gender ? "🧑" : "";
  const chips = [
    `<span class="chip solid">🎬 ${Number(u.dramas || 0)} doramas</span>`,
    u.invited_by_name ? `<span class="chip">👋 veio de ${esc(u.invited_by_name)}</span>` : "",
    u.invites ? `<span class="chip">🎟️ convidou ${Number(u.invites || 0)}</span>` : "",
    u.created_at ? `<span class="chip">📅 ${adminDataCurta(u.created_at)}</span>` : "",
  ].filter(Boolean).join("");
  return `
    <article class="admin-person">
      <div class="admin-person-top">
        ${adminAvatar(nome, u.photo)}
        <div class="admin-person-id">
          <strong>${esc(nome)} ${generoIcon}</strong>
          ${u.nickname ? `<span class="admin-nick">“${esc(u.nickname)}”</span>` : ""}
          <span class="admin-email">${esc(u.email || "")}</span>
        </div>
        <button class="admin-person-del" data-admin-del-user="${u.id}" data-admin-user-name="${esc(nome)}" title="Excluir">${icon("trash")}</button>
      </div>
      <div class="admin-person-chips">${chips}</div>
    </article>`;
}

function adminTemplate() {
  if (admin.loading && !admin.loaded) return `<div class="section-title"><h2>Admin</h2></div><div class="empty">Carregando painel…</div>`;
  if (admin.error) return `<div class="section-title"><h2>Admin</h2></div><div class="empty">${esc(admin.error)}</div>`;

  const o = admin.overview || {};
  const users = admin.users || [];
  const clubs = admin.clubs || [];
  const totalDramas = Number(o.dramas ?? users.reduce((sum, u) => sum + Number(u.dramas || 0), 0));
  const totalUsers = Number(o.users ?? users.length);
  const totalClubs = Number(o.clubs ?? clubs.length);
  const ghostClubs = clubs.filter((c) => !Number(c.members || 0));
  const activeClubs = Math.max(0, totalClubs - ghostClubs.length);
  const invitedUsers = users.filter((u) => u.invited_by_name).length;
  const totalInvites = users.reduce((sum, u) => sum + Number(u.invites || 0), 0);
  const avgDramas = totalUsers ? (totalDramas / totalUsers).toFixed(1).replace(".0", "") : "0";
  const overviewStats = [
    ["Pessoas", totalUsers],
    ["Doramas salvos", totalDramas],
    ["Clubes ativos", activeClubs],
    ["Clubes vazios", ghostClubs.length],
  ];
  const healthStats = [
    ["Média por pessoa", avgDramas],
    ["Entraram por convite", invitedUsers],
    ["Convites enviados", totalInvites],
  ];
  const topUsers = [...users].sort((a, b) => Number(b.dramas || 0) - Number(a.dramas || 0)).slice(0, 5);
  const topClubs = [...clubs].sort((a, b) => Number(b.members || 0) - Number(a.members || 0)).slice(0, 5);

  const busca = adminUserSearch.trim().toLowerCase();
  const usersFiltrados = busca
    ? users.filter((u) => `${u.name || ""} ${u.nickname || ""} ${u.email || ""}`.toLowerCase().includes(busca))
    : users;
  const userCards = usersFiltrados.map((u) => adminPersonCard(u)).join("");
  const clubRows = clubs.map((c) => {
    const members = Number(c.members || 0);
    return `
    <article class="admin-row">
      <div class="admin-main">
        <strong>${esc(c.name)}</strong>
        <span>Código ${esc(c.code || "")}</span>
      </div>
      <div class="admin-meta">
        <span class="chip">${members} ${members === 1 ? "membro" : "membros"}</span>
        ${!members ? `<span class="chip danger">vazio</span>` : ""}
      </div>
      <div class="admin-actions">
        ${!members ? `<button data-admin-del-club="${c.id}" data-admin-club-name="${esc(c.name || "")}">${icon("trash")} Excluir</button>` : `<span class="muted">Sem ação necessária</span>`}
      </div>
    </article>`;
  }).join("");

  return `
    <div class="admin-head">
      <div>
        <span>Painel operacional</span>
        <h2>Admin</h2>
        <p>Gestão de contas, clubes e saúde geral da base.</p>
      </div>
      <button class="btn ghost" data-admin-refresh>Atualizar</button>
    </div>

    <section class="admin-stats">
      ${overviewStats.map(([label, value]) => `<div class="admin-stat"><span>${label}</span><strong>${value}</strong></div>`).join("")}
    </section>

    <section class="admin-grid">
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Indicadores</h3></div>
        <div class="admin-kpis">
          ${healthStats.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}
        </div>
      </div>
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Mais engajados</h3></div>
        <div class="admin-rank">
          ${topUsers.length ? topUsers.map((u, i) => `<div><b>${i + 1}</b><span>${esc(u.name || u.email || "(sem nome)")}</span><strong>${Number(u.dramas || 0)}</strong></div>`).join("") : `<p class="muted">Sem pessoas cadastradas ainda.</p>`}
        </div>
      </div>
      <div class="admin-panel">
        <div class="admin-panel-head"><h3>Clubes maiores</h3></div>
        <div class="admin-rank">
          ${topClubs.length ? topClubs.map((c, i) => `<div><b>${i + 1}</b><span>${esc(c.name || "(sem nome)")}</span><strong>${Number(c.members || 0)}</strong></div>`).join("") : `<p class="muted">Sem clubes cadastrados ainda.</p>`}
        </div>
      </div>
    </section>

    <section class="admin-panel admin-people">
      <div class="admin-panel-head">
        <h3>Pessoas cadastradas</h3>
        <span>${busca ? `${usersFiltrados.length}/${users.length}` : users.length}</span>
      </div>
      ${users.length ? `
        <div class="admin-search">
          <input type="search" placeholder="🔎 Buscar por nome, @apelido ou e-mail…" value="${esc(adminUserSearch)}" data-admin-user-search autocomplete="off" />
        </div>
        <div class="admin-people-grid">
          ${usersFiltrados.length ? userCards : `<div class="empty">Ninguém bate com “${esc(adminUserSearch)}”.</div>`}
        </div>
      ` : `<div class="empty">Nenhuma pessoa cadastrada ainda.</div>`}
    </section>

    <section class="admin-panel admin-table">
      <div class="admin-panel-head">
        <h3>Clubes</h3>
        <span>${clubs.length}</span>
      </div>
      ${clubs.length ? clubRows : `<div class="empty">Nenhum clube criado ainda.</div>`}
    </section>
  `;
}

function destaqueHome() {
  const watching = byStatus("watching");
  return watching
    .slice()
    .sort((a, b) => Number(b.currentEpisode || 0) - Number(a.currentEpisode || 0))[0] || state.dramas[0] || null;
}

const FRASES_DIA = [
  "Hoje o coração aguenta um sofrimento? 💔",
  "Bora surtar com qualidade. 💜",
  "Cuidado: CEO frio à vista. 🧊",
  "Lembra de beber água entre os episódios. 💧",
  "Não tenha psicológico — tenha doramas. 🎬",
  "Mais um dia, mais um surto. ✨",
  "Chorar é de graça. Aproveita. 😭",
  "Ele vai te magoar. E você vai amar. 🥲",
];

function fraseDoDia() {
  const dia = Math.floor(Date.now() / 86400000);
  return FRASES_DIA[dia % FRASES_DIA.length];
}

const FRASES_FIM = [
  "Mais um trauma concluído com sucesso. 🎓",
  "Sobreviveu a mais um. 💪",
  "Acabou. E agora, o vazio. 🕳️",
  "Chorou, surtou e terminou. 😭",
  "Finalizou e já quer o próximo. 🔁",
  "Coração destruído, missão cumprida. 💔",
];

function fraseFim() {
  return FRASES_FIM[Math.floor(Math.random() * FRASES_FIM.length)];
}

// Resultado do "humor de hoje" mostrado na própria home.
let moodResult = null;

// ---------- Card-imagem pra compartilhar (status do WhatsApp etc.) ----------
function carregarImagem(src) {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function posterRound(ctx, img, x, y, w, h, r) {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.clip();
  const ir = img.width / img.height;
  const tr = w / h;
  let dw, dh, dx, dy;
  if (ir > tr) { dh = h; dw = h * ir; dx = x - (dw - w) / 2; dy = y; }
  else { dw = w; dh = w / ir; dx = x; dy = y - (dh - h) / 2; }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
    else line = t;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  return Math.min(lines.length, 3);
}

async function gerarCardMeuDia(drama, opts = {}) {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const cs = getComputedStyle(document.documentElement);
  const cor = (n, fb) => cs.getPropertyValue(n).trim() || fb;
  const primaria = cor("--cor-primaria", "#df4f94");
  const secundaria = cor("--cor-secundaria", "#8a5cf6");

  // Fundo: backdrop do dorama (cinema) ou gradiente do tema.
  let bgFeito = false;
  if (drama?.tmdbId && tmdbReady()) {
    const bdUrl = await getBackdrop(drama.tmdbId);
    const bd = bdUrl ? await carregarImagem(bdUrl) : null;
    if (bd) {
      posterRound(ctx, bd, 0, 0, W, H, 0);
      ctx.fillStyle = "rgba(8,6,14,0.55)";
      ctx.fillRect(0, 0, W, H);
      const veil = ctx.createLinearGradient(0, 0, 0, H);
      veil.addColorStop(0, "rgba(0,0,0,0.35)");
      veil.addColorStop(0.55, "rgba(0,0,0,0.1)");
      veil.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H);
      bgFeito = true;
    }
  }
  if (!bgFeito) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, primaria);
    g.addColorStop(1, secundaria);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.30)";
    ctx.fillRect(0, 0, W, H);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 46px Inter, system-ui, sans-serif';
  ctx.fillText(opts.header || (opts.casal ? "🎓 Finalizamos juntos" : opts.certificado ? "🎓 Certificado de conclusão" : "💜 Dorama Club"), W / 2, 100);

  // pôster
  const pw = 470, ph = 705, px = (W - pw) / 2, py = 150;
  const img = drama?.cover ? await carregarImagem(drama.cover.replace("/w342/", "/w500/")) : null;
  if (img) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    posterRound(ctx, img, px, py, pw, ph, 28);
    ctx.restore();
  }

  let y = py + ph + 80;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = '700 32px Inter, system-ui, sans-serif';
  ctx.fillText(opts.casal ? (opts.coupleName || "Nosso cantinho") : opts.certificado ? "Finalizei com sucesso" : drama ? "Continuo assistindo" : "Minha vida dorameira", W / 2, y);

  y += 64;
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 56px Inter, system-ui, sans-serif';
  const linhas = drama ? wrapText(ctx, drama.title, W / 2, y, W - 140, 62) : 0;
  y += (linhas ? (linhas - 1) * 62 : 0) + 56;

  if (opts.casal) {
    // Certificado do casal: episódios juntos + horas estimadas (se vierem).
    if (drama && Number(drama.episodes)) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = '700 36px Inter, system-ui, sans-serif';
      const linhaEps = opts.horas ? `${drama.episodes} episódios · ~${opts.horas}h juntos` : `${drama.episodes} episódios juntos`;
      ctx.fillText(linhaEps, W / 2, y);
      y += 56;
    }
    // Notas dele/dela (vindas do diário, quando existirem).
    const notas = [];
    if (opts.noteHim) notas.push(`Ele: ${opts.noteHim}`);
    if (opts.noteHer) notas.push(`Ela: ${opts.noteHer}`);
    if (notas.length) {
      ctx.fillStyle = "#ffffff";
      ctx.font = '800 36px Inter, system-ui, sans-serif';
      notas.forEach((n) => { wrapText(ctx, n, W / 2, y, W - 140, 42); y += 52; });
      y += 4;
    }
  } else {
    if (drama && Number(drama.episodes)) {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = '700 36px Inter, system-ui, sans-serif';
      ctx.fillText(`Episódio ${drama.currentEpisode || 0} de ${drama.episodes}`, W / 2, y);
      y += 30;
      const bw = 560, bx = (W - bw) / 2;
      const pct = Math.min(1, (Number(drama.currentEpisode || 0)) / Number(drama.episodes));
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, y, bw, 14, 7); ctx.fill(); }
      ctx.fillStyle = "#ffffff";
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(bx, y, bw * pct, 14, 7); ctx.fill(); }
      y += 56;
    }

    // Nota / semáforo / choro deste dorama (quando tiver).
    const extras = [];
    if (drama?.personalRating) extras.push(`⭐ ${drama.personalRating}/10`);
    if (drama?.semaforo) extras.push(semaforoEmoji(drama.semaforo));
    if (Number(drama?.cry) > 0) extras.push(`😭 ${drama.cry}`);
    if (Number(drama?.laugh) > 0) extras.push(`😂 ${drama.laugh}`);
    if (Number(drama?.hype) > 0) extras.push(`🔥 ${drama.hype}`);
    if (extras.length) {
      ctx.fillStyle = "#ffffff";
      ctx.font = '800 38px Inter, system-ui, sans-serif';
      ctx.fillText(extras.join("    "), W / 2, y);
      y += 56;
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = '700 34px Inter, system-ui, sans-serif';
    ctx.fillText(`✅ ${byStatus("finished").length} finalizados   ⭐ ${byStatus("favorites").length} favoritos`, W / 2, y);
  }

  if (opts.certificado || opts.casal) {
    ctx.fillStyle = "#ffffff";
    ctx.font = '800 34px Inter, system-ui, sans-serif';
    wrapText(ctx, opts.frase || "Mais um trauma concluído com sucesso. 🎓", W / 2, y + 16, W - 140, 42);
  }

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = '700 30px Inter, system-ui, sans-serif';
  ctx.fillText(`— ${opts.casal ? (opts.coupleName || "Nós dois") : (state.profile?.name || "dorameira")}`, W / 2, H - 60);

  return await new Promise((res) => canvas.toBlob(res, "image/png", 0.92));
}

async function compartilharImagem(blob, texto) {
  if (!blob) {
    toast("Não consegui gerar o card.");
    return;
  }
  const file = new File([blob], "meu-dia-dorama.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: texto });
    } catch {
      /* usuária cancelou */
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "meu-dia-dorama.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Imagem baixada! É só postar no seu status. 💜");
}

async function shareMeuDia() {
  const watching = byStatus("watching");
  const drama = watching[0] || state.dramas[0] || null;
  toast("Gerando seu card…");
  try {
    const blob = await gerarCardMeuDia(drama);
    await compartilharImagem(blob, `Meu dia no Dorama Club 💜 ${inviteLink()}`);
  } catch {
    toast("Não consegui gerar o card agora.");
  }
}

async function compartilharDorama(id, opts = {}) {
  const drama = state.dramas.find((d) => d.id === id);
  if (!drama) return;
  toast("Gerando card…");
  try {
    const blob = await gerarCardMeuDia(drama, opts);
    const txt = opts.certificado
      ? `🎓 Finalizei ${drama.title}! ${opts.frase || ""} ${inviteLink()}`
      : `${drama.title} — no Dorama Club 💜 ${inviteLink()}`;
    await compartilharImagem(blob, txt);
  } catch {
    toast("Não consegui gerar o card.");
  }
}

function handleMoodShare(tag) {
  const m = moods.find((x) => x.tag === tag);
  if (!m) return;
  toast("Humor do dia anotado 💜");
}

function sugerirNoHome(tag) {
  const generos = moodGenres[tag] || [];
  const combina = (d) => (d.genres || []).some((g) => generos.includes(g));
  const naLista = state.dramas.filter((d) => d.status === "wishlist");
  let pool = naLista.filter(combina);
  if (!pool.length) pool = state.dramas.filter(combina);
  if (!pool.length) pool = naLista.length ? naLista : state.dramas;
  moodResult = pool.length ? { tag, drama: pool[Math.floor(Math.random() * pool.length)] } : { tag, drama: null };
  render();
}

function watchingCarousel(lista) {
  if (!lista.length) return `<div class="empty">Nada em andamento. Que tal começar um? ✨</div>`;
  return `
    <section class="watch-row">
      ${lista
        .map((d) => {
          const ep = Number(d.currentEpisode || 0);
          const total = Number(d.episodes || 0);
          const pct = total ? Math.min(100, Math.round((ep / total) * 100)) : 0;
          return `
        <article class="watch-card">
          <button class="watch-poster" data-detail="${d.id}" title="${esc(d.title)}">
            <img src="${esc(thumb(d.cover) || POSTER_PLACEHOLDER)}" alt="${esc(d.title)}" loading="lazy" decoding="async" />
            <span class="watch-progress"><span style="width:${pct}%"></span></span>
          </button>
          <strong class="watch-name">${esc(d.title)}</strong>
          <div class="watch-actions">
            <button data-plus-one="${d.id}" title="Marcar +1 episódio">＋1</button>
            <button class="ep-set" data-set-ep="${d.id}" title="Marcar episódio">${total ? `${ep}/${total}` : `ep ${ep}`} ✏️</button>
          </div>
        </article>`;
        })
        .join("")}
    </section>`;
}

function homeTemplate() {
  const profile = state.profile;
  const stats = [
    ["Assistindo", byStatus("watching").length, "watching"],
    ["Watchlist", byStatus("wishlist").length, "wishlist"],
    ["Finalizados", byStatus("finished").length, "finished"],
    ["Favoritos", byStatus("favorites").length, "favorites"],
    ["Desde", profile.since || "Hoje", null],
  ];

  const statusIcons = { watching: "play", wishlist: "add", finished: "heart", paused: "detail", dropped: "trash", favorites: "heart", comfort: "heart" };
  const watching = byStatus("watching");
  const destaque = destaqueHome();
  const ep = Number(destaque?.currentEpisode || 0);
  const total = Number(destaque?.episodes || 0);
  const progressPct = destaque && total ? Math.min(100, Math.round((ep / total) * 100)) : 0;
  const decideCard = state.dramas.length
    ? { title: "Decidir agora", text: "Sortear o próximo dorama da vez.", attrs: "data-random", iconName: "dice", cta: "Sortear" }
    : { title: "Descobrir doramas", text: "Ver sugestões populares para começar a lista.", attrs: `data-view="discover"`, iconName: "compass", cta: "Explorar" };
  const dashboardMeta = [
    `${watching.length} ${watching.length === 1 ? "em andamento" : "em andamento"}`,
    `${byStatus("finished").length} finalizados`,
    state.club ? state.club.name : "sem clube ainda",
  ];

  return `
    <div class="home-head">
      <div>
        <h2>Início</h2>
        <p>Seu cantinho dorameiro de hoje.</p>
      </div>
      <div class="home-head-actions">
        <button class="btn secondary" data-view="add">${icon("add")} Adicionar</button>
        <button class="btn ghost" data-share-day>${icon("share")} Meu dia</button>
      </div>
    </div>
    <section class="hello-card">
      <img class="hero-avatar" src="${esc(avatarUrl(profile))}" alt="" />
      <div class="hello-text">
        <strong>Olá, ${esc(profile.name)}!</strong>
        <span>${dashboardMeta.map(esc).join(" · ")}</span>
        <span class="frase-dia">${esc(fraseDoDia())}</span>
      </div>
    </section>
    <section class="focus-card" ${destaque?.cover ? `style="--focus-cover:url('${esc(destaque.cover)}')"` : ""}>
      <div class="focus-bg"></div>
      ${destaque
        ? `<img class="focus-poster" src="${esc(destaque.cover || POSTER_PLACEHOLDER)}" alt="Capa de ${esc(destaque.title)}" />
           <div class="focus-copy">
             <span>Continue assistindo</span>
             <h3>${esc(destaque.title)}</h3>
             <button class="ep-set" data-set-ep="${destaque.id}">${total ? `Episódio ${ep} de ${total}` : `Episódio ${ep}`} ✏️</button>
             <div class="focus-progress"><span style="width:${progressPct}%"></span></div>
             <div class="actions">
               ${destaque.status === "watching" ? `<button class="btn" data-plus-one="${destaque.id}">${icon("add")} +1 ep</button>` : ""}
               ${destaque.status === "watching" ? `<button class="btn secondary" data-set-ep="${destaque.id}">Marcar episódio</button>` : ""}
               <button class="btn ghost" data-detail="${destaque.id}">${icon("play")} Detalhes</button>
               <button class="btn ghost" data-comentar-surto="${destaque.id}">${icon("club")} Surto</button>
             </div>
           </div>`
        : `<div class="focus-copy empty-focus">
             <span>Comece por aqui</span>
             <h3>Monte sua primeira watchlist</h3>
             <p>Busque um dorama pelo TMDB ou explore sugestões para começar.</p>
             <div class="actions">
               <button class="btn" data-view="add">${icon("add")} Adicionar dorama</button>
               <button class="btn secondary" data-view="discover">${icon("compass")} Descobrir</button>
             </div>
           </div>`}
    </section>
    <section class="grid stats">
      ${stats.map(([label, value, key]) => key
        ? `<button class="stat tappable" data-list="${key}"><span class="muted">${label}</span><strong>${value}</strong></button>`
        : `<div class="stat"><span class="muted">${label}</span><strong>${value}</strong></div>`).join("")}
    </section>
    <section class="home-strip">
      <button class="strip-card" ${decideCard.attrs}>
        <span>${esc(decideCard.title)}</span>
        <strong>${esc(decideCard.text)}</strong>
        <em>${icon(decideCard.iconName)} ${esc(decideCard.cta)}</em>
      </button>
      <button class="strip-card" data-view="club">
        <span>Doramigas</span>
        <strong>${state.club ? esc(state.club.name) : "Crie ou entre em um clube."}</strong>
        <em>${icon("club")} Abrir clube</em>
      </button>
    </section>
    <section class="mood-panel">
      <div>
        <span>Humor de hoje</span>
        <strong>O que seu coração aguenta? Toque e eu sugiro na hora.</strong>
      </div>
      <div class="mood-row compact">
        ${moods.map((mood) => `<button class="${moodResult?.tag === mood.tag ? "active" : ""}" data-mood-home="${esc(mood.tag)}">${mood.emoji} ${esc(mood.label)}</button>`).join("")}
      </div>
      ${moodResult
        ? moodResult.drama
          ? `<div class="mood-result">
               <button class="mood-result-main" data-detail="${moodResult.drama.id}">
                 <img src="${esc(thumb(moodResult.drama.cover) || POSTER_PLACEHOLDER)}" alt="" />
                 <div><span>Hoje combina com</span><strong>${esc(moodResult.drama.title)}</strong></div>
                 <em>${icon("play")} Ver</em>
               </button>
               ${state.club ? `<button class="btn ghost mood-share" data-mood-share="${esc(moodResult.tag)}">${icon("club")} Contar pras doramigas</button>` : ""}
             </div>`
          : `<div class="empty" style="margin-top:12px">Nada na sua lista com esse clima ainda. Adicione mais doramas! ✨</div>`
        : ""}
    </section>
    <div class="section-title">
      <h2>${icon("play")} Assistindo agora</h2>
    </div>
    ${watchingCarousel(watching)}
  `;
}

const moods = [
  { label: "Quero sofrer", tag: "sofrer", emoji: "😭" },
  { label: "Quero rir", tag: "rir", emoji: "😂" },
  { label: "Romance fofo", tag: "fofo", emoji: "🥰" },
  { label: "Passar raiva", tag: "raiva", emoji: "😡" },
  { label: "Quero vingança", tag: "vinganca", emoji: "🔪" },
  { label: "Algo leve", tag: "leve", emoji: "🌸" },
  { label: "Chorar sem motivo", tag: "chorar", emoji: "💧" },
];

// Cada humor casa com alguns gêneros (nomes do TMDB em pt-BR).
const moodGenres = {
  sofrer: ["Drama", "Família", "História"],
  chorar: ["Drama", "Romance", "Família"],
  rir: ["Comédia"],
  fofo: ["Romance", "Comédia"],
  raiva: ["Drama", "Crime", "Mistério"],
  vinganca: ["Crime", "Ação & Aventura", "Mistério", "Guerra & Política"],
  leve: ["Comédia", "Romance", "Família"],
};

function sugerirPorHumor(tag) {
  const generos = moodGenres[tag] || [];
  const combina = (drama) => (drama.genres || []).some((g) => generos.includes(g));
  // Prioriza o que ela ainda não viu (quero assistir), depois qualquer um.
  const naLista = state.dramas.filter((d) => d.status === "wishlist");
  let pool = naLista.filter(combina);
  if (!pool.length) pool = state.dramas.filter(combina);
  if (!pool.length) pool = naLista.length ? naLista : state.dramas;
  if (!pool.length) {
    toast("Adicione doramas primeiro pra eu sugerir algo.");
    return;
  }
  const escolha = pool[Math.floor(Math.random() * pool.length)];
  toast(`Hoje combina com: ${escolha.title}${state.club ? " - apareceu no feed do clube." : " 💜"}`);
}

function addTemplate() {
  return `
    <div class="section-title">
      <h2>Qual título você quer adicionar?</h2>
    </div>
    <section class="form-card">
      <form id="search-form" class="search-bar">
        <input id="search" name="search" placeholder="Rainha das Lágrimas, nome original, filme…" value="${esc(search.query)}" autocomplete="off" required />
        <button class="btn" type="submit">Buscar</button>
      </form>
      <p class="muted" style="margin:8px 0 0;font-size:.82rem">Busca séries e filmes, em português e no nome original.</p>
      ${search.loading ? `<p class="muted">Buscando no TMDB…</p>` : ""}
      ${search.error ? `<p class="muted">${esc(search.error)}</p>` : ""}
      ${searchResultsTemplate()}
      ${search.query && !search.loading ? `<div class="actions" style="margin-top:12px"><button type="button" class="btn ghost" data-manual-toggle>Não achou? Adicionar manualmente</button></div>` : ""}
      ${manualAdd ? manualFormTemplate() : ""}
    </section>
    ${search.selected ? placeFormTemplate(search.selected) : ""}
  `;
}

// Etiqueta do tipo + país (ex.: "Série · Coreia", "Filme · Japão").
function midiaEtiqueta(drama) {
  const tipo = drama.mediaType === "movie" ? "Filme" : "Série";
  return drama.origem ? `${tipo} · ${drama.origem}` : tipo;
}

function searchResultsTemplate() {
  if (!search.results.length) return "";
  return `
    <div class="search-results">
      ${search.results
        .map(
          (drama) => `
        <button type="button" class="search-result ${search.selected?.tmdbId === drama.tmdbId ? "selected" : ""}" data-pick="${drama.tmdbId}">
          <img src="${esc(drama.cover || POSTER_PLACEHOLDER)}" alt="" loading="lazy" />
          <span class="search-result-info">
            <strong>${esc(drama.title)}</strong>
            ${drama.original && drama.original !== drama.title ? `<small class="muted">${esc(drama.original)}</small>` : ""}
            <span class="result-tags">
              <span class="result-tag ${drama.mediaType === "movie" ? "is-movie" : "is-tv"}">${esc(midiaEtiqueta(drama))}</span>
              ${drama.year ? `<span class="result-tag">${drama.year}</span>` : ""}
              ${drama.rating ? `<span class="result-tag">⭐ ${drama.rating}</span>` : ""}
            </span>
          </span>
        </button>`,
        )
        .join("")}
    </div>
  `;
}

// Form de adicionar manualmente (quando não acha no TMDB).
function manualFormTemplate() {
  return `
    <form id="manual-form" class="form-grid" style="margin-top:12px">
      <div class="field full">
        <label for="manualTitle">Título</label>
        <input id="manualTitle" name="title" placeholder="Nome do dorama/filme" required />
      </div>
      <div class="field">
        <label for="manualYear">Ano</label>
        <input id="manualYear" name="year" type="number" min="1950" max="2100" placeholder="${new Date().getFullYear()}" />
      </div>
      <div class="field">
        <label for="manualEpisodes">Episódios</label>
        <input id="manualEpisodes" name="episodes" type="number" min="1" placeholder="16" />
      </div>
      <div class="actions field full"><button class="btn secondary" type="submit">Continuar</button></div>
    </form>
  `;
}

function placeFormTemplate(drama) {
  return `
    <div class="section-title">
      <h2>Adicionar “${esc(drama.title)}”</h2>
    </div>
    <section class="form-card">
      <div class="selected-drama">
        <img class="poster" src="${esc(drama.cover || POSTER_PLACEHOLDER)}" alt="Capa de ${esc(drama.title)}" />
        <div>
          <p class="muted">${drama.mediaType === "movie" ? "Filme" : `${drama.episodes || "?"} episódios`}${drama.origem ? ` · ${esc(drama.origem)}` : ""} · ${drama.year || "—"}${drama.rating ? ` · nota ${drama.rating}` : ""}</p>
          <p>${esc(drama.synopsis || "Sem sinopse disponível.")}</p>
          <div class="chips">${(drama.genres || []).map((genre) => `<span class="chip">${esc(genre)}</span>`).join("")}</div>
        </div>
      </div>
      <form id="add-form" class="form-grid">
        <div class="field">
          <label for="status">Colocar em</label>
          <select id="status" name="status">
            ${statuses.slice(0, 5).map((status) => `<option value="${status.key}">${status.label}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="currentEpisode">Episódio atual</label>
          <input id="currentEpisode" name="currentEpisode" type="number" min="0" max="${drama.episodes || 999}" value="0" />
        </div>
        <div class="field">
          <label for="reason">Motivo</label>
          <select id="reason" name="reason">
            ${["Indicação de doramiga", "Vi no TikTok", "Gosto do ator/atriz", "Parece sofrer gostoso", "Romance fofo", "Está todo mundo falando", "Quero ver depois", "Quero ver com as doramigas", "Escolhido a dedo"].map((item) => `<option>${item}</option>`).join("")}
            <option value="__outro">Outro (escrever)…</option>
          </select>
        </div>
        <div class="field" id="reason-custom-field" hidden>
          <label for="reasonCustom">Qual o seu motivo?</label>
          <input id="reasonCustom" name="reasonCustom" placeholder="Ex.: amo a trilha sonora" autocomplete="off" />
        </div>
        <div class="field">
          <label for="priority">Prioridade</label>
          <select id="priority" name="priority">
            ${["Quero muito", "Talvez", "Ver quando acabar outro", "Ver com as doramigas", "Esperando ter psicológico"].map((item) => `<option>${item}</option>`).join("")}
          </select>
        </div>
        <div class="field full">
          <label for="mood">Como está sendo?</label>
          <select id="mood" name="mood">
            ${["Estou amando", "Estou chorando", "Estou passando raiva", "Está lento", "Estou confusa", "Estou viciada", "Não tenho psicológico"].map((item) => `<option>${item}</option>`).join("")}
          </select>
        </div>
        <div class="actions field full">
          <button class="btn" type="submit">Adicionar dorama</button>
        </div>
      </form>
    </section>
  `;
}

const LISTA_VAZIA = {
  watching: "Nada em andamento. Bora começar um? ▶️",
  wishlist: "Sua watchlist está vazia. Adicione o que você quer ver. 📝",
  finished: "Você ainda não finalizou nenhum dorama. 🎬",
  paused: "Nenhum pausado por aqui. 👏",
  dropped: "Nenhum dropado. Você é forte. 💪",
  favorites: "Sem favoritos ainda. Toque no ♥ nos seus doramas. 💕",
  comfort: "Marque um dorama como conforto (nos detalhes). 🧸",
};

function sortDramas(list) {
  const arr = list.slice();
  if (listSort === "az") arr.sort((a, b) => a.title.localeCompare(b.title));
  else if (listSort === "nota") arr.sort((a, b) => Number(b.personalRating || 0) - Number(a.personalRating || 0));
  else if (listSort === "progresso") arr.sort((a, b) => Number(b.currentEpisode || 0) - Number(a.currentEpisode || 0));
  return arr; // "recente" mantém a ordem atual
}

function resumoLista(todos) {
  if (!todos.length) return "";
  const horas = Math.round(todos.reduce((s, d) => s + Number(d.currentEpisode || 0), 0) * 1.05);
  const counts = {};
  todos.forEach((d) => (d.genres || []).forEach((g) => { counts[g] = (counts[g] || 0) + 1; }));
  const topGenero = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const partes = [`${todos.length} ${todos.length === 1 ? "dorama" : "doramas"}`];
  if (horas) partes.push(`~${horas}h de tela`);
  if (topGenero) partes.push(`mais: ${topGenero}`);
  return partes.join(" · ");
}

function listsTemplate() {
  const todos = byStatus(state.activeList);
  const lista = sortDramas(todos);
  const sorts = [["recente", "Recentes"], ["az", "A-Z"], ["nota", "Maior nota"], ["progresso", "Mais avançados"]];
  return `
    <div class="section-title">
      <h2>Minhas listas</h2>
      <button class="btn ghost" data-view="add">${icon("add")} Adicionar</button>
    </div>
    <div class="tabs">
      ${statuses.map((status) => `<button class="${state.activeList === status.key ? "active" : ""}" data-active-list="${status.key}">${status.label} <b>${byStatus(status.key).length}</b></button>`).join("")}
    </div>
    ${todos.length ? `<p class="list-summary">${esc(resumoLista(todos))}</p>` : ""}
    ${todos.length
      ? `<div class="list-toolbar">
           <input id="list-search" type="search" placeholder="🔍 Buscar nesta lista…" autocomplete="off" />
           <select id="list-sort">${sorts.map(([v, l]) => `<option value="${v}" ${listSort === v ? "selected" : ""}>${l}</option>`).join("")}</select>
           <button class="btn ghost view-toggle" data-toggle-view title="Alternar visualização">${listView === "grade" ? "☰ Lista" : "▦ Grade"}</button>
         </div>`
      : ""}
    ${lista.length
      ? (listView === "grade"
          ? `<section class="grade-grid">${lista.map(dramaGradeCard).join("")}</section>`
          : `<section class="drama-grid">${lista.map(dramaCard).join("")}</section>`)
        + `<div id="list-empty" class="empty" hidden>Nenhum resultado pra essa busca.</div>`
      : `<div class="empty">${LISTA_VAZIA[state.activeList] || "Nada aqui ainda."}</div>`}
  `;
}

function dramaGradeCard(drama) {
  const ep = Number(drama.currentEpisode || 0);
  const total = Number(drama.episodes || 0);
  const pct = total ? Math.min(100, Math.round((ep / total) * 100)) : 0;
  const showProgress = drama.status !== "wishlist" && total > 0 && ep > 0;
  return `
    <button class="grade-card list-item" data-detail="${drama.id}" data-title="${esc((drama.title || "").toLowerCase())}">
      <img src="${esc(thumb(drama.cover) || POSTER_PLACEHOLDER)}" alt="${esc(drama.title)}" loading="lazy" decoding="async" />
      ${drama.favorite ? `<span class="poster-fav">${icon("heart")}</span>` : ""}
      ${showProgress ? `<span class="grade-progress"><span style="width:${pct}%"></span></span>` : ""}
      <span class="grade-name">${esc(drama.title)}</span>
    </button>`;
}

function clubFormsTemplate() {
  const temClubes = (state.clubs || []).length > 0;
  return `
    <div class="section-title">
      <h2>${temClubes ? "Outro clube" : "Clube das Doramigas"}</h2>
      ${temClubes ? `<button class="btn ghost" data-cancel-add-club>Voltar</button>` : ""}
    </div>
    <section class="form-card">
      <p class="muted">Crie um clube e convide suas doramigas pelo código — ou entre em um com o código que te passaram. Você pode estar em vários.</p>
      <form id="create-club-form" class="form-grid">
        <div class="field full">
          <label for="club-name">Criar um clube</label>
          <input id="club-name" name="name" placeholder="Clube das Doramigas" required />
        </div>
        <div class="actions field full"><button class="btn" type="submit">Criar clube</button></div>
      </form>
    </section>
    <section class="form-card">
      <form id="join-club-form" class="form-grid">
        <div class="field full">
          <label for="club-code">Entrar com código</label>
          <input id="club-code" name="code" placeholder="DORAMA-1234" autocomplete="off" required />
        </div>
        <div class="actions field full"><button class="btn secondary" type="submit">Entrar no clube</button></div>
      </form>
    </section>
  `;
}

function legacyClubTemplate() {
  if (!state.clubs || state.clubs.length === 0 || addingClub) {
    return clubFormsTemplate();
  }

  const switcher = `
    <div class="tabs">
      ${state.clubs.map((c) => `<button class="${state.club?.id === c.id ? "active" : ""}" data-switch-club="${c.id}">${esc(c.name)}</button>`).join("")}
      <button data-add-club>＋ Outro</button>
    </div>`;

  const subtabs = [
    ["mural", "💬 Mural"],
    ["decidir", "🎬 Bora ver"],
    ["ranking", "🏅 Ranking"],
    ["galera", "🫂 Galera"],
  ];

  const membros = clubMembers.length
    ? clubMembers.map((member) => `<div class="card"><strong>${esc(member.name || "(sem nome)")}</strong>${member.nickname ? `<p class="muted">${esc(member.nickname)}</p>` : ""}</div>`).join("")
    : `<div class="empty">Carregando membros…</div>`;

  const conteudo = {
    mural: `${commentFormTemplate()}${clubFeedTemplate()}`,
    decidir: `
      <div class="section-title"><h2>🎬 Dorama do mês</h2></div>${doramaDoMesTemplate()}
      <div class="section-title"><h2>🍿 Doramas em comum</h2></div>${doramasEmComumTemplate()}
      <div class="section-title"><h2>📝 Lista compartilhada</h2></div>${listaCompartilhadaTemplate()}`,
    ranking: `
      <div class="section-title"><h2>🏅 Ranking do clube</h2></div>${rankingClubeTemplate()}
      <div class="section-title"><h2>💞 Doramigas compatíveis</h2></div>${compatibilidadeTemplate()}`,
    galera: `
      <div class="section-title"><h2>Doramigas no clube (${clubMembers.length || "…"})</h2></div>
      <section class="grid cards">${membros}</section>
      <div class="section-title"><h2>📰 Feed</h2></div>${atividadesTemplate()}
      <div class="section-title"><h2>📔 Diário compartilhado</h2></div>${diarioCompartilhadoTemplate()}
      <div class="section-title"><h2>Convidar e gerenciar</h2></div>
      <section class="grid cards">
        <button class="card" data-share-club><strong>Chamar doramiga no WhatsApp</strong><p class="muted">Envia o código ${esc(state.club.code)}</p></button>
        <button class="card" data-leave-club><strong>Sair do clube</strong><p class="muted">Você deixa de ver este clube</p></button>
      </section>`,
  };

  return `
    ${switcher}
    <div class="section-title">
      <h2>${esc(state.club.name)}</h2>
      <div style="display:flex;gap:8px">
        <button class="btn ghost" data-rename-club>✏️ Renomear</button>
        <button class="btn ghost" data-copy-code>📋 ${esc(state.club.code)}</button>
      </div>
    </div>
    <div class="tabs club-subtabs">
      ${subtabs.map(([k, l]) => `<button class="${clubTab === k ? "active" : ""}" data-club-tab="${k}">${l}</button>`).join("")}
    </div>
    ${conteudo[clubTab] || conteudo.mural}
  `;
}

function clubRoleLabel(role) {
  return { owner: "👑 Dono", moderator: "🛡️ Moderador", member: "Membro" }[role] || "Membro";
}

// Painel de perfil de um membro (aba Sobre): cargo, progresso, pontos, match, badges e moderação.
function clubMemberProfileTemplate(m) {
  const isMe = m.user_id === authUser?.id;
  const featured = clubSocial.featured;
  const ck = (featured?.checkins || []).find((c) => c.user_id === m.user_id);
  const pts = (clubSocial.points || []).find((p) => p.user_id === m.user_id);
  const comp = isMe ? null : (clubSocial.compat || []).find((c) => c.name === m.name);

  // Badges derivados dos dados que já temos.
  const ranking = [...(clubSocial.points || [])].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
  const topId = ranking[0] && Number(ranking[0].points || 0) > 0 ? ranking[0].user_id : null;
  const finishers = (featured?.checkins || []).filter((c) => c.status === "finished").sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
  const firstFinisherId = finishers[0]?.user_id || null;
  const badges = [];
  if (m.user_id === topId) badges.push("🥇 Mais ativo");
  if (m.user_id === firstFinisherId) badges.push("🏁 Terminou primeiro");
  else if (ck?.status === "finished") badges.push("🎬 Maratonista");

  const progresso = !featured
    ? `<span class="muted">Sem dorama atual</span>`
    : ck
      ? (ck.status === "finished" ? `✅ Terminou ${esc(featured.title)}` : `▶️ Ep. ${Number(ck.current_episode || 0)} de ${esc(featured.title)}`)
      : `<span class="muted">Ainda não começou</span>`;
  const ultimo = ck?.updated_at ? `Último check-in ${timeAgo(ck.updated_at)}` : "";

  // Moderação (backend: manage_club_member, mig 47).
  const myMember = currentClubMember();
  const iAmOwner = state.club.owner_id === authUser?.id || myMember?.role === "owner";
  const iAmMod = myMember?.role === "moderator";
  const targetOwner = m.role === "owner";
  const acts = [];
  if (!isMe && !targetOwner) {
    if (iAmOwner) {
      acts.push(m.role === "moderator"
        ? `<button class="btn ghost" type="button" data-manage-member="${m.user_id}" data-action="demote">Rebaixar a membro</button>`
        : `<button class="btn ghost" type="button" data-manage-member="${m.user_id}" data-action="promote">🛡️ Tornar moderador</button>`);
      acts.push(`<button class="btn ghost danger" type="button" data-manage-member="${m.user_id}" data-action="remove">Remover do clube</button>`);
    } else if (iAmMod && m.role !== "moderator") {
      acts.push(`<button class="btn ghost danger" type="button" data-manage-member="${m.user_id}" data-action="remove">Remover do clube</button>`);
    }
  }

  return `
    <section class="membro-perfil">
      <button class="membro-perfil-back" type="button" data-club-profile-close>← Voltar</button>
      <div class="membro-perfil-head">
        ${clubAvatarMini(m)}
        <div class="mp-id">
          <strong>${esc(m.name || "(sem nome)")}${isMe ? " (você)" : ""}</strong>
          ${m.nickname ? `<span class="mp-nick">“${esc(m.nickname)}”</span>` : ""}
          <span class="chip">${clubRoleLabel(m.role)}</span>
        </div>
      </div>
      ${badges.length ? `<div class="mp-badges">${badges.map((b) => `<span class="mp-badge">${b}</span>`).join("")}</div>` : ""}
      <div class="mp-rows">
        <div class="mp-row"><span>🎬 Progresso</span><b>${progresso}</b></div>
        ${ultimo ? `<div class="mp-row"><span>🕒 Atividade</span><b>${ultimo}</b></div>` : ""}
        <div class="mp-row"><span>🏆 Pontos no clube</span><b>${Number(pts?.points || 0)} pts</b></div>
        ${comp ? `<div class="mp-row"><span>💞 Match com você</span><b>${comp.pct}% · ${comp.comuns} em comum</b></div>` : ""}
      </div>
      ${acts.length ? `<div class="mp-mod"><span class="mp-mod-title">Moderação</span><div class="mp-mod-actions">${acts.join("")}</div></div>` : ""}
    </section>`;
}

function currentClubMember() {
  if (!authUser) return null;
  return clubMembers.find((member) => member.user_id === authUser.id) || null;
}

function mapClubRow(club) {
  if (!club) return null;
  return {
    id: club.id,
    name: club.name,
    code: club.code,
    owner_id: club.owner_id || null,
    description: club.description || "",
    rules: club.rules || "",
    tags: Array.isArray(club.tags) ? club.tags : [],
    pinned_notice: club.pinned_notice || "",
  };
}

function clubFeaturedDrama() {
  if (clubSocial.for === state.club?.id && clubSocial.featured) return clubSocial.featured;
  if (clubSocial.for !== state.club?.id || !clubSocial.picks?.length) return null;
  return clubSocial.picks[0] || null;
}

// Cada clube ganha uma carinha própria (emoji determinístico pelo id).
const CLUB_EMOJIS = ["🌸", "🎬", "💜", "🍿", "🌙", "⭐", "🔥", "🎀", "🦋", "🌷", "🍓", "☕", "🎧", "📺", "💫", "🐰", "🌈", "🫶", "🥹", "👑"];
const AVATAR_CORES = ["#df4f94", "#8a5cf6", "#f97316", "#22c55e", "#38bdf8", "#ec4899", "#eab308", "#14b8a6"];
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0;
  return h;
}
function clubEmoji(club) {
  return CLUB_EMOJIS[hashStr(club?.id || club?.name || "?") % CLUB_EMOJIS.length];
}
function clubAvatarMini(m) {
  const nome = m.name || m.nickname || "?";
  if (m.photo) return `<span class="club-av" title="${esc(nome)}"><img src="${esc(m.photo)}" alt="" loading="lazy" /></span>`;
  const ini = (nome.trim().charAt(0) || "?").toUpperCase();
  return `<span class="club-av" title="${esc(nome)}" style="background:${AVATAR_CORES[hashStr(nome) % AVATAR_CORES.length]}">${esc(ini)}</span>`;
}

function clubHeaderTemplate() {
  const totalMembros = clubMembersFor === state.club.id ? clubMembers.length : 0;
  const cover = clubSocial.featured?.cover || clubFeaturedDrama()?.cover || "";
  const vibe = state.club.description || "Clube ainda sem vibe — caprichem na descrição na aba Sobre. 💜";
  const avatares = clubMembers.slice(0, 6).map(clubAvatarMini).join("");
  const extra = totalMembros > 6 ? `<span class="club-av more">+${totalMembros - 6}</span>` : "";

  return `
    <section class="club-hero2" ${cover ? `style="--club-cover:url('${esc(cover)}')"` : ""}>
      <div class="club-hero2-veil"></div>
      <div class="club-hero2-row">
        <div class="club-avatar-lg">${clubEmoji(state.club)}</div>
        <div class="club-hero2-main">
          <span class="club-eyebrow">${icon("club")} Clube</span>
          <h2>${esc(state.club.name)}</h2>
          <p class="club-vibe">${esc(vibe)}</p>
        </div>
      </div>
      <div class="club-avatars">
        ${avatares || `<span class="muted" style="font-size:.8rem">Carregando membros…</span>`}${extra}
        <span class="club-av-count">${totalMembros || "…"} membros</span>
      </div>
    </section>
  `;
}

// Aviso fixado no topo do clube (dono/moderador edita/remove).
function clubAvisoTemplate() {
  const aviso = state.club?.pinned_notice || "";
  const canManage = currentClubMember()?.role === "owner" || currentClubMember()?.role === "moderator" || state.club.owner_id === authUser?.id;
  if (!aviso && !canManage) return "";
  if (!aviso) return `<button class="club-aviso-add" type="button" data-set-notice>📌 Fixar um aviso pro clube</button>`;
  return `
    <section class="club-aviso">
      <span class="club-aviso-ico">📌</span>
      <p>${esc(aviso)}</p>
      ${canManage ? `<div class="club-aviso-acts"><button type="button" data-set-notice title="Editar aviso">${icon("detail")}</button><button type="button" data-clear-notice title="Remover aviso">✕</button></div>` : ""}
    </section>`;
}

// Relatório do dorama: melhor episódio, mais comentado, média, quem terminou primeiro.
// Corrida de episódios: quem está em qual episódio do dorama atual.
function clubCorridaTemplate() {
  if (clubSocial.for !== state.club.id) return "";
  const f = clubSocial.featured;
  if (!f?.id) return "";
  const checkins = Array.isArray(f.checkins) ? f.checkins : [];
  const maxCk = checkins.reduce((mx, c) => Math.max(mx, Number(c.current_episode || 0)), 0);
  const total = Math.max(Number(clubSocial.epCount || 0), maxCk, 1);
  const linhas = (clubMembers.length ? clubMembers : checkins.map((c) => ({ user_id: c.user_id, name: c.name }))).map((m) => {
    const ck = checkins.find((c) => c.user_id === m.user_id);
    return { m, ep: Number(ck?.current_episode || 0), fin: ck?.status === "finished" };
  }).sort((a, b) => (Number(b.fin) - Number(a.fin)) || (b.ep - a.ep));
  if (!linhas.length) return "";
  const rows = linhas.map((x, i) => {
    const nome = x.m.name || x.m.nickname || "?";
    const pct = x.fin ? 100 : Math.min(100, Math.round((x.ep / total) * 100));
    const lider = i === 0 && (x.ep > 0 || x.fin);
    return `
      <div class="corrida-row">
        ${clubAvatarMini(x.m)}
        <div class="corrida-main">
          <div class="corrida-top"><strong>${esc(nome)}${lider ? " 🥇" : ""}</strong><span>${x.fin ? "✅ terminou" : `ep. ${x.ep}`}</span></div>
          <div class="corrida-bar"><i style="width:${pct}%"></i></div>
        </div>
      </div>`;
  }).join("");
  return `
    <div class="section-title compact"><h2>🏁 Corrida de episódios</h2></div>
    <section class="corrida">${rows}<small class="corrida-total">de ${total} episódio${total === 1 ? "" : "s"}</small></section>`;
}

function clubRelatorioTemplate() {
  if (clubSocial.for !== state.club.id) return "";
  const f = clubSocial.featured;
  if (!f?.id) return "";
  const ratings = clubSocial.epRatings || [];
  const checkins = Array.isArray(f.checkins) ? f.checkins : [];
  const membros = Math.max(1, clubMembers.length || checkins.length || 1);

  const comentsPorEp = {};
  let totalComents = 0;
  (clubFeedItems || []).forEach((i) => {
    if (Number(i.tmdb_id) === Number(f.tmdb_id) && Number(i.spoiler_episode) >= 1) {
      comentsPorEp[i.spoiler_episode] = (comentsPorEp[i.spoiler_episode] || 0) + 1;
      totalComents++;
    }
  });

  let melhor = null;
  ratings.forEach((r) => { if (Number(r.votes) > 0 && (!melhor || Number(r.avg_stars) > Number(melhor.avg_stars))) melhor = r; });
  let maisComentado = null;
  Object.entries(comentsPorEp).forEach(([ep, n]) => { if (!maisComentado || n > maisComentado.n) maisComentado = { ep: Number(ep), n }; });
  const comVoto = ratings.filter((r) => Number(r.votes) > 0);
  const mediaGeral = comVoto.length ? comVoto.reduce((s, r) => s + Number(r.avg_stars), 0) / comVoto.length : 0;
  const finishers = checkins.filter((c) => c.status === "finished").sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
  const primeiro = finishers[0];
  const primeiroNome = primeiro ? (clubMembers.find((m) => m.user_id === primeiro.user_id)?.name || primeiro.name || "alguém") : null;

  const star = (n) => Number(n).toFixed(1).replace(".0", "");
  const items = [];
  if (melhor) items.push(["⭐ Melhor episódio", `Ep. ${melhor.episode_number} · ${star(melhor.avg_stars)}★`]);
  if (maisComentado) items.push(["💬 Mais comentado", `Ep. ${maisComentado.ep} · ${maisComentado.n} surto${maisComentado.n > 1 ? "s" : ""}`]);
  if (mediaGeral) items.push(["📊 Média do clube", `${star(mediaGeral)}★`]);
  if (primeiroNome) items.push(["🏁 Terminou primeiro", esc(primeiroNome)]);
  items.push(["✅ Já terminaram", `${finishers.length}/${membros}`]);
  if (totalComents) items.push(["🗨️ Surtos por episódio", `${totalComents}`]);

  return `
    <div class="section-title compact"><h2>📊 Relatório do dorama</h2></div>
    <section class="relatorio">
      <div class="relatorio-drama">${f.cover ? `<img src="${esc(f.cover)}" alt="" loading="lazy" />` : `<span class="relatorio-noimg">🎬</span>`}<strong>${esc(f.title)}</strong></div>
      <div class="relatorio-grid">${items.map(([l, v]) => `<div class="rel-item"><span>${l}</span><b>${v}</b></div>`).join("")}</div>
    </section>`;
}

// Lobby do clube: tudo separadinho e fácil de achar, num lugar só.
function clubLobbyTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando o clube…</div>`;
  const featured = clubSocial.featured;
  const lastChat = (clubSocial.chat || [])[0];
  const totalPosts = clubFeedFor === state.club.id ? clubFeedItems.length : 0;
  const lastPost = clubFeedItems[0];
  const limite = new Date(Date.now() - 3600000);
  const prox = (clubSocial.events || [])
    .filter((e) => e.status !== "cancelled" && new Date(e.starts_at) >= limite)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
  const pts = clubSocial.points || [];
  const minhaIdx = pts.findIndex((r) => r.user_id === authUser?.id);
  const meu = minhaIdx >= 0 ? pts[minhaIdx] : null;
  const lider = pts[0];
  const corte = (t, n) => { const s = String(t || ""); return s.length > n ? `${esc(s.slice(0, n))}…` : esc(s); };

  const tile = (ico, titulo, corpo, tab, cta) => `
    <button class="club-lobby-card" type="button" data-club-tab="${tab}">
      <span class="cl-ico">${ico}</span>
      <span class="cl-body"><strong>${titulo}</strong>${corpo}</span>
      <span class="cl-go">${cta || "abrir"} ›</span>
    </button>`;

  const featureCard = featured
    ? `<button class="club-lobby-feature" type="button" data-club-tab="doramas">
         ${featured.cover ? `<img src="${esc(featured.cover)}" alt="" />` : `<span class="clf-emoji">🎬</span>`}
         <span class="clf-body"><span class="clf-eyebrow">🎬 Dorama do clube</span><strong>${esc(featured.title)}</strong><small>Seu check-in: ep. ${Number(featured.my_episode || 0)}</small></span>
         <span class="cl-go">›</span>
       </button>`
    : `<button class="club-lobby-feature" type="button" data-club-tab="doramas"><span class="clf-emoji">🎬</span><span class="clf-body"><span class="clf-eyebrow">🎬 Dorama do clube</span><strong>Escolham o dorama do clube</strong><small>Ninguém fixou um ainda — abram a Escolha</small></span><span class="cl-go">›</span></button>`;

  const cyc = clubSocial.cycle || {};
  const escolhaTxt = cyc.voting_open
    ? `<small>🗳️ Votação aberta — votem no próximo!</small>`
    : `<small class="muted">${Number(cyc.members_with_quota || 0)}/${Number(cyc.members_count || clubMembers.length || 1)} já sugeriram 2</small>`;
  return `
    ${featureCard}
    <div class="club-lobby-grid">
      ${tile("💬", "Chat", lastChat ? `<small>${esc(lastChat.author || "alguém")}: ${corte(lastChat.body, 38)}</small>` : `<small class="muted">Sem mensagens — comecem a conversa</small>`, "chat", "abrir")}
      ${tile("📌", "Mural", lastPost ? `<small>${totalPosts} post(s) · último por ${esc(lastPost.author || "alguém")}</small>` : `<small class="muted">Ninguém surtou ainda</small>`, "feed", "ver")}
      ${tile("🗳️", "Próximo dorama", escolhaTxt, "doramas", "ver")}
      ${tile("📅", "Próximo encontro", prox ? `<small>${corte(prox.title, 28)} · ${esc(formatDateTimeShort(prox.starts_at))}</small>` : `<small class="muted">Nada agendado</small>`, "eventos", "agenda")}
      ${tile("🏆", "Ranking", meu ? `<small>Você: ${Number(meu.points || 0)} pts · ${minhaIdx + 1}º lugar</small>` : (lider ? `<small>Líder: ${esc(lider.name)} (${Number(lider.points || 0)} pts)</small>` : `<small class="muted">Sem pontos ainda</small>`), "ranking", "ver")}
    </div>
  `;
}

function formatDateTimeShort(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(value);
  }
}

function clubAboutTemplate() {
  const souDono = state.club.owner_id === authUser?.id;
  const rules = state.club.rules || "Sem regras ainda. Sugestão: avisar spoilers, respeitar opiniões e manter o clima leve. 💜";
  const dramas = clubSocial.for === state.club.id ? (clubSocial.clubDramas || []) : [];
  const assistidos = dramas.filter((d) => d.status !== "active");
  const membros = clubMembers.length;

  const conquistas = [
    { emoji: "🎬", n: dramas.length, label: dramas.length === 1 ? "dorama escolhido junto" : "doramas escolhidos juntos" },
    { emoji: "🏁", n: assistidos.length, label: assistidos.length === 1 ? "maratona concluída" : "maratonas concluídas" },
    { emoji: "👥", n: membros, label: membros === 1 ? "membro" : "membros" },
  ];

  const dramaCards = dramas.length
    ? `<section class="sobre-dramas">${dramas.map((d) => `
        <div class="sobre-drama">
          ${d.cover ? `<img src="${esc(d.cover)}" alt="" loading="lazy" />` : `<span class="sobre-drama-noimg">🎬</span>`}
          <strong>${esc(d.title)}</strong>
          <small>${d.status === "active" ? "▶️ assistindo" : "✓ já visto"}</small>
        </div>`).join("")}</section>`
    : `<div class="empty">Quando o clube escolher e terminar doramas, o histórico aparece aqui. 🎬</div>`;

  const perfilAberto = clubProfileOpen && clubMembers.find((m) => m.user_id === clubProfileOpen);
  const membersHtml = !clubMembers.length
    ? `<div class="empty">Carregando membros…</div>`
    : perfilAberto
      ? clubMemberProfileTemplate(perfilAberto)
      : `<section class="sobre-membros">${clubMembers.map((m) => `
        <button class="sobre-membro" type="button" data-club-profile="${m.user_id}">
          ${clubAvatarMini(m)}
          <div class="sobre-membro-info"><strong>${esc(m.name || "(sem nome)")}</strong>${m.nickname ? `<small>${esc(m.nickname)}</small>` : ""}</div>
          <span class="chip">${clubRoleLabel(m.role)}</span>
          <span class="cl-go">›</span>
        </button>`).join("")}</section>`;

  return `
    <div class="section-title"><h2>💜 Sobre o clube</h2><button class="btn ghost" data-edit-club-about>${icon("detail")} Editar</button></div>
    <section class="sobre-vibe">
      <div class="sobre-avatar">${clubEmoji(state.club)}</div>
      <div class="sobre-vibe-txt">
        <strong>${esc(state.club.name)}</strong>
        <p>${esc(state.club.description || "Caprichem na descrição — é a vibe do clube. 💜 (toque em Editar)")}</p>
      </div>
    </section>

    <div class="section-title compact"><h2>🎖️ Conquistas do clube</h2></div>
    <section class="sobre-conquistas">${conquistas.map((c) => `<div class="sobre-conq"><span class="sc-emoji">${c.emoji}</span><strong>${c.n}</strong><small>${esc(c.label)}</small></div>`).join("")}</section>

    <div class="section-title compact"><h2>🏆 Doramas do clube</h2></div>
    ${dramaCards}

    <div class="section-title compact"><h2>📜 Regras</h2></div>
    <section class="form-card"><p style="margin:0;line-height:1.5">${esc(rules)}</p></section>

    <div class="section-title compact"><h2>👥 Membros (${membros || "…"})</h2></div>
    ${membersHtml}

    <div class="section-title compact"><h2>Convidar e gerenciar</h2></div>
    <section class="grid cards">
      <button class="card" data-share-club><strong>Chamar gente no WhatsApp</strong><p class="muted">Envia o código ${esc(state.club.code)}</p></button>
      ${souDono ? `<button class="card" data-rename-club><strong>Renomear clube</strong><p class="muted">Ajusta o nome que aparece no topo.</p></button>` : ""}
      <button class="card" data-leave-club><strong>Sair do clube</strong><p class="muted">${souDono ? "O membro mais antigo vira o dono." : "Você deixa de ver este clube."}</p></button>
      ${souDono ? `<button class="card card-danger" data-delete-club><strong>🗑️ Excluir clube</strong><p class="muted">Apaga o clube pra todos. Não dá pra desfazer.</p></button>` : ""}
    </section>
  `;
}

function clubTemplate() {
  if (!state.clubs || state.clubs.length === 0 || addingClub) {
    return clubFormsTemplate();
  }

  if (clubTab === "desafios") clubTab = "ranking"; // Missões foi unida ao Ranking
  if (!["inicio", "feed", "chat", "doramas", "eventos", "ranking", "sobre"].includes(clubTab)) clubTab = "inicio";

  const switcher = `
    <div class="tabs">
      ${state.clubs.map((c) => `<button class="${state.club?.id === c.id ? "active" : ""}" data-switch-club="${c.id}">${esc(c.name)}</button>`).join("")}
      <button data-add-club>+ Outro</button>
    </div>`;

  const subtabs = [
    ["inicio", "Início"],
    ["feed", "Mural"],
    ["chat", "Chat"],
    ["doramas", "Escolha"],
    ["eventos", "Agenda"],
    ["ranking", "Ranking"],
    ["sobre", "Sobre"],
  ];

  const conteudo = {
    inicio: clubLobbyTemplate(),
    feed: `${commentFormTemplate()}
      <div class="section-title compact"><h2>💬 Surtos do clube</h2></div>${clubFeedTemplate()}
      <div class="section-title compact"><h2>🔔 Novidades do clube</h2></div>${atividadesTemplate()}
      <div class="section-title compact"><h2>📖 Diário compartilhado</h2></div>${diarioCompartilhadoTemplate()}`,
    chat: clubeChatTemplate(),
    doramas: `
      ${clubeCicloTemplate()}
      ${clubEpisodiosTemplate()}
      ${clubSugestoesTemplate()}
      <div class="section-title compact"><h2>🤝 Doramas em comum</h2></div>${doramasEmComumTemplate()}`,
    ranking: `
      <div class="section-title"><h2>🏆 Ranking de pontos</h2></div>${clubPointsTemplate()}
      ${clubCorridaTemplate()}
      ${clubRelatorioTemplate()}
      <div class="section-title compact"><h2>🎯 Rotinas do dorama</h2></div>${clubRotinasTemplate()}
      <div class="section-title compact"><h2>💞 Doramigas compatíveis</h2></div>${compatibilidadeTemplate()}`,
    eventos: clubeEventosTemplate(),
    sobre: clubAboutTemplate(),
  };

  return `
    ${switcher}
    ${clubHeaderTemplate()}
    ${clubAvisoTemplate()}
    <div class="tabs club-subtabs">
      ${subtabs.map(([k, l]) => `<button class="${clubTab === k ? "active" : ""}" data-club-tab="${k}">${l}</button>`).join("")}
    </div>
    ${conteudo[clubTab] || conteudo.inicio}
  `;
}

const REACOES = [
  ["😱", "Surtei"],
  ["😭", "Chorei"],
  ["💔", "Não superei"],
  ["👀", "Quero ver"],
  ["😡", "Passa raiva"],
  ["😍", "Amo esse"],
  ["🙅", "Eu avisei"],
  ["🧽", "Passei pano"],
];

const FRASES_DORAMEIRA = [
  "Eu avisei que ele não prestava.",
  "Esse homem precisa de terapia.",
  "Não superei e nem pretendo.",
  "Esse casal carregou o dorama.",
  "Não tenho psicológico pra isso.",
  "Ele olhou pra ela e acabou comigo.",
];

function barraReacoes(commentId) {
  const minhas = (clubSocial.reactions || []).filter((r) => r.comment_id === commentId);
  return `
    <div class="reacoes">
      ${REACOES.map(([emoji, nome]) => {
        const r = minhas.find((x) => x.emoji === emoji);
        const total = r ? r.total : 0;
        const mine = r && r.mine;
        return `<button class="reacao ${mine ? "mine" : ""}" data-react="${commentId}" data-emoji="${emoji}" title="${nome}">${emoji}${total ? ` <b>${total}</b>` : ""}</button>`;
      }).join("")}
    </div>`;
}

function barraReacoesSurto(surtoId) {
  const minhas = (clubSocial.surtoReactions || []).filter((r) => r.surto_id === surtoId);
  return `
    <div class="reacoes">
      ${REACOES.map(([emoji, nome]) => {
        const r = minhas.find((x) => x.emoji === emoji);
        const total = r ? r.total : 0;
        const mine = r && r.mine;
        return `<button class="reacao ${mine ? "mine" : ""}" data-react-surto="${surtoId}" data-emoji="${emoji}" title="${nome}">${emoji}${total ? ` <b>${total}</b>` : ""}</button>`;
      }).join("")}
    </div>`;
}

const CHAT_REACOES = [
  ["❤️", "Amei"],
  ["😂", "Ri alto"],
  ["😮", "Chocada"],
];

function barraReacoesChat(messageId) {
  const doMsg = (clubSocial.chatReactions || []).filter((r) => r.message_id === messageId);
  // só mostra os emojis que ALGUÉM já usou (viram chips clicáveis)
  const chips = doMsg
    .filter((r) => Number(r.total) > 0)
    .map((r) => `<button class="chat-reacao ${r.mine ? "mine" : ""}" data-react-chat="${messageId}" data-emoji="${r.emoji}">${r.emoji} <b>${r.total}</b></button>`)
    .join("");
  const aberto = chatReactPicker === messageId;
  const picker = aberto
    ? CHAT_REACOES.map(([e, nome]) => `<button class="chat-reacao pick" data-react-chat="${messageId}" data-emoji="${e}" title="${nome}">${e}</button>`).join("")
    : "";
  return `
    <div class="chat-reacoes">
      ${chips}${picker}
      <button class="chat-react-add ${aberto ? "on" : ""}" type="button" data-react-open="${messageId}" title="Reagir">${aberto ? "×" : "🙂+"}</button>
    </div>`;
}
function doramasEmComumTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando…</div>`;
  const total = clubMembers.length || 1;
  const dados = clubSocial.commonDramas;
  if (!dados.length) return `<div class="empty">Quando as doramigas adicionarem doramas, eles aparecem aqui agrupados.</div>`;
  const grupos = {
    "Todo mundo já viu": dados.filter((d) => Number(d.finished) >= total && total > 1),
    "Todo mundo quer ver": dados.filter((d) => Number(d.wishlist) >= total && total > 1),
    "Melhor pra ver juntas": dados.filter((d) => Number(d.wishlist) >= 2 && Number(d.finished) === 0),
  };
  const emoji = { "Todo mundo já viu": "✅", "Todo mundo quer ver": "💖", "Melhor pra ver juntas": "🍿" };
  const blocos = Object.entries(grupos)
    .filter(([, lista]) => lista.length)
    .map(([titulo, lista]) => {
      const mostra = lista.slice(0, 8);
      const resto = lista.length - mostra.length;
      const chips = mostra.map((d) => `<span class="comum-chip">${esc(d.title)}</span>`).join("");
      return `<div class="card comum-card"><span class="comum-titulo">${emoji[titulo] || "🎬"} ${esc(titulo)} <em>(${lista.length})</em></span><div class="comum-lista">${chips}${resto > 0 ? `<span class="comum-chip more">+${resto}</span>` : ""}</div></div>`;
    })
    .join("");
  return blocos ? `<section class="grid cards">${blocos}</section>` : `<div class="empty">Ainda sem doramas em comum o bastante. Adicionem mais! ✨</div>`;
}

const LISTA_VOTOS = ["Quero muito", "Tanto faz", "Já vi, mas vejo de novo", "Não tenho psicológico", "Não me chama pra sofrer"];

function legacyListaCompartilhadaTemplate() {
  const meusDramas = state.dramas.filter((d) => d.tmdbId);
  const addForm = `
    <form id="lista-add-form" class="search-bar" style="margin-bottom:12px">
      <select name="dramaId" required>
        <option value="">Sugerir um dorama pro grupo…</option>
        ${meusDramas.map((d) => `<option value="${d.id}">${esc(d.title)}</option>`).join("")}
      </select>
      <button class="btn" type="submit">Adicionar</button>
    </form>`;
  if (clubSocial.for !== state.club.id) return addForm + `<div class="empty">Carregando…</div>`;
  if (!clubSocial.list.length) return addForm + `<div class="empty">A lista do grupo está vazia. Sugira um dorama pra verem juntas! 💜</div>`;
  const itens = clubSocial.list
    .map((item) => {
      const votos = item.votes || {};
      const chips = Object.entries(votos)
        .map(([v, n]) => `<span class="chip">${esc(v)}: ${n}</span>`)
        .join("");
      const botoes = LISTA_VOTOS.map(
        (v) => `<button class="${item.my_vote === v ? "mine" : ""}" data-list-vote="${item.id}" data-vote="${esc(v)}">${esc(v)}</button>`,
      ).join("");
      return `
      <div class="card">
        <strong>${esc(item.title)}</strong>
        ${item.added_by_name ? `<span class="muted">sugerido por ${esc(item.added_by_name)}</span>` : ""}
        <div class="chips">${chips || '<span class="muted">sem votos ainda</span>'}</div>
        <div class="mini-actions voto-row">${botoes}</div>
        <div class="mini-actions"><button data-list-remove="${item.id}">${icon("trash")} Tirar</button></div>
      </div>`;
    })
    .join("");
  return addForm + `<section class="grid cards">${itens}</section>`;
}

function diasRestantes(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// Ciclo de temporada: assistindo agora (com progresso) + votação dos próximos.
function clubeCicloTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando o ciclo do clube…</div>`;
  const cycle = clubSocial.cycle || {};
  const featured = clubSocial.featured;
  const canManage = currentClubMember()?.role === "owner" || currentClubMember()?.role === "moderator" || state.club.owner_id === authUser?.id;
  const membros = Math.max(1, Number(cycle.members_count || clubMembers.length || 1));
  const terminaram = Number(cycle.finished_count || 0);
  const pct = Math.min(100, Math.round((terminaram / membros) * 100));
  const todosTerminaram = membros >= 2 && terminaram >= membros;
  const euTerminei = featured && featured.my_status === "finished";
  const votingOpen = Boolean(cycle.voting_open);
  const minhasSug = Number(cycle.my_suggestions || 0);
  const comQuota = Number(cycle.members_with_quota || 0);
  const faltam = Math.max(0, membros - comQuota);

  const assistindo = featured
    ? `<section class="ciclo-now">
        <div class="ciclo-now-head">
          ${featured.cover ? `<img src="${esc(featured.cover)}" alt="" />` : `<span class="ciclo-emoji">🎬</span>`}
          <div class="ciclo-now-info">
            <span class="clf-eyebrow">🎬 Assistindo agora</span>
            <strong>${esc(featured.title)}</strong>
            <small>${euTerminei ? "✅ você terminou este dorama" : `você está no episódio ${Number(featured.my_episode || 0)}`}</small>
          </div>
        </div>
        <div class="ciclo-prog">
          <div class="ciclo-bar"><i style="width:${pct}%"></i></div>
          <small>${terminaram}/${membros} do clube terminaram — só troca quando <strong>todos</strong> terminarem</small>
        </div>
        <p class="ciclo-hint muted">Marque seus episódios no <strong>Modo Episódio</strong> abaixo 👇 — cada um dá <strong>+1 no ranking</strong> 🎬.</p>
      </section>`
    : `<section class="ciclo-now"><span class="clf-eyebrow">🎬 Assistindo agora</span><p class="muted" style="margin:8px 0 0">Nenhum dorama oficial ainda. ${canManage ? "Sugiram abaixo e fixem o primeiro (botão Fixar)." : "Sugiram o primeiro abaixo."}</p></section>`;

  const banner = votingOpen
    ? `<div class="ciclo-banner open"><div><strong>🗳️ Votação aberta!</strong><small>todo mundo sugeriu — votem no próximo</small></div></div>`
    : `<div class="ciclo-banner"><div><strong>💡 Sugeridos</strong><small>cada um sugere 2 · você ${minhasSug}/2${faltam ? ` · faltam ${faltam} pessoa${faltam > 1 ? "s" : ""} sugerir` : ""}</small></div></div>`;

  return `${assistindo}${banner}`;
}

// Sugestões/votação do próximo dorama (separado do ciclo pra ficar DEPOIS dos episódios).
function clubSugestoesTemplate() {
  if (clubSocial.for !== state.club.id) return "";
  const cycle = clubSocial.cycle || {};
  const canManage = currentClubMember()?.role === "owner" || currentClubMember()?.role === "moderator" || state.club.owner_id === authUser?.id;
  return listaCompartilhadaTemplate(Boolean(cycle.voting_open), Number(cycle.my_suggestions || 0), canManage);
}

function listaCompartilhadaTemplate(votingOpen = true, minhasSug = 0, canManage = false) {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando…</div>`;
  const cheio = minhasSug >= 2;
  const lista = clubSocial.list || [];
  const total = lista.length;
  const membros = Math.max(1, Number(clubSocial.cycle?.members_count || clubMembers.length || 1));
  const comQuota = Number(clubSocial.cycle?.members_with_quota || 0);

  const busca = cheio
    ? `<p class="choice-full">✅ Você já deu suas 2 sugestões. Apague uma abaixo pra trocar.</p>`
    : `
      <form id="club-search-form" class="search-bar choice-search">
        <input name="q" placeholder="🔎 Buscar dorama no TMDB…" value="${esc(clubAddSearch.query)}" autocomplete="off" />
        <button class="btn" type="submit">Buscar</button>
      </form>
      ${clubAddSearch.loading ? `<p class="muted" style="margin:6px 0">Buscando…</p>` : ""}
      ${clubAddSearch.results.length ? `<div class="search-results">${clubAddSearch.results.slice(0, 8).map((d) => `<button type="button" class="search-result" data-club-add-tmdb="${d.tmdbId}" data-media="${esc(d.mediaType || "")}"><img src="${esc(thumb(d.cover) || POSTER_PLACEHOLDER)}" alt="" loading="lazy" /><span class="search-result-info"><strong>${esc(d.title)}</strong><small>${esc(midiaEtiqueta(d))}${d.year ? ` · ${d.year}` : ""}</small></span></button>`).join("")}</div>` : ""}`;

  // Líder (só quando a votação está aberta).
  const peso = { "Quero muito": 2, "Já vi, mas vejo de novo": 1, "Tanto faz": 0, "Não tenho psicológico": -1, "Não me chama pra sofrer": -2 };
  const score = (item) => Object.entries(item.votes || {}).reduce((s, [v, n]) => s + (peso[v] || 0) * Number(n), 0);
  let liderId = null;
  if (votingOpen && total) {
    let best = -Infinity;
    for (const it of lista) { const sc = score(it); if (sc > best) { best = sc; liderId = it.id; } }
  }

  const cards = lista.map((item) => {
    const totalVotos = Object.values(item.votes || {}).reduce((s, n) => s + Number(n), 0);
    const botoes = LISTA_VOTOS.map((v) => `<button class="${item.my_vote === v ? "mine" : ""}" data-list-vote="${item.id}" data-vote="${esc(v)}">${esc(v)}</button>`).join("");
    return `
      <article class="sug-card ${liderId === item.id ? "leading" : ""}">
        <div class="sug-top">
          ${item.cover ? `<img src="${esc(item.cover)}" alt="" loading="lazy" />` : `<span class="sug-noimg">🎬</span>`}
          <div class="sug-main">
            <strong>${liderId === item.id ? "🏆 " : ""}${esc(item.title)}</strong>
            <small>sugerido por ${esc(item.added_by_name || "alguém")}${votingOpen ? ` · ${totalVotos} voto${totalVotos === 1 ? "" : "s"}` : ""}</small>
          </div>
          <div class="sug-actions">
            ${canManage ? `<button data-list-feature="${item.id}" title="Fixar como atual">📌</button>` : ""}
            <button data-list-debate="${item.id}" title="Debater no mural">${icon("club")}</button>
            <button data-list-remove="${item.id}" title="Tirar">${icon("trash")}</button>
          </div>
        </div>
        ${votingOpen ? `<div class="mini-actions voto-row sug-votos">${botoes}</div>` : ""}
      </article>`;
  }).join("");

  const progresso = votingOpen
    ? `<span class="choice-prog ok">✅ Todos sugeriram — votem!</span>`
    : `<span class="choice-prog">${comQuota}/${membros} já sugeriram 2${comQuota < membros ? ` · faltam ${membros - comQuota}` : " · quase!"}</span>`;

  return `
    <section class="choice-box ${votingOpen ? "voting" : ""}">
      <div class="choice-box-head">
        <h3>${votingOpen ? "🗳️ Votação dos próximos" : "💡 Sugeridos pra votação"}</h3>
        <span class="choice-count">${total} dorama${total === 1 ? "" : "s"}</span>
      </div>
      <p class="choice-sub">${votingOpen ? "Todo mundo sugeriu! O mais votado entra quando o clube terminar o atual." : `Cada um sugere 2 doramas. Quando todos sugerirem, a votação abre sozinha.`} ${progresso}</p>
      ${busca}
      ${total ? `<div class="choice-cards">${cards}</div>` : `<div class="empty" style="margin-top:10px">Ninguém sugeriu ainda. Seja ${gx("o primeiro", "a primeira", "a primeira pessoa")}! 🎬</div>`}
    </section>`;
}

function clubEpisodiosTemplate() {
  if (clubSocial.for !== state.club.id) return "";
  const featured = clubSocial.featured;
  if (!featured?.id) return "";
  const checkins = Array.isArray(featured.checkins) ? featured.checkins : [];
  const membros = Math.max(1, clubMembers.length || checkins.length || 1);
  const meuEp = Number(featured.my_episode || 0);
  const maxCheckin = checkins.reduce((m, c) => Math.max(m, Number(c.current_episode || 0)), 0);
  const totalEps = Math.min(200, Math.max(Number(clubSocial.epCount || 0), maxCheckin, meuEp, 1));
  const ratingsMap = {};
  (clubSocial.epRatings || []).forEach((r) => { ratingsMap[Number(r.episode_number)] = r; });

  // Comentários do dorama atual agrupados por episódio (spoiler_episode = "é sobre o ep N").
  const comentsPorEp = {};
  if (featured.tmdb_id) {
    (clubFeedItems || []).forEach((i) => {
      if (Number(i.tmdb_id) === Number(featured.tmdb_id) && Number(i.spoiler_episode) >= 1) {
        (comentsPorEp[Number(i.spoiler_episode)] ||= []).push(i);
      }
    });
  }

  // Grade compacta de episódios (escala bem pra 25, 50…).
  const sel = epDetailOpen && epDetailOpen >= 1 && epDetailOpen <= totalEps ? epDetailOpen : null;
  const tiles = [];
  for (let n = 1; n <= totalEps; n++) {
    const iSaw = meuEp >= n;
    const rated = Number(ratingsMap[n]?.my_stars || 0) > 0;
    const hasC = (comentsPorEp[n] || []).length > 0;
    tiles.push(`
      <button class="ep-tile ${iSaw ? "seen" : ""} ${sel === n ? "open" : ""}" type="button" data-ep-open="${n}" aria-label="Episódio ${n}${iSaw ? ", visto" : ""}">
        <span class="ep-tile-n">${n}</span>
        <span class="ep-tile-dots">${rated ? `<i class="dot star"></i>` : ""}${hasC ? `<i class="dot chat"></i>` : ""}</span>
      </button>`);
  }

  const vistos = Math.min(meuEp, totalEps);
  const pctVisto = Math.round((vistos / totalEps) * 100);
  const euTerminei = featured.my_status === "finished";
  const detalhe = sel
    ? episodioDetalheTemplate(sel, meuEp >= sel, comentsPorEp[sel] || [], ratingsMap[sel], checkins.filter((c) => Number(c.current_episode || 0) >= sel).length, membros)
    : "";

  return `
    <section class="ep-mode">
      <details open>
        <summary>
          <span class="ep-mode-top">
            <span class="ep-mode-title">🎬 Modo Episódio</span>
            <span class="ep-mode-sub">${vistos}/${totalEps} vistos</span>
          </span>
          <span class="ep-mode-progress"><i style="width:${pctVisto}%"></i></span>
        </summary>
        <p class="ep-mode-hint muted">Toque num episódio pra <strong>marcar como visto</strong> (+1 no ranking 🎬), dar <strong>nota ⭐</strong> e ver os <strong>surtos 💬</strong>. Quadradinho verde = você viu.</p>
        <div class="ep-grid">${tiles.join("")}</div>
        ${detalhe}
        <div class="ep-finish-wrap">
          <button class="checkin-finish ${euTerminei ? "done" : ""}" type="button" data-club-finish="${euTerminei ? "0" : "1"}">
            ${euTerminei ? "✅ Você já terminou o dorama — toque pra desmarcar" : "🏁 Já terminei o dorama inteiro"}
          </button>
          <p class="ep-finish-hint muted">O clube só libera sortear o próximo quando <strong>todo mundo</strong> marcar "terminei o dorama". 🔒</p>
        </div>
      </details>
    </section>`;
}

// Painel de um episódio: marcar visto + nota + surtos daquele episódio.
function episodioDetalheTemplate(n, iSaw, coments, rating, viram, membros) {
  const my = Number(rating?.my_stars || 0);
  const avg = rating?.avg_stars != null ? Number(rating.avg_stars) : 0;
  const votes = Number(rating?.votes || 0);
  const estrelas = [1, 2, 3, 4, 5].map((s) =>
    `<button class="ep-star ${my >= s ? "on" : ""}" type="button" data-ep-star="${n}" data-star="${s}" ${iSaw ? "" : "disabled"} title="${s} estrela${s > 1 ? "s" : ""}" aria-label="${s} estrela${s > 1 ? "s" : ""}">★</button>`).join("");

  const head = `
    <div class="ep-detail-head">
      <strong>Ep. ${n}</strong>
      <span class="ep-detail-seen">👁 ${viram}/${membros}</span>
      <button class="ep-detail-close" type="button" data-ep-open="${n}" title="Fechar">✕</button>
    </div>`;

  const controls = `
    <div class="ep-detail-controls">
      <button class="ep-mark ${iSaw ? "on" : ""}" type="button" data-ep-toggle="${n}" data-seen="${iSaw ? 1 : 0}">${iSaw ? "✓ Você viu — desmarcar" : "Marcar como visto"}</button>
      <div class="ep-detail-rate">
        <span class="ep-stars">${estrelas}</span>
        <span class="ep-avg">${votes ? `★ ${avg.toFixed(1).replace(".0", "")} <em>(${votes})</em>` : "<span class='muted'>sem nota</span>"}</span>
      </div>
    </div>`;

  if (!iSaw) {
    return `
      <section class="ep-detail">
        ${head}
        ${controls}
        <div class="ep-detail-lock">🔒 Marque o <strong>ep. ${n}</strong> como visto pra dar nota e ver os surtos — sem spoiler de quem não chegou lá. 👀</div>
      </section>`;
  }
  const lista = (coments || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const posts = lista.length
    ? `<div class="mural-list ep-detail-list">${lista.map((it) => muralPostCard(it, { canDelete: true, reactions: false })).join("")}</div>`
    : `<p class="ep-detail-empty muted">Ninguém surtou sobre o ep. ${n} ainda. Abre a conversa! 💬</p>`;
  return `
    <section class="ep-detail">
      ${head}
      ${controls}
      <div class="ep-detail-comments">
        <strong class="ep-detail-ctitle">💬 Surtos do ep. ${n}</strong>
        ${posts}
        <form class="ep-detail-form" data-ep-comment="${n}">
          <textarea name="body" rows="2" placeholder="O que achou do ep. ${n}? (só quem já viu, vê) 💭" required></textarea>
          <button class="btn" type="submit">Publicar no ep. ${n}</button>
        </form>
      </div>
    </section>`;
}

function clubeDestaqueTemplate() {
  const meusDramas = state.dramas.filter((d) => d.tmdbId);
  const featured = clubSocial.featured;
  const options = meusDramas.map((d) => `<option value="${d.id}">${esc(d.title)}</option>`).join("");
  const fixarForm = `
    <form id="club-featured-form" class="search-bar club-featured-form">
      <select name="dramaId" required>
        <option value="">Fixar dorama do clube...</option>
        ${options}
      </select>
      <select name="periodType">
        <option value="week">Semana</option>
        <option value="month">Mes</option>
        <option value="free">Livre</option>
      </select>
      <button class="btn" type="submit">Fixar</button>
    </form>`;

  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando dorama do clube...</div>`;
  if (!featured) {
    return `
      <section class="card club-featured-card">
        <div>
          <span class="muted">Ainda sem dorama oficial</span>
          <h3>Escolham um foco para assistir juntas</h3>
          <p class="muted">Use a votacao mensal ou a lista compartilhada para decidir, depois fixe aqui.</p>
        </div>
        ${fixarForm}
      </section>`;
  }

  const checkins = Array.isArray(featured.checkins) ? featured.checkins : [];
  const media = checkins.length ? Math.round(checkins.reduce((sum, row) => sum + Number(row.current_episode || 0), 0) / checkins.length) : 0;
  const rows = checkins.length
    ? checkins
        .map((row) => `<div class="club-checkin-row"><strong>${esc(row.name || row.nickname || "Membro")}</strong><span class="muted">ep. ${Number(row.current_episode || 0)} · ${esc(row.status || "watching")}</span></div>`)
        .join("")
    : `<div class="empty">Ninguem fez check-in ainda.</div>`;

  return `
    <section class="card club-featured-card">
      <div class="club-featured-info">
        ${featured.cover ? `<img src="${esc(featured.cover)}" alt="" />` : ""}
        <div>
          <span class="muted">Dorama oficial do clube</span>
          <h3>${esc(featured.title)}</h3>
          <div class="chips">
            <span class="chip">${featured.period_type === "month" ? "Mes" : featured.period_type === "free" ? "Livre" : "Semana"}</span>
            <span class="chip">Media ep. ${media}</span>
            <span class="chip">${checkins.length} check-ins</span>
          </div>
        </div>
      </div>
      <form id="club-checkin-form" class="search-bar club-checkin-form">
        <input name="episode" type="number" min="0" value="${Number(featured.my_episode || 0)}" aria-label="Episodio atual" />
        <select name="status">
          ${[
            ["watching", "Assistindo"],
            ["paused", "Pausado"],
            ["finished", "Finalizado"],
            ["dropped", "Dropado"],
          ].map(([value, label]) => `<option value="${value}" ${featured.my_status === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <button class="btn" type="submit">Salvar check-in</button>
      </form>
      <div class="club-checkins">${rows}</div>
      ${fixarForm}
    </section>`;
}

function chatBubbleHtml(msg, prev) {
  const mine = authUser && msg.user_id === authUser.id;
  const spoiler = msg.has_spoiler || Number(msg.episode_number || 0) > 0;
  const revelado = mine || revealedChat.has(msg.id);
  const canManage = currentClubMember()?.role === "owner" || currentClubMember()?.role === "moderator" || state.club?.owner_id === authUser?.id;
  const podeApagar = mine || canManage;
  const nome = msg.author || msg.nickname || clubMembers.find((m) => m.user_id === msg.user_id)?.name || "Membro";
  const mesmoAutor = prev && prev.user_id === msg.user_id;
  const corpo = spoiler && !revelado
    ? `<span class="chat-spoiler-blur" data-reveal-chat="${msg.id}"><span class="csb-text">${esc(msg.body)}</span><span class="csb-hint">🔒 toque pra revelar</span></span>`
    : `<span>${esc(msg.body)}</span>`;
  const reply = msg.reply_to
    ? `<button class="chat-reply-ref" type="button" data-jump-chat="${msg.reply_to}">
         <small>${esc(msg.reply_author || "mensagem")}</small>
         <span>${esc(corte(msg.reply_body || "", 90) || "mensagem apagada")}</span>
       </button>`
    : "";
  return `
    <article class="club-chat-message ${mine ? "mine" : ""}" data-msg="${msg.id}">
      ${!mine && !mesmoAutor ? `<span class="chat-author" style="color:${AVATAR_CORES[hashStr(nome) % AVATAR_CORES.length]}">${esc(nome)}</span>` : ""}
      ${reply}
      <p>${corpo}</p>
      ${barraReacoesChat(msg.id)}
      <span class="chat-foot"><span class="chat-time">${timeAgo(msg.created_at)}</span><button class="chat-del" data-reply-chat="${msg.id}" title="Responder">↩</button>${podeApagar ? `<button class="chat-del" data-del-chat="${msg.id}" title="Apagar">${icon("trash")}</button>` : ""}</span>
    </article>`;
}

function chatOnlineBarHtml() {
  const onlineIds = new Set(clubOnline.map((p) => p.user_id));
  const membros = clubMembers.length ? clubMembers : clubOnline.map((p) => ({ user_id: p.user_id, name: p.name }));
  const nOnline = membros.filter((m) => onlineIds.has(m.user_id)).length;
  const av = (m) => {
    const on = onlineIds.has(m.user_id);
    const ini = (String(m.name || "?").trim().charAt(0) || "?").toUpperCase();
    const inner = m.photo ? `<img src="${esc(m.photo)}" alt="" loading="lazy" />` : esc(ini);
    return `<span class="chat-onav ${on ? "on" : "off"}" title="${esc(m.name || "Membro")} ${on ? "(online)" : "(offline)"}" style="background:${AVATAR_CORES[hashStr(m.name || "?") % AVATAR_CORES.length]}">${inner}</span>`;
  };
  return `<div class="chat-online">
    <span class="chat-online-count"><span class="dot ${nOnline ? "on" : ""}"></span>${nOnline} online${membros.length ? ` de ${membros.length}` : ""}</span>
    <div class="chat-onavs">${membros.map(av).join("")}</div>
  </div>`;
}

function clubeChatTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando chat…</div>`;
  const messages = [...(clubSocial.chat || [])].reverse(); // antigas em cima, novas embaixo
  const lista = messages.length
    ? messages.map((m, i) => chatBubbleHtml(m, messages[i - 1])).join("")
    : `<div class="empty">Chat vazio. Manda a primeira mensagem ao vivo! 💬</div>`;
  const hint = clubChatSpoilerOn
    ? `<div class="chat-spoiler-on">🔒 Spoiler ligado — sua mensagem vai <b>borrada</b> até tocarem pra ver</div>`
    : "";
  const replyMsg = chatReplyTo ? (clubSocial.chat || []).find((m) => m.id === chatReplyTo) : null;
  const replyBar = replyMsg
    ? `<div class="chat-replying"><span>Respondendo <strong>${esc(replyMsg.author || "mensagem")}</strong>: ${esc(corte(replyMsg.body, 72))}</span><button type="button" data-cancel-chat-reply>×</button></div>`
    : "";
  const composer = `
    ${replyBar}
    ${hint}
    <form id="club-chat-form" class="chat-composer">
      <button type="button" class="chat-spoiler-toggle ${clubChatSpoilerOn ? "on" : ""}" data-chat-spoiler title="${clubChatSpoilerOn ? "Spoiler ligado (toque pra desligar)" : "Marcar a mensagem como spoiler"}" aria-label="Marcar spoiler">🔒</button>
      <input id="clubChatBody" name="body" placeholder="${clubChatSpoilerOn ? "Mensagem com spoiler…" : "Mensagem ao vivo…"}" autocomplete="off" value="${esc(chatDraft)}" required />
      <input type="hidden" name="hasSpoiler" value="${clubChatSpoilerOn ? "1" : ""}" />
      <input type="hidden" name="replyTo" value="${esc(chatReplyTo || "")}" />
      <button class="btn chat-send" type="submit" aria-label="Enviar">➤</button>
    </form>`;
  return `${chatOnlineBarHtml()}<section class="club-chat-list" id="club-chat-list">${lista}</section>${composer}`;
}

function clubeEnquetesTemplate() {
  const form = `
    <section class="form-card club-poll-form-card">
      <form id="club-poll-form" class="form-grid">
        <div class="field full">
          <label for="clubPollQuestion">Nova enquete</label>
          <input id="clubPollQuestion" name="question" placeholder="Qual dorama vamos assistir depois?" required />
        </div>
        <div class="field full">
          <label for="clubPollOptions">Opções, uma por linha</label>
          <textarea id="clubPollOptions" name="options" placeholder="Dorama A&#10;Dorama B&#10;Dorama C" required></textarea>
        </div>
        <div class="actions field full">
          <button class="btn" type="submit">Criar enquete</button>
        </div>
      </form>
    </section>`;

  if (clubSocial.for !== state.club.id) return form + `<div class="empty">Carregando enquetes...</div>`;
  if (!clubSocial.polls.length) return form + `<div class="empty">Nenhuma enquete livre ainda. Crie a primeira decisão do clube.</div>`;

  const cards = clubSocial.polls
    .map((poll) => {
      const total = Number(poll.total_votes || 0);
      const options = Array.isArray(poll.options) ? poll.options : [];
      const canClose = poll.status === "active" && (currentClubMember()?.role === "owner" || currentClubMember()?.role === "moderator" || state.club.owner_id === authUser?.id);
      const optionRows = options
        .map((option) => {
          const votes = Number(option.votes || 0);
          const pct = total ? Math.round((votes / total) * 100) : 0;
          const mine = poll.my_option === option.id;
          return `
            <button class="club-poll-option ${mine ? "mine" : ""}" data-poll-vote="${poll.id}" data-option-id="${option.id}" ${poll.status !== "active" ? "disabled" : ""}>
              <span><strong>${esc(option.label)}</strong><em>${votes} voto(s)</em></span>
              <b style="width:${pct}%"></b>
            </button>`;
        })
        .join("");
      return `
        <article class="card club-poll-card">
          <div class="comment-head">
            <strong>${esc(poll.question)}</strong>
            <span class="muted">${poll.status === "active" ? "Aberta" : "Encerrada"}</span>
          </div>
          ${poll.author ? `<span class="muted">criada por ${esc(poll.author)} · ${timeAgo(poll.created_at)}</span>` : `<span class="muted">${timeAgo(poll.created_at)}</span>`}
          <div class="club-poll-options">${optionRows}</div>
          <div class="mini-actions">
            <span class="muted">${total} voto(s)</span>
            ${canClose ? `<button data-close-poll="${poll.id}">Encerrar</button>` : ""}
          </div>
        </article>`;
    })
    .join("");

  return form + `<section class="grid">${cards}</section>`;
}

const EVENTO_TIPOS = { watch_party: ["🍿", "Assistir junto"], marathon: ["🔥", "Maratona"], debate: ["💬", "Debate"], other: ["✨", "Encontro"] };
function quandoTexto(iso) {
  const dt = new Date(iso);
  const dias = Math.round((dt.getTime() - Date.now()) / 86400000);
  if (dias < 0) return formatDateTimeShort(iso);
  if (dias === 0) return `hoje · ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (dias === 1) return `amanhã · ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  if (dias <= 6) return `${dt.toLocaleDateString("pt-BR", { weekday: "long" })} · ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  return formatDateTimeShort(iso);
}
function eventoRsvpBtns(event, cancelled) {
  return [["going", "🎉 Vou"], ["maybe", "🤔 Talvez"], ["not_going", "🙅 Não"]]
    .map(([v, l]) => `<button class="${event.my_status === v ? "mine" : ""}" data-event-rsvp="${event.id}" data-rsvp="${v}" ${cancelled ? "disabled" : ""}>${l}</button>`)
    .join("");
}
function clubeEventosTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando a agenda…</div>`;
  const canManage = currentClubMember()?.role === "owner" || currentClubMember()?.role === "moderator" || state.club.owner_id === authUser?.id;
  const featured = clubSocial.featured;
  const agora = Date.now() - 3600000; // tolera 1h após o início
  const eventos = (clubSocial.events || []).filter((e) => e.status !== "cancelled");
  const futuros = eventos.filter((e) => new Date(e.starts_at).getTime() >= agora).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const passados = eventos.filter((e) => new Date(e.starts_at).getTime() < agora).sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
  const proximo = futuros[0];

  const form = `
    <details class="nos-criar" ${proximo ? "" : "open"}>
      <summary>＋ Marcar um encontro</summary>
      <form id="club-event-form" class="form-grid" style="margin-top:12px">
        <div class="field"><label>O que é</label>
          <select name="type">
            <option value="watch_party">🍿 Assistir junto</option>
            <option value="marathon">🔥 Maratona</option>
            <option value="debate">💬 Debate</option>
            <option value="other">✨ Outro</option>
          </select>
        </div>
        <div class="field"><label>Quando</label><input name="startsAt" type="datetime-local" required /></div>
        <div class="field full"><label>Título</label><input name="title" placeholder="Maratona do ep. 1 ao 4 🍿" required /></div>
        ${featured ? `<input type="hidden" name="dramaId" value="featured:${featured.tmdb_id || ""}:${esc(featured.title)}" />` : `<input type="hidden" name="dramaId" value="" />`}
        <div class="field full"><label>Combinado (opcional)</label><input name="description" placeholder="Plataforma, regra de spoiler, onde…" /></div>
        <div class="actions field full"><button class="btn" type="submit">${icon("calendar")} Marcar encontro</button></div>
      </form>
      ${featured ? `<p class="muted" style="margin:8px 0 0;font-size:.8rem">Vai ficar ligado ao dorama do clube: <strong>${esc(featured.title)}</strong>.</p>` : ""}
    </details>`;

  const eventoCard = (event, destaque) => {
    const [emoji, label] = EVENTO_TIPOS[event.type] || EVENTO_TIPOS.other;
    return `
      <article class="club-event2 ${destaque ? "destaque" : ""}">
        <div class="ev-when"><span class="ev-emoji">${emoji}</span><div><strong>${esc(quandoTexto(event.starts_at))}</strong><small>${esc(label)}${event.author ? ` · ${esc(event.author)}` : ""}</small></div></div>
        <div class="ev-title">${esc(event.title)}</div>
        ${event.drama_title ? `<span class="ev-chip">🎬 ${esc(event.drama_title)}</span>` : ""}
        ${event.description ? `<p class="ev-desc">${esc(event.description)}</p>` : ""}
        <div class="ev-rsvp">${eventoRsvpBtns(event, false)}</div>
        <div class="ev-count"><span>🎉 ${Number(event.going || 0)} vão</span><span>🤔 ${Number(event.maybe || 0)}</span>${canManage ? `<button class="ev-cancel" data-cancel-event="${event.id}">Cancelar</button>` : ""}</div>
      </article>`;
  };

  const destaque = proximo
    ? `<div class="section-title compact"><h2>⏰ Próximo encontro</h2></div>${eventoCard(proximo, true)}`
    : `<div class="empty">Nenhum encontro marcado. Que tal combinar de assistir junto? 🍿</div>`;
  const outros = futuros.slice(1);

  return `
    <p class="muted" style="margin:0 0 12px;font-size:.86rem">Combinem <strong>quando</strong> se encontrar pra assistir, maratonar ou debater o dorama do clube — e vejam quem vai. 🍿</p>
    ${form}
    ${destaque}
    ${outros.length ? `<div class="section-title compact"><h2>📅 Mais encontros</h2></div><section class="ev-list">${outros.map((e) => eventoCard(e, false)).join("")}</section>` : ""}
    ${passados.length ? `<details class="ev-passados"><summary>Já rolaram (${passados.length})</summary><section class="ev-list">${passados.slice(0, 6).map((e) => eventoCard(e, false)).join("")}</section></details>` : ""}`;
}

// Como se ganha ponto no clube (chat e mural são só interação, não pontuam).
const CLUB_PONTOS_LEGENDA = [
  ["🎬", "Cada episódio acompanhado (check-in)", "+1"],
  ["🏁", "Terminar o dorama (8 pra quem termina 1º)", 5],
  ["🗳️", "Votar no próximo dorama", 2],
  ["📅", "Criar um encontro", 5],
  ["✅", "Confirmar presença num encontro", 2],
];
// Rotinas do dorama atual: reiniciam quando o clube troca de dorama.
function clubRotinasTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando…</div>`;
  const featured = clubSocial.featured;
  if (!featured) return `<div class="empty">Quando o clube tiver um dorama, as rotinas aparecem aqui. 🎬</div>`;
  const desde = new Date(featured.starts_at || 0).getTime() - 1000;
  const led = (clubSocial.myPoints || []).filter((l) => new Date(l.created_at).getTime() >= desde);
  const cont = (st) => led.filter((l) => l.source_type === st).length;
  const eps = cont("episode");
  const terminou = led.some((l) => l.source_type === "drama_finish" || l.source_type === "finish_first");
  const ptsCiclo = led.reduce((s, l) => s + Number(l.points || 0), 0);
  const rotinas = [
    { emoji: "🎬", nome: "Acompanhar episódios", estado: `${eps} ep${eps === 1 ? "" : "s"} · +${eps}`, ok: eps > 0 },
    { emoji: "🗳️", nome: "Votar no próximo dorama", estado: cont("vote_next") ? `feito · +${cont("vote_next") * 2}` : "+2 cada", ok: cont("vote_next") > 0 },
    { emoji: "📅", nome: "Confirmar presença num encontro", estado: cont("event_rsvp") ? `${cont("event_rsvp")}x · +${cont("event_rsvp") * 2}` : "+2 cada", ok: cont("event_rsvp") > 0 },
    { emoji: "🏁", nome: "Terminar o dorama (1º ganha +8)", estado: terminou ? "feito ✓" : "+5/+8", ok: terminou },
  ];
  return `
    <p class="muted" style="margin:0 0 10px;font-size:.84rem">Você ganha mais pontos <strong>se acompanhar mais</strong> (cada episódio = +1). Reinicia quando o clube troca de dorama (<strong>${esc(featured.title)}</strong>). ✨</p>
    <section class="rotinas">
      ${rotinas.map((r) => `<div class="rotina ${r.ok ? "ok" : ""}"><span class="rot-emoji">${r.ok ? "✅" : r.emoji}</span><div class="rot-txt"><strong>${esc(r.nome)}</strong><small>${esc(r.estado)}</small></div></div>`).join("")}
    </section>
    <p class="rotinas-resumo">Você fez <strong>${ptsCiclo} pts</strong> com este dorama${eps > 0 ? ` (${eps} episódios)` : ""}.</p>`;
}
function clubPontosResumoMeu() {
  const led = clubSocial.myPoints || [];
  if (!led.length) return "";
  const rotulo = { episode: "🎬 Episódios", drama_checkin: "🎬 Check-ins", drama_finish: "🏁 Terminou", finish_first: "🏁 Terminou 1º", vote_next: "🗳️ Votos no próximo", challenge: "🎯 Missões", poll_create: "✍️ Enquetes", poll_vote: "🗳️ Votos", event_create: "📅 Encontros criados", event_rsvp: "✅ Presenças" };
  const por = {};
  let total = 0;
  for (const l of led) {
    const k = l.source_type;
    por[k] = (por[k] || 0) + Number(l.points || 0);
    total += Number(l.points || 0);
  }
  const linhas = Object.entries(por)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<span class="meu-pt"><b>+${v}</b> ${esc(rotulo[k] || k)}</span>`)
    .join("");
  return `<div class="meus-pontos"><strong>Você tem ${total} pts — veio de:</strong><div class="meus-pontos-list">${linhas}</div></div>`;
}
function clubPointsTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando pontos...</div>`;
  const rows = clubSocial.points || [];
  const medalha = ["🥇", "🥈", "🥉"];
  const ranking = rows.length
    ? `<section class="club-rank-list">${rows
        .map((row, index) => {
          const eu = row.user_id === authUser?.id;
          const pos = medalha[index] || `${index + 1}º`;
          return `<div class="club-rank-row ${index < 3 ? "top" : ""} ${eu ? "me" : ""}">
            <span class="rank-pos">${pos}</span>
            <span class="club-av" style="background:${AVATAR_CORES[hashStr(row.name || "?") % AVATAR_CORES.length]}">${esc((String(row.name || "?").trim().charAt(0) || "?").toUpperCase())}</span>
            <strong class="rank-name">${esc(row.name || "Membro")}${eu ? " <small>(você)</small>" : ""}</strong>
            <span class="rank-pts">${Number(row.points || 0)} <small>pts</small></span>
          </div>`;
        })
        .join("")}</section>`
    : `<div class="empty">Ainda sem pontos. Check-ins, enquetes, eventos e missões movimentam o ranking.</div>`;
  const legenda = `
    <details class="pontos-legenda">
      <summary>🏅 Como ganhar pontos</summary>
      <ul>${CLUB_PONTOS_LEGENDA.map(([e, t, p]) => `<li>${e} ${esc(t)} <b>${typeof p === "number" ? `+${p}` : p}</b></li>`).join("")}</ul>
      <p class="muted" style="margin:6px 0 0;font-size:.78rem">O chat <strong>não</strong> dá pontos — é só pra conversar. 💬</p>
    </details>`;
  return `${clubPontosResumoMeu()}${ranking}${legenda}`;
}

function clubeDesafiosTemplate() {
  const form = `
    <section class="form-card club-challenge-form-card">
      <form id="club-challenge-form" class="form-grid">
        <div class="field">
          <label for="clubChallengePoints">Pontos</label>
          <input id="clubChallengePoints" name="points" type="number" min="1" max="100" value="10" />
        </div>
        <div class="field">
          <label for="clubChallengeEnds">Termina em</label>
          <input id="clubChallengeEnds" name="endsAt" type="datetime-local" />
        </div>
        <div class="field full">
          <label for="clubChallengeTitle">Novo desafio</label>
          <input id="clubChallengeTitle" name="title" placeholder="Assistir 3 episódios essa semana" required />
        </div>
        <div class="field full">
          <label for="clubChallengeDescription">Detalhes</label>
          <textarea id="clubChallengeDescription" name="description" placeholder="O que vale, até quando, como contar..."></textarea>
        </div>
        <div class="actions field full">
          <button class="btn" type="submit">Criar desafio</button>
        </div>
      </form>
    </section>`;

  if (clubSocial.for !== state.club.id) return form + `<div class="empty">Carregando desafios...</div>`;
  const challenges = clubSocial.challenges || [];
  const canManage = currentClubMember()?.role === "owner" || currentClubMember()?.role === "moderator" || state.club.owner_id === authUser?.id;
  const cards = challenges.length
    ? challenges
        .map((challenge) => {
          const closed = challenge.status !== "active";
          const done = Boolean(challenge.completed_by_me);
          return `
            <article class="card club-challenge-card ${closed ? "is-closed" : ""}">
              <div class="comment-head">
                <strong>${esc(challenge.title)}</strong>
                <span class="chip">${Number(challenge.points || 0)} pts</span>
              </div>
              ${challenge.description ? `<p>${esc(challenge.description)}</p>` : ""}
              <div class="chips">
                <span class="chip">${Number(challenge.completions || 0)} concluiu</span>
                ${challenge.ends_at ? `<span class="chip">ate ${formatDateTimeShort(challenge.ends_at)}</span>` : ""}
                ${done ? `<span class="chip">Concluído por você</span>` : ""}
                ${closed ? `<span class="chip">Encerrado</span>` : ""}
              </div>
              <form class="club-challenge-complete" data-challenge-complete="${challenge.id}">
                <input name="proof" placeholder="Prova opcional: ep. 4 visto, teoria postada..." value="${esc(challenge.my_proof || "")}" ${closed ? "disabled" : ""} />
                <button class="btn secondary" type="submit" ${closed ? "disabled" : ""}>${done ? "Atualizar" : "Concluir"}</button>
              </form>
              <div class="mini-actions">
                ${canManage && !closed ? `<button data-close-challenge="${challenge.id}">Encerrar</button>` : ""}
              </div>
            </article>`;
        })
        .join("")
    : `<div class="empty">Nenhum desafio ativo ainda. Crie uma missao semanal para o clube.</div>`;

  return `
    <div class="section-title"><h2>Ranking de pontos</h2></div>${clubPointsTemplate()}
    <div class="section-title"><h2>Desafios semanais</h2></div>${form}<section class="grid">${cards}</section>`;
}

function doramaDoMesTemplate() {
  const meusDramas = state.dramas.filter((d) => d.tmdbId);
  const votar = `
    <form id="pick-form" class="search-bar" style="margin-bottom:12px">
      <select name="dramaId" required>
        <option value="">Vote no dorama do mês…</option>
        ${meusDramas.map((d) => `<option value="${d.id}">${esc(d.title)}</option>`).join("")}
      </select>
      <button class="btn" type="submit">Votar</button>
    </form>`;
  if (clubSocial.for !== state.club.id) return votar + `<div class="empty">Carregando votação…</div>`;
  if (!clubSocial.picks.length) return votar + `<div class="empty">Ninguém votou neste mês ainda. Comece a votação! 🗳️</div>`;
  const max = clubSocial.picks[0].votos;
  return (
    votar +
    `<section class="grid cards">${clubSocial.picks
      .map(
        (p, i) =>
          `<div class="card ${i === 0 ? "" : ""}"><span class="muted">${i === 0 ? "👑 Líder" : `${i + 1}º`}</span><strong>${esc(p.title)}</strong><span class="muted">${p.votos} ${p.votos === 1 ? "voto" : "votos"}${p.votos === max && i === 0 ? " · dorama do mês" : ""}</span></div>`,
      )
      .join("")}</section>`
  );
}

function atividadesTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando o feed…</div>`;
  if (!clubSocial.activities.length) return `<div class="empty">Sem novidades do clube ainda. Fixem o dorama, abram uma enquete, marquem um evento ou uma missão. ✨</div>`;
  return `<section class="grid">${clubSocial.activities
    .map((a) => `<div class="card"><strong style="font-weight:600">${esc(a.text)}</strong><span class="muted">${timeAgo(a.created_at)}</span></div>`)
    .join("")}</section>`;
}

function rankingClubeTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando ranking…</div>`;
  const r = clubSocial.ranking;
  if (!r.length) return `<div class="empty">Sem dados ainda.</div>`;

  const lider = (campo) => r.reduce((a, b) => (Number(b[campo]) > Number(a[campo]) ? b : a));
  const destaques = [
    ["🏃‍♀️ Maratonista", lider("episodes"), "episodes", "eps"],
    ["😭 Maior sofredora", lider("choro"), "choro", "de choro"],
    ["✂️ Rainha do drop", lider("drops"), "drops", "drops"],
    ["💞 Fiscal de casal", lider("casais"), "casais", "casais"],
  ].filter(([, m, campo]) => Number(m[campo]) > 0);

  const medalha = ["🥇", "🥈", "🥉"];
  return `
    <section class="grid cards">
      ${destaques.map(([titulo, m, campo, sufixo]) => `<div class="card"><span class="muted">${titulo}</span><strong>${esc(m.name)}</strong><span class="muted">${m[campo]} ${sufixo}</span></div>`).join("")}
    </section>
    <section class="grid cards" style="margin-top:12px">
      ${r.map((row, i) => `<div class="card"><strong>${medalha[i] || `${i + 1}º`} ${esc(row.name)}</strong><div class="chips"><span class="chip">${row.episodes} eps</span><span class="chip">${row.finalizados} fim</span></div></div>`).join("")}
    </section>`;
}

function compatibilidadeTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando…</div>`;
  if (!clubSocial.compat.length) return `<div class="empty">Quando as doramigas adicionarem doramas, a compatibilidade aparece aqui. 💞</div>`;
  return `<section class="grid cards">${clubSocial.compat
    .map(
      (c) => `<div class="card"><strong>${esc(c.name)}</strong><div class="compat-bar"><span style="width:${Math.min(100, Number(c.pct))}%"></span></div><span class="muted">${c.pct}% de match · ${c.comuns} em comum</span></div>`,
    )
    .join("")}</section>`;
}

function muralAvatar(name) {
  const n = name || "?";
  const ini = (String(n).trim().charAt(0) || "?").toUpperCase();
  return `<span class="club-av" style="background:${AVATAR_CORES[hashStr(n) % AVATAR_CORES.length]}">${esc(ini)}</span>`;
}

// Card de post do mural (usado pelo feed e pelo diário compartilhado).
function muralPostCard(item, opts = {}) {
  const liberado = podeVerComentario(item) || (item.id && revealedPosts.has(item.id));
  const podeApagar = opts.canDelete && authUser && (item.user_id === authUser.id || isAdmin());
  const chip = item.drama_title ? `<span class="mural-chip">🎬 ${esc(item.drama_title)}${item.spoiler_episode ? ` · ep. ${item.spoiler_episode}` : ""}</span>` : "";
  const corpo = liberado
    ? `${item.body ? `<p class="mural-body">${esc(item.body)}</p>` : ""}${item.photo ? `<img class="mural-foto" src="${esc(item.photo)}" alt="" loading="lazy" />` : ""}`
    : `<div class="mural-locked">
         <span>🔒 Spoiler até o ep. ${item.spoiler_episode}${item.drama_title ? ` de ${esc(item.drama_title)}` : ""}</span>
         ${item.id ? `<button class="btn ghost" type="button" data-reveal-post="${item.id}">Ver mesmo assim 👀</button>` : ""}
       </div>`;
  return `
    <article class="mural-post">
      <div class="mural-head">
        ${muralAvatar(item.author)}
        <div class="mural-meta"><strong>${esc(item.author || "(sem nome)")}</strong><small>${esc(timeAgo(item.created_at))}</small></div>
        ${podeApagar ? `<button class="mural-del" data-del-comment="${item.id}" title="Apagar">${icon("trash")}</button>` : ""}
      </div>
      ${chip}
      ${corpo}
      ${opts.reactions === false ? "" : opts.reactionKind === "surto" ? barraReacoesSurto(item.id) : barraReacoes(item.id)}
    </article>`;
}

function diarioCompartilhadoTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando…</div>`;
  if (!clubSocial.shared.length) return `<div class="empty">Nenhum surto compartilhado ainda. No diário de um dorama, marque "compartilhar com doramigas". 💜</div>`;
  return `<section class="mural-list">${clubSocial.shared
    .map((s) => muralPostCard({
      id: s.id, author: s.author, body: s.body, spoiler_episode: s.episode,
      tmdb_id: s.tmdb_id, drama_title: s.drama_title, user_id: s.user_id, created_at: s.created_at,
    }, { reactionKind: "surto", canDelete: false }))
    .join("")}</section>`;
}

function commentFormTemplate() {
  const debateText = clubDebateDraft ? `Debate sobre ${clubDebateDraft.title}: ` : "";
  const clubDramas = clubSocial.clubDramas || [];
  const ativo = clubDramas.find((d) => d.status === "active");
  // Opções = doramas DO CLUBE (atual + finalizados), não os pessoais.
  const opcoes = clubDramas
    .filter((d) => d.tmdb_id || d.title)
    .map((d) => `<option value="tmdb:${d.tmdb_id || ""}:${esc(d.title)}" ${!clubDebateDraft && ativo && d === ativo ? "selected" : ""}>${d.status === "active" ? "🎬 " : ""}${esc(d.title)}${d.status === "active" ? " (assistindo)" : " (finalizado)"}</option>`)
    .join("");
  return `
    <section class="mural-composer">
      <div class="mural-composer-top">${muralAvatar(state.profile?.name)}<strong>Conta o surto pras doramigas…</strong></div>
      <form id="comment-form">
        <textarea id="commentBody" name="body" placeholder="Gente, o episódio de hoje… 😭 (ou só uma foto 📷)">${esc(debateText)}</textarea>
        <div class="mural-kind">
          <label class="mural-kind-opt"><input type="radio" name="kind" value="geral" checked> 🗨️ Geral</label>
          <label class="mural-kind-opt"><input type="radio" name="kind" value="teoria"> 🧠 Teoria</label>
          <label class="mural-kind-opt"><input type="radio" name="kind" value="meme"> 😂 Meme</label>
        </div>
        <div class="mural-composer-row">
          <select id="commentDrama" name="dramaId" aria-label="Sobre qual dorama">
            ${clubDebateDraft ? `<option value="__club_draft" selected>${esc(clubDebateDraft.title)} (escolha)</option>` : ""}
            ${opcoes || ""}
            <option value="" ${!ativo && !clubDebateDraft ? "selected" : ""}>🎬 Geral (sem dorama)</option>
          </select>
          <label class="mural-spoiler-field" title="0 = sem spoiler">🔒 ep <input id="commentSpoiler" name="spoiler" type="number" min="0" value="0" /></label>
          <label class="foto-btn">📷<input type="file" accept="image/*" data-comment-foto hidden /></label>
          <button class="btn" type="submit">Publicar</button>
        </div>
        <div class="foto-anexo" id="comment-foto-wrap">${clubCommentFoto ? `<div class="foto-preview"><img src="${clubCommentFoto}" alt="" /><button type="button" class="foto-remove" data-comment-foto-remove>✕</button></div>` : ""}</div>
      </form>
    </section>
  `;
}

// Decide se quem está lendo pode ver o comentário (trava de spoiler).
function podeVerComentario(item) {
  if (!item.spoiler_episode) return true;
  if (authUser && item.user_id === authUser.id) return true;
  // Maior episódio entre: a lista pessoal E o check-in do clube (do dorama atual).
  let meuEp = 0;
  const pessoal = state.dramas.find((d) => d.tmdbId && item.tmdb_id && d.tmdbId === item.tmdb_id);
  if (pessoal) meuEp = Number(pessoal.currentEpisode || 0);
  const f = clubSocial.featured;
  if (f && item.tmdb_id && Number(f.tmdb_id) === Number(item.tmdb_id)) {
    meuEp = Math.max(meuEp, Number(f.my_episode || 0));
  }
  return meuEp >= Number(item.spoiler_episode);
}

function clubFeedTemplate() {
  if (clubFeedFor !== state.club.id) return `<div class="empty">Carregando o mural…</div>`;

  const finalizados = (clubSocial.clubDramas || []).filter((d) => d.status !== "active");
  const agora = Date.now() - 3600000;
  const futuros = (clubSocial.events || [])
    .filter((e) => e.status !== "cancelled" && new Date(e.starts_at).getTime() >= agora)
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  // Cada post cai em EXATAMENTE uma aba (meme > teoria > episódio > geral).
  const bucket = (i) => i.kind === "meme" ? "memes" : i.kind === "teoria" ? "teorias" : (Number(i.spoiler_episode) >= 1 ? "episodios" : "geral");
  const grupos = { geral: [], episodios: [], teorias: [], memes: [] };
  (clubFeedItems || []).forEach((i) => grupos[bucket(i)].push(i));

  const tabs = [
    ["geral", "🗨️ Geral", grupos.geral.length],
    ["episodios", "🎬 Episódios", grupos.episodios.length],
    ["teorias", "🧠 Teorias", grupos.teorias.length],
    ["memes", "😂 Memes", grupos.memes.length],
    ["agenda", "📅 Agenda", futuros.length],
    ["finalizados", "✅ Finalizados", finalizados.length],
  ];
  const aba = clubMuralTab || "geral";
  const tabRow = `<div class="mural-tabs">${tabs.map(([k, l, n]) => `<button class="mural-tab ${aba === k ? "on" : ""}" type="button" data-mural-tab="${k}">${l}${n ? ` <span class="mural-tab-n">${n}</span>` : ""}</button>`).join("")}</div>`;

  let corpo;
  if (aba === "agenda") {
    corpo = futuros.length
      ? `<section class="mural-agenda">${futuros.slice(0, 6).map((e) => {
          const [emoji, label] = EVENTO_TIPOS[e.type] || EVENTO_TIPOS.other;
          return `<article class="agenda-mini"><span class="agenda-emoji">${emoji}</span><div><strong>${esc(e.title)}</strong><small>${esc(quandoTexto(e.starts_at))} · ${esc(label)}</small></div></article>`;
        }).join("")}<button class="btn ghost" type="button" data-club-tab="eventos">Ver agenda completa →</button></section>`
      : `<div class="empty">Nenhum encontro marcado ainda.<br/><button class="btn ghost" type="button" data-club-tab="eventos" style="margin-top:10px">📅 Marcar um encontro</button></div>`;
  } else if (aba === "finalizados") {
    corpo = finalizados.length
      ? `<section class="mural-fin-grid">${finalizados.map((d) => `<article class="mural-fin">${d.cover ? `<img src="${esc(thumb(d.cover) || POSTER_PLACEHOLDER)}" alt="" loading="lazy" />` : `<span class="mural-fin-noimg">🎬</span>`}<strong>${esc(d.title)}</strong>${d.starts_at ? `<small>${esc(new Date(d.starts_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }))}</small>` : ""}</article>`).join("")}</section>`
      : `<div class="empty">Nenhum dorama encerrado ainda. Terminem o primeiro juntas! 🎬</div>`;
  } else {
    const itens = grupos[aba] || [];
    const vazio = {
      geral: `Nada no geral ainda. Solta um oi ou um surto! 💜`,
      episodios: `Nenhum surto por episódio ainda. Marque um episódio como visto no <strong>Modo Episódio</strong> (aba Escolha) e comente por lá 🎬`,
      teorias: `Nenhuma teoria ainda. Solta a sua marcando <strong>🧠 Teoria</strong> ao publicar!`,
      memes: `Nenhum meme ainda. Manda o primeiro marcando <strong>😂 Meme</strong>! 😂`,
    }[aba] || "Nada aqui ainda.";
    corpo = itens.length
      ? `<section class="mural-list">${itens.map((item) => muralPostCard(item, { canDelete: true })).join("")}</section>`
      : `<div class="empty">${vazio}</div>`;
  }
  return tabRow + corpo;
}

const coupleStatusLabel = { wishlist: "Queremos ver", watching: "Assistindo juntos", watched: "Já vimos", favorite: "Favorito do casal" };
// "Sobre nós" agrupado por tema (estilo Day One / Daylio: cards de pergunta).
const aboutGrupos = [
  ["💕 Nossa história", [
    ["como_conhecemos", "Como a gente se conheceu"],
    ["primeiro_date", "Nosso primeiro date"],
    ["pedido_namoro", "Como foi o pedido de namoro"],
    ["o_que_amo", "O que eu mais amo na gente"],
    ["nosso_sonho", "Um sonho nosso"],
  ]],
  ["💞 Nossos favoritos", [
    ["dorama_conforto", "Nosso dorama conforto"],
    ["casal_favorito", "Casal fictício favorito"],
    ["personagem_ele", "Personagem que é a cara dele"],
    ["personagem_ela", "Personagem que é a cara dela"],
    ["cena_marcante", "Cena que marcou a gente"],
    ["nosso_10", "Nosso 10/10"],
  ]],
  ["🍿 Nossos rituais", [
    ["lanche_oficial", "Lanche oficial"],
    ["onde_assistimos", "Onde a gente assiste"],
    ["horario_preferido", "Horário preferido"],
    ["regra_pause", "Regra do play/pause"],
    ["date_perfeito", "Date perfeito"],
  ]],
  ["💬 Coisas nossas", [
    ["frase_interna", "Frase interna"],
    ["piada_interna", "Piada interna"],
    ["nossa_musica", "Nossa música (cole o link)"],
    ["nosso_lugar", "Nosso lugar"],
    ["apelidos", "Nossos apelidos"],
    ["quando_um_ta_triste", "Quando um está triste, o outro…"],
    ["primeiro_dorama", "Primeiro dorama juntos"],
    ["proxima_meta", "Próxima meta juntos"],
  ]],
];
const aboutLabels = aboutGrupos.flatMap(([, itens]) => itens);
let aboutPerguntaIdx = Math.floor(Math.random() * 1000); // qual pergunta destacar

function coupleStats() {
  const eps = coupleDramas.reduce((sum, d) => sum + Number(d.current_episode || 0), 0);
  const watched = coupleDramas.filter((d) => d.status === "watched" || d.status === "favorite").length;
  return [
    ["Episódios juntos", eps],
    ["Doramas juntos", coupleDramas.length],
    ["Já vimos", watched],
    ["Memórias", coupleDiary.length],
  ];
}

// Horas estimadas que o casal assistiu junto: eps × duração (TMDB; fallback 60 min).
function coupleHorasEstimadas() {
  let minutos = 0;
  for (const d of coupleDramas) {
    const eps = Number(d.current_episode || 0);
    if (!eps) continue;
    const rt = runtimeCache[d.tmdb_id] || 60; // 0/undefined → fallback 60
    minutos += eps * rt;
  }
  return Math.round(minutos / 60);
}

// Busca (preguiçosa) a duração dos episódios dos doramas do casal pra estimar horas.
async function loadCoupleRuntimes() {
  if (!state.couple) return;
  const ids = [...new Set(coupleDramas.map((d) => d.tmdb_id).filter(Boolean))];
  const faltam = tmdbReady() ? ids.filter((id) => runtimeCache[id] === undefined) : [];
  if (faltam.length) {
    await Promise.all(
      faltam.map(async (id) => {
        runtimeCache[id] = await getEpisodeRuntime(id);
      }),
    );
  }
  coupleRuntimesFor = state.couple.id; // marca como carregado (mesmo sem TMDB) — evita loop
  render();
}

// Certificados desbloqueáveis do casal (calculados a partir dos dados).
function coupleCertificados() {
  const horas = coupleHorasEstimadas();
  const eps = coupleDramas.reduce((s, d) => s + Number(d.current_episode || 0), 0);
  const finalizados = coupleDramas.filter((d) => d.status === "watched" || d.status === "favorite").length;
  const memorias = coupleDiary.length;
  const cartinhas = coupleLetters.length;
  const sofrimento = coupleDiary.filter((e) => /chor|raiv|surt/i.test(`${e.mood || ""} ${e.who_cried || ""} ${e.who_raged || ""} ${e.comment || ""}`)).length;
  const temAviso = coupleDiary.some((e) => e.inside_joke);
  const lanches = {};
  coupleDiary.forEach((e) => {
    const l = (e.snack || "").trim().toLowerCase();
    if (l) lanches[l] = (lanches[l] || 0) + 1;
  });
  const lancheTop = Object.entries(lanches).sort((a, b) => b[1] - a[1])[0];
  const fechouBingo = coupleDiary.some((e) => /bingo/i.test(e.drama_title || ""));

  return [
    { emoji: "🎬", nome: "Bingo dorameiro", desc: "Fecharam um bingo do episódio", earned: fechouBingo },
    { emoji: "🏃", nome: "Primeira maratona", desc: "10h juntos", earned: horas >= 10 },
    { emoji: "💞", nome: "Casal Dorameiro Oficial", desc: "25h juntos", earned: horas >= 25 },
    { emoji: "🥲", nome: "Sobreviventes do Sofrimento", desc: "50h juntos", earned: horas >= 50 },
    { emoji: "👑", nome: "Lenda dos Doramas", desc: "100h juntos", earned: horas >= 100 },
    { emoji: "📖", nome: "Primeira memória", desc: "Guardaram a 1ª memória", earned: memorias >= 1 },
    { emoji: "💌", nome: "Primeira cartinha", desc: "Escreveram a 1ª cartinha", earned: cartinhas >= 1 },
    { emoji: "🏁", nome: "Primeiro finalizado", desc: "Terminaram 1 dorama juntos", earned: finalizados >= 1 },
    { emoji: "🔟", nome: "10 episódios juntos", desc: "Passaram de 10 episódios", earned: eps >= 10 },
    { emoji: "😭", nome: "Certificado de Sofrimento", desc: "3+ memórias de choro/raiva/surto", earned: sofrimento >= 3 },
    { emoji: "🙄", nome: "Eu te avisei", desc: "Registraram uma frase interna", earned: temAviso },
    { emoji: "🍿", nome: "Lanche oficial", desc: lancheTop ? `“${lancheTop[0]}” aprovado pelo casal` : "Mesmo lanche 3×", earned: Boolean(lancheTop && lancheTop[1] >= 3) },
  ];
}

function coupleCertificadosSection() {
  const carregando = coupleRuntimesFor !== state.couple.id;
  const horas = coupleHorasEstimadas();
  const certs = coupleCertificados();
  const desbloqueados = certs.filter((c) => c.earned).length;
  return `
    <div class="section-title"><h2>🎓 Certificados de vocês</h2></div>
    <section class="grid stats">
      <div class="stat"><span class="muted">Horas juntos (estimadas)</span><strong>${carregando ? "…" : `~${horas}h`}</strong></div>
      <div class="stat"><span class="muted">Desbloqueados</span><strong>${desbloqueados}/${certs.length}</strong></div>
    </section>
    <p class="muted" style="margin:2px 0 14px;font-size:.82rem">Horas estimadas pela duração dos episódios (TMDB); quando não tem essa info, contamos 60 min por episódio.</p>
    <section class="badge-grid">
      ${certs.map((c, i) => `
        <div class="badge ${c.earned ? "" : "locked"}">
          <span class="badge-emoji">${c.emoji}</span>
          <strong>${esc(c.nome)}</strong>
          <small>${esc(c.desc)}</small>
          ${c.earned ? `<button class="btn ghost cert-share" data-cert-share="${i}">${icon("share")} Compartilhar</button>` : ""}
        </div>`).join("")}
    </section>`;
}

// ---------- Pet do casal ----------
const PET_CARINHAS = ["🐱", "🐈", "🐈‍⬛", "🐶", "🐕", "🐰", "🐻", "🐼", "🦊", "🐹"];

// Felicidade derivada das ações do casal (sem decair/morrer — só carinho).
function petFelicidade() {
  const eps = coupleDramas.reduce((s, d) => s + Number(d.current_episode || 0), 0);
  const pontos = eps * 2 + coupleDiary.length * 8 + coupleLetters.length * 6 + (Object.keys(coupleAbout).length * 3);
  return Math.max(10, Math.min(100, pontos));
}

function petStatus(fel) {
  if (fel >= 85) return "Radiante de feliz 🥰";
  if (fel >= 55) return "Feliz e fofo 😊";
  if (fel >= 30) return "De boas, esperando vocês 🐾";
  return "Com saudade — registrem uma memória 🥺";
}

// Decorações do cantinho desbloqueadas por marcos. tipo: "movel" (no quarto)
// ou "usado" (no próprio bichinho).
function petDecoracoes() {
  const eps = coupleDramas.reduce((s, d) => s + Number(d.current_episode || 0), 0);
  const finalizados = coupleDramas.filter((d) => d.status === "watched" || d.status === "favorite").length;
  return [
    { emoji: "🍿", nome: "Pipoca", earned: eps >= 1, tipo: "movel", pos: "pipoca" },
    { emoji: "💡", nome: "Abajur", earned: coupleDiary.length >= 1, tipo: "movel", pos: "abajur" },
    { emoji: "🛋️", nome: "Sofá", earned: eps >= 5, tipo: "movel", pos: "sofa" },
    { emoji: "🪴", nome: "Plantinha", earned: coupleDiary.length >= 3, tipo: "movel", pos: "planta" },
    { emoji: "🖼️", nome: "Quadro de vocês", earned: coupleLetters.length >= 1, tipo: "movel", pos: "quadro" },
    { emoji: "📺", nome: "TV", earned: finalizados >= 1, tipo: "movel", pos: "tv" },
    { emoji: "🎀", nome: "Laço", earned: eps >= 10, tipo: "usado" },
    { emoji: "👑", nome: "Coroa", earned: eps >= 50, tipo: "usado" },
  ];
}

function petPickHtml(selecionado) {
  return PET_CARINHAS.map((e, i) => {
    const marcado = selecionado ? couplePet?.species === e : i === 0;
    return `<label class="pet-pick-opt"><input type="radio" name="species" value="${e}" ${marcado ? "checked" : ""}/><span>${e}</span></label>`;
  }).join("");
}

function couplePetSection() {
  if (!couplePet) {
    return `
      <div class="section-title"><h2>🏠 Nosso cantinho</h2></div>
      <section class="pet-create">
        <p class="muted">Adotem um bichinho pro cantinho de vocês — um gatinho, um cachorro, o que quiserem. Ele fica mais feliz e o quartinho vai ganhando móveis conforme vocês assistem, guardam memórias e trocam cartinhas. 🐱</p>
        <form id="pet-create-form" class="form-card form-grid">
          <div class="field full">
            <label>Nome do bichinho</label>
            <input name="name" placeholder="Pipoca, Mochi, Bolinha…" required />
          </div>
          <div class="field full">
            <label>Escolham a carinha</label>
            <div class="pet-pick">${petPickHtml(false)}</div>
          </div>
          <div class="actions field full"><button class="btn" type="submit">Adotar 🐾</button></div>
        </form>
      </section>`;
  }
  const fel = petFelicidade();
  const decos = petDecoracoes();
  const moveis = decos.filter((d) => d.tipo === "movel" && d.earned);
  const usados = decos.filter((d) => d.tipo === "usado" && d.earned).map((d) => d.emoji).join("");
  return `
    <div class="section-title"><h2>🏠 Cantinho de ${esc(couplePet.name || "vocês")}</h2></div>
    <section class="pet-room">
      ${moveis.map((d) => `<span class="pet-deco deco-${d.pos}" title="${esc(d.nome)}">${d.emoji}</span>`).join("")}
      <div class="pet-avatar">${usados ? `<span class="pet-worn">${usados}</span>` : ""}${couplePet.species || "🐱"}</div>
      ${petReacao ? `<div class="pet-bubble">${esc(petReacao)}</div>` : ""}
    </section>
    <div class="pet-mood">
      <strong>${esc(petStatus(fel))}</strong>
      <div class="pet-bar"><span style="width:${fel}%"></span></div>
      <small class="muted">Felicidade ${fel}%</small>
    </div>
    <div class="pet-actions">
      <button class="btn ghost" data-pet-care="carinho">❤️ Carinho</button>
      <button class="btn ghost" data-pet-care="petisco">🍗 Petisco</button>
      <button class="btn ghost" data-pet-care="banho">🛁 Banho</button>
      <button class="btn ghost" data-pet-care="passear">🐾 Brincar</button>
      <button class="btn ghost" data-pet-care="surpresa">💌 Surpresa</button>
    </div>
    <div class="section-title compact"><h2>Decorações do cantinho</h2></div>
    <p class="muted" style="margin:-6px 0 10px;font-size:.82rem">Vão aparecendo no quarto conforme vocês usam o app.</p>
    <section class="badge-grid">
      ${decos.map((d) => `<div class="badge ${d.earned ? "" : "locked"}"><span class="badge-emoji">${d.emoji}</span><strong>${esc(d.nome)}</strong></div>`).join("")}
    </section>
    <section class="form-card">
      <p class="muted" style="margin:0 0 10px">Mudar o nome ou a carinha?</p>
      <form id="pet-create-form" class="form-grid">
        <div class="field"><label>Nome</label><input name="name" value="${esc(couplePet.name || "")}" required /></div>
        <div class="field full"><label>Carinha</label><div class="pet-pick">${petPickHtml(true)}</div></div>
        <div class="actions field full"><button class="btn secondary" type="submit">Salvar</button></div>
      </form>
    </section>`;
}

function formatDateShort(value) {
  if (!value) return "";
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(value);
  }
}

function coupleTimelineTemplate() {
  const eventos = [];
  if (state.couple?.specialDate) eventos.push([state.couple.specialDate, "💕", "Data especial de vocês", ""]);
  const primeiroDorama = coupleDramas.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
  if (primeiroDorama) eventos.push([primeiroDorama.created_at?.slice(0, 10), "🎬", "Primeiro dorama no cantinho", primeiroDorama.title]);
  const finalizado = coupleDramas.find((d) => d.status === "watched" || d.status === "favorite");
  if (finalizado) eventos.push([finalizado.created_at?.slice(0, 10), "🏁", "Primeiro finalizado juntos", finalizado.title]);
  const primeiraMemoria = coupleDiary.slice().sort((a, b) => new Date(a.watched_on || a.created_at) - new Date(b.watched_on || b.created_at))[0];
  if (primeiraMemoria) eventos.push([(primeiraMemoria.watched_on || primeiraMemoria.created_at || "").slice(0, 10), "📖", "Primeira memória", primeiraMemoria.drama_title || "nosso diário"]);
  const comPiada = coupleDiary.find((d) => d.inside_joke);
  if (comPiada) eventos.push([(comPiada.watched_on || comPiada.created_at || "").slice(0, 10), "💬", "Frase que virou nossa", comPiada.inside_joke]);
  const cartinha = coupleLetters[0];
  if (cartinha) eventos.push([(cartinha.created_at || "").slice(0, 10), "💌", "Primeira cartinha guardada", ""]);
  const bingo = coupleDiary.find((d) => /bingo/i.test(d.drama_title || ""));
  if (bingo) eventos.push([(bingo.watched_on || bingo.created_at || "").slice(0, 10), "🎬", "Fecharam o bingo do episódio", ""]);

  const limpos = eventos
    .filter(([data]) => data)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .slice(0, 6);
  if (!limpos.length) return `<div class="empty">A linha do tempo nasce conforme vocês adicionam doramas, memórias e cartinhas. ✨</div>`;
  return `
    <section class="couple-timeline-v">
      ${limpos.map(([data, emoji, titulo, sub]) => `
        <div class="ctl-item">
          <span class="ctl-dot">${emoji}</span>
          <div class="ctl-body">
            <span class="ctl-date">${esc(formatDateShort(data))}</span>
            <strong class="ctl-title">${esc(titulo)}</strong>
            ${sub ? `<span class="ctl-sub">${esc(sub)}</span>` : ""}
          </div>
        </div>`).join("")}
    </section>`;
}

// Saudação compacta do painel (no lugar do hero gigante).
// Nível do casal, derivado da atividade (a cada 100 pts sobe um nível).
function casalNivel() {
  const eps = coupleDramas.reduce((s, d) => s + Number(d.current_episode || 0), 0);
  const pts = eps * 2 + coupleDiary.length * 10 + coupleLetters.length * 6;
  const nivel = Math.floor(pts / 100) + 1;
  return { nivel, pts, falta: nivel * 100 - pts, pct: Math.round(((pts % 100) / 100) * 100) };
}

function coupleGreetingTemplate() {
  const nome = (state.couple?.title || "").trim();
  const names = coupleMembers.map((m) => m.name || m.nickname).filter(Boolean).join(" & ");
  const sozinho = coupleMembers.length < 2;
  const lv = casalNivel();
  return `
    <div class="couple-greeting">
      <div class="couple-greeting-text">
        <strong>${nome ? `Oi, ${esc(nome)}! 💕` : "Oi, casal! 💕"}</strong>
        ${nome
          ? (names ? `<span>${esc(names)}</span>` : "")
          : `<span>Vocês ainda não têm nome. Bora batizar o casal?</span>`}
      </div>
      <span class="couple-level" title="Faltam ${lv.falta} pts pro nível ${lv.nivel + 1}">🏆 Nível ${lv.nivel}</span>
      ${nome ? "" : `<button class="btn ghost couple-greeting-btn" type="button" data-couple-name>Definir nome</button>`}
      ${sozinho ? `<span class="couple-greeting-wait">💌 Falta sua pessoa entrar — código em <strong>Ajustes</strong></span>` : ""}
    </div>`;
}

async function handleCoupleSetName() {
  if (!state.couple) return;
  const nome = await perguntar("Nome do casal", state.couple.title || "", { ok: "Salvar", placeholder: "Ex.: Você & seu amor" });
  if (nome == null) return;
  const novo = String(nome).trim();
  try {
    await updateCoupleCapa(state.couple.id, { title: novo, tagline: state.couple.tagline, specialDate: state.couple.specialDate });
    state.couple.title = novo;
    saveState();
    render();
    toast("Nome do casal salvo! 💕");
  } catch {
    toast("Não consegui salvar o nome.");
  }
}

// Hero do painel: o dorama que vocês estão vivendo agora (com a imagem dele).
function coupleFocusCard() {
  const ativo = coupleDramas.find((d) => d.status === "watching");
  const finalizado = coupleDramas.find((d) => d.status === "watched" || d.status === "favorite");
  if (ativo) {
    const ep = Number(ativo.current_episode || 0);
    const total = Number(ativo.episodes || 0);
    const pct = total ? Math.min(100, Math.round((ep / total) * 100)) : 0;
    return `
      <section class="focus-card" ${ativo.cover ? `style="--focus-cover:url('${esc(ativo.cover)}')"` : ""}>
        <div class="focus-bg"></div>
        <img class="focus-poster" src="${esc(ativo.cover || POSTER_PLACEHOLDER)}" alt="Capa de ${esc(ativo.title)}" />
        <div class="focus-copy">
          <span>Agora no sofá de vocês</span>
          <h3>${esc(ativo.title)}</h3>
          <button class="ep-set" data-couple-ep="${ativo.id}">${total ? `Episódio ${ep} de ${total}` : `Episódio ${ep}`} ✏️</button>
          <div class="focus-progress"><span style="width:${pct}%"></span></div>
          <div class="actions">
            <button class="btn" data-couple-plus="${ativo.id}">${icon("add")} +1 ep</button>
            <button class="btn secondary" data-couple-memory="${ativo.id}">${icon("lists")} Registrar memória</button>
            <button class="btn ghost" data-couple-finish="${ativo.id}">🎉 Finalizamos</button>
          </div>
        </div>
      </section>`;
  }
  if (finalizado) {
    return `
      <section class="focus-card" ${finalizado.cover ? `style="--focus-cover:url('${esc(finalizado.cover)}')"` : ""}>
        <div class="focus-bg"></div>
        <img class="focus-poster" src="${esc(finalizado.cover || POSTER_PLACEHOLDER)}" alt="Capa de ${esc(finalizado.title)}" />
        <div class="focus-copy">
          <span>Último que vocês terminaram</span>
          <h3>${esc(finalizado.title)}</h3>
          <p>Qual vai ser o próximo surto de vocês?</p>
          <div class="actions">
            <button class="btn" data-couple-section="assistindo">${icon("add")} Escolher o próximo</button>
            <button class="btn ghost" data-couple-cert="${finalizado.id}">🎓 Certificado</button>
            <button class="btn ghost" data-date-roulette>${icon("dice")} Sortear date</button>
          </div>
        </div>
      </section>`;
  }
  return `
    <section class="focus-card">
      <div class="focus-bg"></div>
      <div class="focus-copy empty-focus">
        <span>Comece o cantinho de vocês</span>
        <h3>Escolham o primeiro dorama juntos</h3>
        <p>Adicione um dorama da sua lista ao casal e o painel ganha vida.</p>
        <div class="actions">
          <button class="btn" data-couple-section="assistindo">${icon("add")} Escolher da nossa lista</button>
          <button class="btn secondary" data-date-roulette>${icon("dice")} Sortear date</button>
        </div>
      </div>
    </section>`;
}

function coupleDramaOptions() {
  const fromPersonal = state.dramas.filter((d) => d.title);
  return fromPersonal.map((d) => `<option value="${d.id}">${esc(d.title)}</option>`).join("");
}

const coupleMoveOpcoes = [["watching", "Assistindo"], ["wishlist", "Queremos ver"], ["watched", "Já vimos"], ["favorite", "Favorito"]];

// Card de dorama do casal, com ações conforme o grupo + mover/tirar em todos.
function coupleDramaCard(d, grupo) {
  const ep = Number(d.current_episode || 0);
  const total = Number(d.episodes || 0);
  const pct = total ? Math.min(100, Math.round((ep / total) * 100)) : 0;
  let acoes = "";
  if (grupo === "watching") {
    acoes = `
      <button data-couple-plus="${d.id}">${icon("add")} +1 ep</button>
      <button data-couple-ep="${d.id}">Episódio</button>
      <button data-couple-memory="${d.id}">${icon("lists")} Memória</button>
      <button data-couple-finish="${d.id}">🎉 Finalizamos</button>`;
  } else if (grupo === "wishlist") {
    acoes = `<button data-couple-move="${d.id}">▶️ Começar a ver</button>`;
  } else {
    acoes = `<button data-couple-cert="${d.id}">🎓 Certificado</button>`;
  }
  const mover = `<select class="move-select" data-couple-move-to="${d.id}" title="Mover para outra categoria">
    ${coupleMoveOpcoes.map(([k, l]) => `<option value="${k}" ${d.status === k ? "selected" : ""}>${l}</option>`).join("")}
  </select>`;
  return `
    <article class="couple-drama-card">
      <img src="${esc(d.cover || POSTER_PLACEHOLDER)}" alt="" />
      <div>
        <strong>${esc(d.title)}</strong>
        <small>${grupo === "wishlist" ? "Na fila de vocês" : `Ep. ${ep}${total ? `/${total}` : ""}`}</small>
        ${grupo !== "wishlist" ? `<div class="focus-progress"><span style="width:${pct}%"></span></div>` : ""}
        <div class="mini-actions">
          ${acoes}
          ${mover}
          <button data-del-couple-drama="${d.id}">${icon("trash")} Tirar</button>
        </div>
      </div>
    </article>`;
}

function coupleDramasTemplate() {
  const ativos = coupleDramas.filter((d) => d.status === "watching");
  const fila = coupleDramas.filter((d) => d.status === "wishlist");
  const fim = coupleDramas.filter((d) => d.status === "watched" || d.status === "favorite");
  const grade = (lista, grupo) => `<section class="couple-drama-grid">${lista.map((d) => coupleDramaCard(d, grupo)).join("")}</section>`;
  const temLista = state.dramas.some((d) => d.title);
  return `
    <div class="section-title"><h2>Assistindo</h2></div>
    <section class="form-card couple-add">
      <div class="field">
        <label>Pra qual categoria?</label>
        <select id="couple-add-cat">
          ${[["watching", "Assistindo juntos"], ["wishlist", "Queremos ver"], ["watched", "Já vimos"], ["favorite", "Favorito do casal"]]
            .map(([k, l]) => `<option value="${k}" ${coupleAddCatSel === k ? "selected" : ""}>${l}</option>`).join("")}
        </select>
      </div>
      ${temLista ? `
      <form id="couple-add-drama-form" class="search-bar">
        <select name="dramaId" required>
          <option value="">Pegar da minha lista…</option>
          ${coupleDramaOptions()}
        </select>
        <button class="btn" type="submit">${icon("add")} Adicionar</button>
      </form>
      <div class="couple-add-or">ou busque um novo</div>` : ""}
      <form id="couple-search-form" class="search-bar">
        <input name="q" placeholder="Buscar dorama ou filme…" value="${esc(coupleAddSearch.query)}" autocomplete="off" />
        <button class="btn ${temLista ? "secondary" : ""}" type="submit">Buscar</button>
      </form>
      ${coupleAddSearch.loading ? `<p class="muted" style="margin:10px 0 0">Buscando…</p>` : ""}
      ${coupleAddSearch.results.length ? `<div class="search-results">${coupleAddSearch.results.slice(0, 8).map((d) => `<button type="button" class="search-result" data-couple-add-tmdb="${d.tmdbId}" data-media="${d.mediaType}"><img src="${esc(thumb(d.cover) || POSTER_PLACEHOLDER)}" alt="" loading="lazy" /><span class="search-result-info"><strong>${esc(d.title)}</strong><small>${esc(midiaEtiqueta(d))}${d.year ? ` · ${d.year}` : ""}</small></span></button>`).join("")}</div>` : ""}
      <p class="muted" style="margin:10px 0 0;font-size:.82rem">💡 Tudo que vocês adicionarem ao casal também entra na sua lista pessoal.</p>
    </section>

    <div class="section-title compact"><h2>▶️ Assistindo juntos</h2></div>
    ${ativos.length ? grade(ativos, "watching") : `<div class="empty">Nada em andamento. Movam um da fila ou adicionem um dorama. 🍿</div>`}

    <div class="section-title compact"><h2>📝 Queremos ver</h2>${fila.length ? `<button class="btn ghost" type="button" data-couple-sortear-fila>${icon("dice")} Sortear próximo</button>` : ""}</div>
    ${fila.length ? grade(fila, "wishlist") : `<div class="empty">A fila de vocês está vazia. Adicionem o que querem ver juntos. ✨</div>`}

    <div class="section-title compact"><h2>🏆 Finalizados</h2></div>
    ${fim.length ? grade(fim, "fim") : `<div class="empty">Quando terminarem um dorama, ele vira troféu aqui. 🎉</div>`}`;
}

const DIARY_KINDS = [
  ["livre", "📝", "Diário"],
  ["episodio", "📺", "Episódio"],
  ["date", "🍿", "Date"],
  ["cartinha", "💌", "Cartinha"],
  ["surto", "😭", "Surto"],
  ["momento", "✨", "Momento"],
  ["marco", "🏆", "Marco"],
];
const diaryKindMeta = (k) => DIARY_KINDS.find((x) => x[0] === k) || DIARY_KINDS[0];

// Campos do formulário conforme o tipo de página.
function coupleDiaryFields(kind) {
  const options = coupleDramas.map((d) => `<option value="${d.id}" ${coupleMemoryDraft === d.id ? "selected" : ""}>${esc(d.title)}</option>`).join("");
  const dorama = `<div class="field"><label>Dorama</label><select name="dramaId">${options}<option value="">Outro / geral</option></select></div>`;
  const tituloLivre = (lbl, ph) => `<div class="field full"><label>${lbl}</label><input name="titleLivre" placeholder="${ph}" /></div>`;
  // A data é a página do caderno (definida no form), então os tipos não repetem o campo de data.
  const data = "";
  const texto = (lbl, ph) => `<div class="field full"><label>${lbl}</label><textarea name="comment" placeholder="${ph}"></textarea></div>`;

  if (kind === "livre") {
    return `
      <div class="field full"><label>O que rolou nesse dia?</label><textarea name="comment" rows="5" placeholder="Como foi o dia de vocês… assistimos um dorama, foi muito legal / hoje a gente brigou, mas no fim..."></textarea></div>`;
  }
  if (kind === "date") {
    return `
      ${tituloLivre("Nome do date", "Cinema em casa, jantar dorameiro…")}
      ${data}
      <div class="field"><label>Onde?</label><input name="place" placeholder="sofá, cinema, parque…" /></div>
      <div class="field"><label>Lanche</label><input name="snack" placeholder="pipoca doce" /></div>
      <div class="field full"><label>Melhor momento</label><input name="favMoment" placeholder="o que ficou marcado" /></div>
      <div class="field full"><label>Faríamos de novo?</label><input name="insideJoke" placeholder="com certeza / nunca mais kkk" /></div>
      ${texto("Como foi?", "Conta esse date como uma página de álbum.")}`;
  }
  if (kind === "cartinha") {
    return `
      ${tituloLivre("Para quem / título (opcional)", "Pra você, amor…")}
      ${texto("Sua cartinha", "Escreve o recadinho que vocês vão querer reler.")}`;
  }
  if (kind === "surto") {
    return `
      ${dorama}
      <div class="field"><label>Episódio</label><input name="episode" type="number" min="0" placeholder="8" /></div>
      <div class="field full"><label>O que causou o surto?</label><input name="favMoment" placeholder="a cena que destruiu vocês" /></div>
      ${texto("Surtem aqui 😭", "Pode soltar tudo.")}`;
  }
  if (kind === "momento") {
    return `
      ${tituloLivre("Título (opcional)", "Aquele dia que…")}
      ${data}
      <div class="field full"><label>O momento</label><input name="favMoment" placeholder="o que aconteceu de especial" /></div>
      ${texto("Detalhes", "Guarda esse momento de vocês.")}`;
  }
  if (kind === "marco") {
    return `
      ${tituloLivre("Qual o marco?", "1 mês juntos, 1º dorama finalizado…")}
      ${data}
      ${texto("Por que importa", "O que esse marco significa pra vocês.")}`;
  }
  // episódio (completo)
  return `
    ${dorama}
    <div class="field"><label>Episódio</label><input name="episode" type="number" min="0" placeholder="8" /></div>
    ${data}
    <div class="field"><label>Lanche</label><input name="snack" placeholder="pipoca doce" /></div>
    <div class="field"><label>Humor</label><input name="mood" placeholder="choramos, surtamos…" /></div>
    <div class="field"><label>Onde?</label><input name="place" placeholder="sofá, chamada, cinema…" /></div>
    <div class="field"><label>Quem escolheu?</label><input name="chosenBy" placeholder="eu, ela, os dois…" /></div>
    <div class="field"><label>Quem chorou mais?</label><input name="whoCried" placeholder="ninguém, ela, eu…" /></div>
    <div class="field"><label>Quem passou raiva?</label><input name="whoRaged" placeholder="todo mundo" /></div>
    <div class="field"><label>Nota dele</label><input name="noteHim" placeholder="10/10" /></div>
    <div class="field"><label>Nota dela</label><input name="noteHer" placeholder="mil estrelas" /></div>
    <div class="field full"><label>Momento favorito</label><input name="favMoment" placeholder="a cena da chuva" /></div>
    <div class="field full"><label>Frase interna</label><input name="insideJoke" placeholder="eu avisei" /></div>
    ${texto("O que esse dia teve de especial?", "Escreve como se fosse uma página de álbum.")}`;
}

function dataDiarioLonga(d) {
  if (!d) return "";
  const [y, m, dd] = String(d).slice(0, 10).split("-");
  if (!y || !m || !dd) return "";
  return new Date(Number(y), Number(m) - 1, Number(dd)).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function coupleDiaryEntryCard(e) {
  const [, emoji, label] = diaryKindMeta(e.kind);
  const livre = e.kind === "livre";
  const autor = coupleMembers.find((m) => m.user_id === e.author_id);
  const mine = e.author_id && e.author_id === authUser?.id;
  const nomeAutor = autor?.nickname || autor?.name || (mine ? "Você" : "");
  const avatar = autor ? clubAvatarMini(autor) : (nomeAutor ? muralAvatar(nomeAutor) : "");
  const linha1 = [e.place, e.snack, e.mood].filter(Boolean).map(esc).join(" · ");
  const placar = [e.chosen_by ? `Escolha: ${e.chosen_by}` : "", e.who_cried ? `Choro: ${e.who_cried}` : "", e.who_raged ? `Raiva: ${e.who_raged}` : ""].filter(Boolean).map(esc).join(" · ");
  const notas = [e.note_him ? `dele ${e.note_him}` : "", e.note_her ? `dela ${e.note_her}` : ""].filter(Boolean).map(esc).join(" · ");
  const hora = e.created_at ? new Date(e.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

  // Título da entrada: livre não tem título (a página já é o dia); os outros mostram o tipo/dorama.
  const headline = livre ? "" : `${esc(e.drama_title || label)}${e.episode ? ` · ep. ${e.episode}` : ""}`;

  return `
    <article class="diary-entry kind-${esc(e.kind || "livre")}">
      <div class="diary-entry-top">
        ${avatar}
        <span class="diary-entry-who"><strong>${esc(nomeAutor || "Alguém")}${mine ? " (você)" : ""}</strong>${hora ? ` · ${esc(hora)}` : ""}</span>
        <span class="diary-entry-kind">${emoji}${livre ? "" : ` ${esc(label)}`}</span>
      </div>
      ${headline ? `<strong class="diary-entry-title">${headline}</strong>` : ""}
      ${linha1 ? `<small class="diary-entry-sub">${linha1}</small>` : ""}
      ${e.photo ? `<img class="diary-entry-foto" src="${esc(e.photo)}" alt="" loading="lazy" />` : ""}
      <div class="diary-entry-body">
        ${e.fav_moment ? `<p class="album-quote">“${esc(e.fav_moment)}”</p>` : ""}
        ${e.comment ? `<p>${esc(e.comment)}</p>` : ""}
        ${e.inside_joke ? `<p><b>${e.kind === "date" ? "Faríamos de novo?" : "Frase que virou nossa:"}</b> ${esc(e.inside_joke)}</p>` : ""}
        ${placar ? `<p><b>Placar emocional:</b> ${placar}</p>` : ""}
        ${notas ? `<p><b>Notas:</b> ${notas}</p>` : ""}
      </div>
      ${mine ? `<button class="diary-entry-del" data-del-couple-diary="${e.id}" title="Apagar">${icon("trash")}</button>` : ""}
    </article>`;
}

function diaKey(e) {
  return e.watched_on ? String(e.watched_on).slice(0, 10) : String(e.created_at || "").slice(0, 10);
}

function diarioDias() {
  const set = new Set([new Date().toISOString().slice(0, 10), coupleDiaryDay]);
  (coupleDiary || []).forEach((e) => set.add(diaKey(e)));
  return Array.from(set).filter(Boolean).sort().reverse();
}

// A outra pessoa do casal.
function parceiraMembro() {
  return (coupleMembers || []).find((m) => m.user_id !== authUser?.id) || null;
}
// Texto no gênero da parceira/o (masc/fem/neutro). Fallback neutro quando não escolheu.
function gxP(masc, fem, neutro) {
  const g = parceiraMembro()?.gender;
  return g === "masc" ? masc : g === "fem" ? fem : (neutro != null ? neutro : fem);
}
// Exemplo de placeholder usando o nome da parceira do casal (ou neutro).
function diarioExemplo() {
  const nome = (parceiraMembro()?.nickname || parceiraMembro()?.name || "").trim();
  return nome ? `eu e ${nome} assistimos um dorama, foi muito legal` : "hoje a gente assistiu um dorama, foi muito legal";
}

// Soma dias a uma data YYYY-MM-DD (respeitando fuso local).
function addDias(iso, n) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// Folheia o caderno de dia em dia (delta -1 = dia anterior, +1 = próximo, sem passar de hoje).
// Re-renderiza mantendo a posição de scroll (evita a página pular ao trocar de dia).
function renderMantendoScroll() {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  render();
  requestAnimationFrame(() => window.scrollTo(0, y));
}

function diarioNavega(delta) {
  const hoje = new Date().toISOString().slice(0, 10);
  const atual = coupleDiaryDay || hoje;
  let novo = addDias(atual, delta);
  if (novo > hoje) novo = hoje;
  coupleDiaryDay = novo;
  coupleDiaryFoto = null;
  renderMantendoScroll();
}

// Uma folha do caderno (página de um dia).
function cadernoPaginaHtml(diaK, porDia, opts = {}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const entradas = (porDia[diaK] || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const ehHoje = diaK === hoje;
  const titulo = dataDiarioLonga(diaK) || diaK;
  const corpo = entradas.length
    ? entradas.map(coupleDiaryEntryCard).join("")
    : `<p class="caderno-vazio">${opts.write ? "Escreve como foi esse dia… 💕" : "página em branco"}</p>`;
  const form = opts.write
    ? `<form id="couple-diary-form" class="caderno-escrever">
        <input type="hidden" name="kind" value="livre" />
        <input type="hidden" name="watchedOn" value="${esc(diaK)}" />
        <textarea name="comment" rows="3" placeholder="Ex.: ${esc(diarioExemplo())} 💕"></textarea>
        <div class="foto-anexo" id="diary-foto-wrap">${coupleDiaryFoto ? `<div class="foto-preview"><img src="${coupleDiaryFoto}" alt="" /><button type="button" class="foto-remove" data-diary-foto-remove>✕</button></div>` : ""}</div>
        <div class="actions caderno-escrever-acoes">
          <label class="foto-btn">📷 Foto<input type="file" accept="image/*" data-diary-foto hidden /></label>
          <button class="btn" type="submit">✍️ Escrever aqui</button>
        </div>
      </form>`
    : "";
  return `
    <div class="caderno-page ${opts.side || ""}">
      <div class="caderno-page-data">${esc(titulo)}${ehHoje ? " · hoje" : ""}</div>
      <div class="caderno-folha">${corpo}</div>
      ${form}
    </div>`;
}

function coupleDiaryTemplate() {
  const hoje = new Date().toISOString().slice(0, 10);
  const porDia = {};
  (coupleDiary || []).forEach((e) => { (porDia[diaKey(e)] ||= []).push(e); });

  const dia = coupleDiaryDay || hoje;        // página da direita (dia atual / escolhido)
  const diaEsq = addDias(dia, -1);           // página da esquerda (dia anterior)
  const ehHoje = dia === hoje;
  const podeAvancar = dia < hoje;

  return `
    <section class="diary-hero">
      <span>Nosso caderno</span>
      <h2>Diário do casal</h2>
      <p>Um caderno de verdade: a página da esquerda é o dia anterior, a da direita é o dia atual. Folheiem e escrevam a dois. 💕</p>
    </section>

    <section class="caderno-book">
      ${cadernoPaginaHtml(diaEsq, porDia, { side: "left" })}
      <div class="caderno-spine" aria-hidden="true"></div>
      ${cadernoPaginaHtml(dia, porDia, { side: "right", write: true })}
    </section>

    <div class="caderno-controls">
      <button class="caderno-arrow" type="button" data-diary-older title="Dia anterior">‹ anterior</button>
      <label class="caderno-cal"><input type="date" value="${esc(dia)}" max="${esc(hoje)}" data-diary-goto /></label>
      ${!ehHoje ? `<button class="caderno-hoje" type="button" data-diary-hoje>hoje</button>` : ""}
      <button class="caderno-arrow" type="button" data-diary-newer ${podeAvancar ? "" : "disabled"} title="Próximo dia">próximo ›</button>
    </div>`;
}

// Nome do casal: título definido ou "A & B" dos membros.
function coupleNome() {
  const nomes = (coupleMembers || []).map((m) => (m.nickname || m.name || "").trim()).filter(Boolean);
  return state.couple?.title || (nomes.length ? nomes.join(" & ") : "Nossa história");
}

// "Juntos há X" a partir da data de início do namoro (aaaa-mm-dd).
function tempoJuntos(iso) {
  const s = String(iso || "").slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return "";
  const ini = new Date(y, m - 1, d);
  const hoje = new Date();
  if (isNaN(ini) || ini > hoje) return "";
  let meses = (hoje.getFullYear() - ini.getFullYear()) * 12 + (hoje.getMonth() - ini.getMonth());
  if (hoje.getDate() < ini.getDate()) meses -= 1;
  const anos = Math.floor(meses / 12);
  const rm = meses % 12;
  const partes = [];
  if (anos) partes.push(`${anos} ano${anos > 1 ? "s" : ""}`);
  if (rm) partes.push(`${rm} ${rm > 1 ? "meses" : "mês"}`);
  if (!partes.length) {
    const dias = Math.max(0, Math.round((hoje - ini) / 86400000));
    return `${dias} dia${dias === 1 ? "" : "s"}`;
  }
  return partes.join(" e ");
}

function coupleAniversarioTemplate() {
  const dataIni = String(coupleAbout.namoro_inicio || "").slice(0, 10);
  const tempo = tempoJuntos(dataIni);
  const hoje = new Date().toISOString().slice(0, 10);
  return `
    <section class="aniversario ${tempo ? "on" : ""}">
      <div class="aniversario-txt">
        <span>💕 Juntos</span>
        <strong>${tempo ? `há ${tempo}` : "Desde quando vocês estão juntos?"}</strong>
        ${dataIni && tempo ? `<small>desde ${esc(dataDiarioLonga(dataIni) || dataIni)}</small>` : ""}
      </div>
      <label class="aniversario-set">${dataIni ? "editar" : "definir data"}<input type="date" value="${esc(dataIni)}" max="${esc(hoje)}" data-namoro-inicio /></label>
    </section>`;
}

function coupleAboutTemplate() {
  const grupos = aboutGrupos.map(([titulo, itens]) => `
    <div class="section-title compact"><h2>${titulo}</h2></div>
    <section class="hist-lista">
      ${itens.map(([key, label]) => {
        const value = String(coupleAbout[key] || "").trim();
        const isUrl = /^https?:\/\//i.test(value);
        return `
          <div class="hist-row ${value ? "" : "vazio"}">
            <button class="hist-main" type="button" data-about-pick="${esc(key)}">
              <span class="hist-label">${esc(label)}</span>
              <span class="hist-value">${value ? (isUrl ? "🔗 abrir link" : esc(value)) : "toque pra escrever"}</span>
            </button>
            ${isUrl
              ? `<a class="hist-open" href="${esc(value)}" target="_blank" rel="noopener noreferrer" title="Abrir">↗</a>`
              : `<span class="hist-edit">${icon("detail")}</span>`}
          </div>`;
      }).join("")}
    </section>`).join("");

  return `
    <section class="about-hero">
      <span>💕 Nossa história</span>
      <h2>${esc(coupleNome())}</h2>
      <p>A ficha de vocês: quando começou, como se conheceram e as coisas que só vocês entendem. Toque pra escrever ou editar.</p>
    </section>
    ${coupleAniversarioTemplate()}
    ${grupos}`;
}

const CARTINHA_TIPOS = { memoria: ["📸", "Memória"], mensagem: ["💌", "Mensagem"], lembrar: ["📌", "Pra lembrar"] };

function coupleLettersTemplate() {
  const eu = authUser?.id;
  const LIMITE = 6;
  const lista = cartinhasExpandidas ? coupleLetters : coupleLetters.slice(0, LIMITE);
  const cards = coupleLetters.length
    ? lista.map((l, i) => {
        const [emoji, label] = CARTINHA_TIPOS[l.kind] || ["💌", "Cartinha"];
        const autor = coupleMembers.find((m) => m.user_id === l.author_id);
        const mine = l.author_id && l.author_id === eu;
        const nome = autor?.nickname || autor?.name || (mine ? "Você" : "");
        const assinatura = [nome ? `${nome}${mine ? " (você)" : ""}` : "", l.created_at ? timeAgo(l.created_at) : ""].filter(Boolean).join(" · ");
        return `
          <article class="cartinha cart-${i % 4}">
            <span class="cartinha-tag">${emoji} ${label}</span>
            ${l.photo ? `<img class="cartinha-foto" src="${esc(l.photo)}" alt="" loading="lazy" />` : ""}
            <p class="cartinha-body">${esc(l.body)}</p>
            <div class="cartinha-foot">
              <span>${esc(assinatura)}</span>
              ${mine ? `<button class="cartinha-del" data-del-couple-letter="${l.id}" title="Apagar">${icon("trash")}</button>` : ""}
            </div>
          </article>`;
      }).join("")
    : `<div class="empty">Guardem bilhetes, memórias e coisas que vocês querem lembrar. 💌</div>`;
  const verMais = coupleLetters.length > LIMITE
    ? `<button class="recados-more" type="button" data-cartinhas-toggle>${cartinhasExpandidas ? "Ver menos ▲" : `Ver todas as ${coupleLetters.length} cartinhas ▾`}</button>`
    : "";
  return `
    <div class="section-title compact"><h2>💌 Cartinhas e memórias</h2></div>
    <form id="couple-letter-form" class="cartinha-form">
      <select name="kind"><option value="memoria">📸 Memória</option><option value="mensagem">💌 Mensagem</option><option value="lembrar">📌 Pra lembrar</option></select>
      <input name="body" placeholder="Uma coisa que eu amei hoje…" />
      <label class="foto-btn">📷<input type="file" accept="image/*" data-letter-foto hidden /></label>
      <button class="btn" type="submit">Guardar 💕</button>
      <div class="foto-anexo" id="letter-foto-wrap">${coupleLetterFoto ? `<div class="foto-preview"><img src="${coupleLetterFoto}" alt="" /><button type="button" class="foto-remove" data-letter-foto-remove>✕</button></div>` : ""}</div>
    </form>
    <section class="cartinha-mural">${cards}</section>
    ${verMais}`;
}

// Cartinha fixa: carta sempre visível no topo do espaço do casal.
// "Nossos recadinhos": mural de bilhetes do casal, com autor, avatar e data.
function coupleRecadoTemplate() {
  const letters = (coupleLetters || []).filter((l) => (l.body || "").trim());
  if (!letters.length) {
    return `
      <section class="recados empty">
        <span class="couple-pinned-tag">💌 Nossos recadinhos</span>
        <p class="muted" style="margin:6px 0 10px">Nenhum recadinho ainda. Deixe um pra sua pessoa encontrar. 💕</p>
        <button class="recado-mini" type="button" data-couple-recado>✏️ Deixar recadinho</button>
      </section>`;
  }
  const eu = authUser?.id;
  const LIMITE = 4;
  const mostrar = recadosExpandidos ? letters : letters.slice(0, LIMITE);
  const escondidos = letters.length - mostrar.length;
  const cards = mostrar.map((l) => {
    const autor = coupleMembers.find((m) => m.user_id === l.author_id);
    const mine = l.author_id && l.author_id === eu;
    const nome = autor?.nickname || autor?.name || (mine ? "Você" : "Alguém do casal");
    const avatar = autor ? clubAvatarMini(autor) : muralAvatar(nome);
    return `
      <article class="recado-card ${mine ? "mine" : ""}">
        <div class="recado-head">
          ${avatar}
          <div class="recado-who"><strong>${esc(nome)}${mine ? " (você)" : ""}</strong><small>${esc(timeAgo(l.created_at))}</small></div>
          ${mine ? `<button class="recado-del" data-del-couple-letter="${l.id}" title="Apagar">${icon("trash")}</button>` : ""}
        </div>
        <p class="recado-body">${esc(l.body)}</p>
      </article>`;
  }).join("");
  const verMais = letters.length > LIMITE
    ? `<button class="recados-more" type="button" data-recados-toggle>${recadosExpandidos ? "Ver menos ▲" : `Ver todos os ${letters.length} recadinhos ▾`}</button>`
    : "";
  return `
    <section class="recados">
      <div class="recados-head"><span class="couple-pinned-tag">💌 Nossos recadinhos</span><button class="recado-mini" type="button" data-couple-recado>✏️ Novo</button></div>
      <div class="recados-list">${cards}</div>
      ${verMais}
    </section>`;
}

// Seção "Painel" do casal: a imagem do que estão vivendo + atalhos + resumo + timeline.
// "Próximo passo" inteligente: sugere a ação mais útil agora.
function coupleProximoPasso() {
  const watching = coupleDramas.find((d) => d.status === "watching");
  const fila = coupleDramas.filter((d) => d.status === "wishlist");
  const sobreResp = aboutLabels.filter(([k]) => String(coupleAbout[k] || "").trim()).length;
  let p;
  if (!coupleDramas.length) p = { emoji: "🍿", texto: "Comecem o primeiro dorama juntos", attrs: `data-couple-section="assistindo"`, cta: "Adicionar" };
  else if (watching) p = { emoji: "▶️", texto: `Continuem “${watching.title}” — +1 episódio`, attrs: `data-couple-plus="${watching.id}"`, cta: "+1 ep" };
  else if (fila.length) p = { emoji: "🎲", texto: "Escolham o próximo da fila de vocês", attrs: "data-couple-sortear-fila", cta: "Sortear" };
  else if (!coupleDiary.length) p = { emoji: "📖", texto: "Guardem a primeira memória de vocês", attrs: `data-couple-section="diario"`, cta: "Registrar" };
  else if (sobreResp < 3) p = { emoji: "💬", texto: "Respondam uma pergunta de vocês", attrs: `data-couple-section="sobre"`, cta: "Responder" };
  else p = { emoji: "✨", texto: "Que tal registrar uma nova página do diário?", attrs: `data-couple-section="diario"`, cta: "Registrar" };
  return `
    <button class="couple-nextstep" type="button" ${p.attrs}>
      <span class="ns-emoji">${p.emoji}</span>
      <span class="ns-text"><small>Próximo passo</small><strong>${esc(p.texto)}</strong></span>
      <span class="ns-cta">${esc(p.cta)} →</span>
    </button>`;
}

// Texto curto de "quanto falta pra próxima decoração do cantinho".
function proximaDecoTexto() {
  const eps = coupleDramas.reduce((s, d) => s + Number(d.current_episode || 0), 0);
  const fin = coupleDramas.filter((d) => d.status === "watched" || d.status === "favorite").length;
  const mem = coupleDiary.length;
  const cart = coupleLetters.length;
  const ep = (n) => `${n} ep${n > 1 ? "s" : ""}`;
  if (eps < 1) return `assistam 1 ep pra ganhar 🍿`;
  if (mem < 1) return `1 memória pro abajur 💡`;
  if (eps < 5) return `${ep(5 - eps)} pro sofá 🛋️`;
  if (mem < 3) return `${3 - mem} memórias pra plantinha 🪴`;
  if (cart < 1) return `1 cartinha pro quadro 🖼️`;
  if (fin < 1) return `1 finalizado pra TV 📺`;
  if (eps < 10) return `${ep(10 - eps)} pro laço 🎀`;
  if (eps < 50) return `${ep(50 - eps)} pra coroa 👑`;
  return `cantinho completo! 🏠`;
}

function petStatusCurto(fel) {
  if (fel >= 85) return "está radiante 🥰";
  if (fel >= 55) return "está feliz 😊";
  if (fel >= 30) return "tá de boa 🐾";
  return "com saudade 🥺";
}

// Cardzinho do pet no painel (estilo Couple2: presença + carinho rápido).
function couplePetMini() {
  if (!couplePet) {
    return `
      <button class="couple-petmini empty" type="button" data-couple-section="diversao">
        <span class="pet-mini-face">🐱</span>
        <span class="pet-mini-text"><strong>Adotem um bichinho</strong><small>Um cantinho fofo só de vocês.</small></span>
        <span class="ns-cta">Adotar →</span>
      </button>`;
  }
  const fel = petFelicidade();
  return `
    <div class="couple-petmini">
      <span class="pet-mini-face">${couplePet.species || "🐱"}</span>
      <span class="pet-mini-text"><strong>${esc(couplePet.name || "Nosso pet")} ${petStatusCurto(fel)}</strong><small>${esc(proximaDecoTexto())}</small></span>
      <button class="recado-mini" type="button" data-pet-care="carinho">❤️ Carinho</button>
      <button class="recado-mini" type="button" data-couple-section="diversao">Cantinho →</button>
    </div>`;
}

// Chip de saudade no painel (dias sem se ver).
function coupleSaudadeMini() {
  const dias = diasSemVer();
  if (dias === null || dias === 0) return "";
  return `<div class="saudade-mini">💗 <strong>${dias}</strong> dia${dias === 1 ? "" : "s"} sem se ver <button class="recado-mini" type="button" data-couple-section="planos">mandar saudade →</button></div>`;
}

// Contagem regressiva pro próximo encontro presencial.
function coupleCountdownTemplate() {
  const d = state.couple?.nextMeetDate;
  if (!d) return "";
  const alvo = new Date(`${d}T00:00:00`);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dias = Math.round((alvo - hoje) / 86400000);
  let txt;
  if (dias > 1) txt = `Faltam <strong>${dias} dias</strong> pro nosso encontro 💕`;
  else if (dias === 1) txt = `É <strong>amanhã</strong>! 😍`;
  else if (dias === 0) txt = `É <strong>HOJE</strong>! 🥳`;
  else return ""; // já passou
  return `<div class="couple-countdown"><span class="cd-txt">${txt}</span><span class="muted">${esc(formatDateShort(d))}</span></div>`;
}

// Aviso de aniversário: aparece no dia do "mêsversário"/aniversário de namoro.
function coupleAniversarioAviso() {
  const s = String(coupleAbout.namoro_inicio || "").slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return "";
  const hoje = new Date();
  if (hoje.getDate() !== d) return "";
  let meses = (hoje.getFullYear() - y) * 12 + (hoje.getMonth() - (m - 1));
  if (meses <= 0) return "";
  const aniversarioAno = hoje.getMonth() === (m - 1) && meses % 12 === 0;
  const anos = meses / 12;
  const quanto = aniversarioAno ? `${anos} ano${anos > 1 ? "s" : ""}` : `${meses} ${meses > 1 ? "meses" : "mês"}`;
  return `
    <section class="aniv-aviso">
      <span class="aniv-emoji">${aniversarioAno ? "🎉" : "💕"}</span>
      <div><strong>Feliz ${quanto} juntos!</strong><small>Hoje é ${aniversarioAno ? "aniversário" : "mêsversário"} de vocês 💕</small></div>
    </section>`;
}

function coupleInicioSection() {
  return `
    ${coupleAniversarioAviso()}
    ${coupleGreetingTemplate()}
    ${coupleCountdownTemplate()}
    ${coupleSaudadeMini()}
    ${coupleFocusCard()}
    ${couplePetMini()}
    ${coupleResumoTemplate()}
    <div class="section-title compact"><h2>Linha do tempo</h2></div>
    ${coupleTimelineTemplate()}`;
}

// Resumo do casal: números com ícone, em cards bonitos.
function coupleResumoTemplate() {
  const eps = coupleDramas.reduce((s, d) => s + Number(d.current_episode || 0), 0);
  const horas = coupleHorasEstimadas();
  const finalizados = coupleDramas.filter((d) => d.status === "watched" || d.status === "favorite").length;
  const certs = coupleCertificados().filter((c) => c.earned).length;
  const iniNamoro = String(coupleAbout.namoro_inicio || "").slice(0, 10);
  const diasJuntos = (() => {
    const [y, m, d] = iniNamoro.split("-").map(Number);
    if (!y || !m || !d) return null;
    const ini = new Date(y, m - 1, d);
    return isNaN(ini) || ini > new Date() ? null : Math.round((new Date() - ini) / 86400000);
  })();
  const itens = [
    ["📺", eps, "Episódios juntos"],
    ["⏱️", horas ? `~${horas}h` : "—", "Horas juntos"],
    ["🍿", coupleDramas.length, "Doramas"],
    ["🏁", finalizados, "Finalizados"],
    ["📖", coupleDiary.length, "Memórias"],
    ["💌", coupleLetters.length, "Cartinhas"],
    ["🎓", certs, "Certificados"],
  ];
  const destaque = diasJuntos != null
    ? `<div class="retro-destaque"><span>💕 Juntos há</span><strong>${diasJuntos}</strong><small>${diasJuntos === 1 ? "dia" : "dias"}${tempoJuntos(iniNamoro) ? ` · ${esc(tempoJuntos(iniNamoro))}` : ""}</small></div>`
    : `<div class="retro-destaque sem"><span>💕 Nossa história</span><strong>${esc(coupleNome())}</strong><small>defina a data do namoro em “Nossa história”</small></div>`;
  return `
    <section class="retro">
      <div class="retro-topo"><span class="retro-tag">💞 Vocês em números</span></div>
      ${destaque}
      <div class="retro-grid">${itens.map(([emoji, valor, label]) => `
        <div class="retro-item"><span class="retro-emoji">${emoji}</span><strong>${valor}</strong><small>${esc(label)}</small></div>`).join("")}</div>
    </section>`;
}

function coupleAjustesSection() {
  return `
    <div class="section-title"><h2>Convite do casal</h2></div>
    <section class="form-card couple-code-card">
      <span class="muted">Use só quando for chamar sua pessoa para o espaço certo.</span>
      <strong>${esc(state.couple.code || "")}</strong>
      <div class="actions" style="margin-top:12px"><button class="btn secondary" type="button" data-copy-couple-code>${icon("share")} Copiar código</button></div>
    </section>
    <div class="section-title"><h2>💌 Cartinha fixa do topo</h2></div>
    <section class="form-card">
      <form id="couple-pinned-form" class="form-grid">
        <div class="field full"><label>Uma carta que fica sempre visível pra vocês dois (e abre como presente na 1ª visita).</label><textarea name="pinned" placeholder="Pra quando a gente quiser lembrar de como é bom assistir junto…">${esc(state.couple.pinnedLetter || "")}</textarea></div>
        <div class="actions field full"><button class="btn secondary" type="submit">Salvar cartinha</button></div>
      </form>
    </section>
    <div class="section-title"><h2>Capa do casal</h2></div>
    <section class="form-card">
      <form id="couple-capa-form" class="form-grid">
        <div class="field"><label>Nome da capa</label><input name="title" value="${esc(state.couple.title || "")}" placeholder="Nós dois" /></div>
        <div class="field"><label>Data especial</label><input name="specialDate" type="date" value="${esc(state.couple.specialDate || "")}" /></div>
        <div class="field full"><label>Frase do casal</label><input name="tagline" value="${esc(state.couple.tagline || "")}" placeholder="Nosso cantinho de doramas e dates." /></div>
        <div class="actions field full"><button class="btn secondary" type="submit">Salvar capa</button><button class="btn ghost" type="button" data-leave-couple>Sair deste casal</button></div>
      </form>
    </section>
    <section class="form-card">
      <p class="muted" style="margin:0 0 10px">Primeira vez aqui? Veja como usar o cantinho de vocês.</p>
      <div class="actions" style="margin:0"><button class="btn ghost" type="button" data-open-couple-tutorial>Como funciona o Nós dois</button></div>
    </section>
    ${casalPrivadoOn() ? `
    <div class="section-title"><h2>💌 Seu Telegram</h2></div>
    <section class="form-card">
      <form id="couple-telegram-form" class="form-grid">
        <div class="field full"><label>Seu número (com DDI, ex.: +55 11 9...) ou @usuário do Telegram. Fica só no banco, privado — nunca no código. A outra pessoa usa isso pra abrir conversa com você.</label><input name="telegram" value="${esc(meuTelegram())}" placeholder="+55 11 90000-0000 ou @seu_user" /></div>
        <div class="actions field full"><button class="btn secondary" type="submit">Salvar meu Telegram</button></div>
      </form>
    </section>
    <div class="section-title"><h2>📜 Extrato de pontos</h2></div>
    <section class="form-card">
      <p class="muted" style="margin:0 0 10px">O histórico de pontos do 🔥 Nós (ganhos, gastos e estornos).</p>
      <div class="actions" style="margin:0"><button class="btn secondary" type="button" data-extrato-open>Ver extrato</button></div>
    </section>` : ""}
    ${coupleTemaSection()}
    ${extratoModalTemplate()}`;
}

// ---------- Bingo do episódio (joguinho do casal, local) ----------
const BINGO_CLICHES = [
  "Quase beijo interrompido", "CEO frio que amolece", "Alguém chora na chuva",
  "Trauma de infância revelado", "Vilão sorri suspeito", "Protagonista passa vergonha",
  "Mãe rica desaprova", "Acidente de carro", "Flashback em câmera lenta",
  "Cena no hospital", "Mal-entendido bobo", "Abraço por trás",
  "Bêbado(a) se declarando", "Sem guarda-chuva na chuva", "Triângulo amoroso",
  "Segredo de família", "Reencontro de infância", "Comida feita com amor",
  "Carregar nas costas (piggyback)", "Ciúme escancarado", "Tapa na cara",
  "Declaração na neve", "Salvamento no último segundo", "Beijo na testa",
  "Cair em cima do(a) crush", "Mão segura de repente", "Olhar demorado",
];
const BINGO_KEY = "dorama-club-bingo";
let bingoCard = null; // { size, cells:[{t,on}], saved }

function salvarBingo() { try { localStorage.setItem(BINGO_KEY, JSON.stringify(bingoCard)); } catch { /* ignore */ } }
function carregarBingo() { try { const b = JSON.parse(localStorage.getItem(BINGO_KEY) || "null"); if (b && Array.isArray(b.cells)) bingoCard = b; } catch { /* ignore */ } }
function gerarBingoCard(size = 3) {
  const n = size * size;
  const pool = [...BINGO_CLICHES].sort(() => Math.random() - 0.5).slice(0, n);
  bingoCard = { size, cells: pool.map((t) => ({ t, on: false })), saved: false };
  salvarBingo();
}
function bingoLinhas(size) {
  const linhas = [];
  for (let r = 0; r < size; r++) linhas.push(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) linhas.push(Array.from({ length: size }, (_, r) => r * size + c));
  linhas.push(Array.from({ length: size }, (_, i) => i * size + i));
  linhas.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  return linhas;
}
function bingoVenceu() {
  return bingoCard && bingoLinhas(bingoCard.size).some((l) => l.every((i) => bingoCard.cells[i]?.on));
}

function bingoTemplate() {
  if (!bingoCard) { carregarBingo(); if (!bingoCard) gerarBingoCard(3); }
  const venceu = bingoVenceu();
  return `
    <div class="section-title compact"><h2>🎬 Bingo do episódio</h2><button class="btn ghost" type="button" data-bingo-novo>Nova cartela</button></div>
    <p class="muted" style="margin:-6px 0 12px;font-size:.84rem">Antes do play, chutem os clichês que vão aparecer. Fechou uma linha (↔ ↕ ⤢)? <strong>BINGO!</strong> 🎉</p>
    <section class="bingo-grid size-${bingoCard.size}">
      ${bingoCard.cells.map((c, i) => `<button class="bingo-cell ${c.on ? "on" : ""}" type="button" data-bingo-cell="${i}">${esc(c.t)}</button>`).join("")}
    </section>
    ${venceu ? `<div class="bingo-win">🎉 BINGO! Vocês fecharam uma linha! <button class="btn" type="button" data-bingo-share>${icon("share")} Compartilhar</button></div>` : ""}`;
}

async function toggleBingoCell(i) {
  if (!bingoCard?.cells[i]) return;
  const jaVenceu = bingoVenceu();
  bingoCard.cells[i].on = !bingoCard.cells[i].on;
  salvarBingo();
  render();
  if (!jaVenceu && bingoVenceu() && !bingoCard.saved) {
    await registrarBingoConquista();
  }
}

// Bingo vira conquista do casal: salva uma página de diário (vai pra timeline
// e alimenta o pet) e habilita o certificado.
async function registrarBingoConquista() {
  bingoCard.saved = true;
  salvarBingo();
  toast("BINGO! Vocês fecharam uma linha 🎉");
  if (!state.couple || !cloudOn()) return;
  const marcados = bingoCard.cells.filter((c) => c.on).map((c) => c.t).slice(0, 4).join(", ");
  try {
    await addCoupleDiary(state.couple.id, authUser.id, {
      kind: "marco",
      dramaTitle: "Fechamos o bingo do episódio! 🎬",
      watchedOn: new Date().toISOString().slice(0, 10),
      favMoment: marcados,
      comment: "Bingo dorameiro fechado — clichês na conta!",
    });
    coupleDiary = await loadCoupleDiary(state.couple.id);
    render();
    toast("Guardado no diário do casal 🏆");
  } catch {
    /* silencioso: o bingo continua valendo localmente */
  }
}

async function shareBingo() {
  toast("Gerando…");
  const coupleName = state.couple?.title || coupleMembers.map((m) => m.name || m.nickname).filter(Boolean).join(" & ") || "Nós dois";
  const marcados = bingoCard.cells.filter((c) => c.on).map((c) => c.t).slice(0, 3).join(", ");
  try {
    const blob = await gerarCardMeuDia(
      { title: "🎬 Bingo do episódio" },
      { casal: true, header: "🎉 Fechamos o bingo!", coupleName, frase: marcados ? `Apareceu: ${marcados}…` : "Bingo dorameiro fechado!" },
    );
    await compartilharImagem(blob, `Fechamos o bingo do episódio! 🎬💕 ${inviteLink()}`);
  } catch {
    toast("Não consegui gerar o card.");
  }
}

// ---------- Quiz do casal (compatibilidade semanal) ----------
const QUIZ_POOL = [
  { q: "Qual nosso gênero favorito juntos?", opts: ["Romance fofo", "Comédia", "Suspense/crime", "Histórico"] },
  { q: "Quem chora mais nos doramas?", opts: ["Eu", "Você", "Os dois", "Ninguém kkk"] },
  { q: "Date dorameiro ideal?", opts: ["Maratona no sofá", "Cinema em casa", "Comida + 1 ep", "Madrugada surtando"] },
  { q: "Vilão dá pra perdoar?", opts: ["Sempre", "Depende", "Nunca", "Se for bonito kkk"] },
  { q: "Final que a gente prefere?", opts: ["Final feliz", "Final realista", "Final aberto", "Só não matem ninguém"] },
  { q: "Nosso lanche oficial de dorama?", opts: ["Pipoca", "Doce", "Salgado", "Comida de verdade"] },
  { q: "Quem escolhe o próximo dorama?", opts: ["Eu", "Você", "A gente decide junto", "Sortear"] },
  { q: "Cena que mais mexe com a gente?", opts: ["Reconciliação", "Declaração", "Despedida", "Beijo na chuva"] },
  { q: "Quantos episódios por noite?", opts: ["1, com calma", "2 a 3", "Maratona", "Até dormir no sofá"] },
  { q: "Pior clichê de dorama?", opts: ["Mal-entendido bobo", "Triângulo amoroso", "Doença terminal", "Amnésia"] },
  { q: "Se fôssemos um casal de dorama, seríamos…", opts: ["O fofo", "O caótico", "O dramático", "O que faz rir"] },
  { q: "Maior red flag num personagem?", opts: ["Ciúme", "Mentira", "Frieza", "Sumir sem explicar"] },
];

function semanaAtual() {
  const d = new Date();
  const inicio = new Date(d.getFullYear(), 0, 1);
  const semana = Math.ceil(((d - inicio) / 86400000 + inicio.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${semana}`;
}

// 4 perguntas da semana (rotativas, determinísticas pela semana). q = índice no pool.
function quizSemana() {
  const week = semanaAtual();
  const seed = [...week].reduce((a, c) => a + c.charCodeAt(0), 0);
  const idxs = [];
  let i = seed % QUIZ_POOL.length;
  while (idxs.length < 4) { if (!idxs.includes(i)) idxs.push(i); i = (i + 1) % QUIZ_POOL.length; }
  return { week, perguntas: idxs.map((ix) => ({ ix, ...QUIZ_POOL[ix] })) };
}

async function loadCoupleQuizData() {
  if (!state.couple || !cloudOn()) return;
  const week = semanaAtual();
  try {
    coupleQuiz = await loadCoupleQuiz(state.couple.id, week);
  } catch {
    coupleQuiz = [];
  }
  coupleQuizFor = `${state.couple.id}:${week}`;
  render();
}

function coupleQuizTemplate() {
  const { week, perguntas } = quizSemana();
  const eu = authUser?.id;
  const parceira = coupleMembers.find((m) => m.user_id !== eu);
  const nomeParceira = parceira?.name || parceira?.nickname || "sua pessoa";
  const semParceira = coupleMembers.length < 2;
  const minha = (q) => coupleQuiz.find((a) => a.q === q && a.user_id === eu);
  const dela = (q) => coupleQuiz.find((a) => a.q === q && a.user_id !== eu);

  const respondidas = perguntas.filter((p) => minha(p.ix)).length;
  const ambos = perguntas.filter((p) => minha(p.ix) && dela(p.ix));
  const matches = ambos.filter((p) => minha(p.ix).answer === dela(p.ix).answer).length;
  const completo = ambos.length === perguntas.length;
  const pct = perguntas.length ? Math.round((matches / perguntas.length) * 100) : 0;

  const cards = perguntas.map((p, n) => {
    const meu = minha(p.ix);
    const dual = dela(p.ix);
    const revelado = meu && dual; // só revela quando os DOIS responderam
    return `
      <article class="quiz-card">
        <span class="quiz-n">Pergunta ${n + 1}</span>
        <strong>${esc(p.q)}</strong>
        <div class="quiz-opts">
          ${p.opts.map((opt, oi) => {
            const escolhiEu = meu && meu.answer === oi;
            const escolheuEla = dual && dual.answer === oi;
            const cls = [escolhiEu ? "eu" : "", revelado && escolheuEla ? "ela" : ""].filter(Boolean).join(" ");
            return `<button class="quiz-opt ${cls}" type="button" data-quiz="${p.ix}:${oi}" ${meu ? "disabled" : ""}>${esc(opt)}${revelado && escolheuEla ? ` · ${esc(nomeParceira.split(" ")[0])}` : ""}${escolhiEu ? " · você" : ""}</button>`;
          }).join("")}
        </div>
        ${meu && !dual ? `<small class="quiz-wait">✓ você respondeu — aguardando ${esc(nomeParceira.split(" ")[0])}…</small>` : ""}
        ${revelado ? `<small class="quiz-result ${meu.answer === dual.answer ? "match" : "miss"}">${meu.answer === dual.answer ? "💚 Vocês concordam!" : "🤔 Responderam diferente"}</small>` : ""}
      </article>`;
  }).join("");

  return `
    <div class="section-title"><h2>💞 Quiz do casal</h2><span class="muted" style="font-size:.8rem">${week}</span></div>
    <p class="muted" style="margin:-6px 0 12px;font-size:.84rem">4 perguntas da semana. Cada um responde no seu app — a resposta do outro só aparece quando os dois responderem. Bateu = compatível! 💚</p>
    ${semParceira ? `<div class="empty">O quiz precisa de vocês dois. Falta sua pessoa entrar no casal (código em Ajustes).</div>` : `
      ${completo ? `<div class="quiz-score"><strong>${pct}% de compatibilidade essa semana</strong><span>${matches} de ${perguntas.length} respostas iguais ${pct >= 75 ? "🥰" : pct >= 50 ? "😊" : "😅"}</span></div>` : `<p class="muted" style="margin:0 0 10px;font-size:.82rem">Você respondeu ${respondidas}/${perguntas.length}.</p>`}
      <section class="quiz-grid">${cards}</section>`}`;
}

async function handleQuizAnswer(raw) {
  if (!state.couple) return;
  const [q, oi] = String(raw).split(":").map(Number);
  // Não deixa trocar depois de responder.
  if (coupleQuiz.some((a) => a.q === q && a.user_id === authUser.id)) return;
  try {
    const week = semanaAtual();
    await saveCoupleQuizAnswer(state.couple.id, authUser.id, week, q, oi);
    await ganharPontos(PONTOS.quiz, "pergunta do casal", "quiz", `${week}:${q}`);
    coupleQuiz = [...coupleQuiz, { q, user_id: authUser.id, answer: oi }];
    render();
  } catch {
    toast("Não consegui salvar sua resposta.");
  }
}

async function handleNosSetPin(event) {
  event.preventDefault();
  const pin = String(new FormData(event.currentTarget).get("pin") || "").trim();
  if (pin.length < 3) { toast("PIN muito curto (mín. 3)."); return; }
  try { localStorage.setItem(NOS_PIN_KEY, pin); } catch { /* ignore */ }
  nosUnlocked = true;
  marcarNosUnlock();
  render();
}
function handleNosEnterPin(event) {
  event.preventDefault();
  const pin = String(new FormData(event.currentTarget).get("pin") || "").trim();
  if (pin === nosPinSalvo()) { nosUnlocked = true; marcarNosUnlock(); render(); }
  else toast("PIN incorreto.");
}
async function handleSetIntensity(n) {
  if (!state.couple) return;
  try {
    await saveCouplePref(state.couple.id, authUser.id, Number(n));
    couplePrefs = couplePrefs.filter((p) => p.user_id !== authUser.id).concat([{ user_id: authUser.id, max_intensity: Number(n) }]);
    render();
    toast("Limite salvo 🔐");
  } catch { toast("Não consegui salvar."); }
}
function handleDesafioOutro() {
  desafioIdx += 1;
  render();
}
async function handleAdulto18(on) {
  if (on) {
    const ok = await confirmar("Vocês têm 18 anos ou mais?", { sub: "Libera os níveis íntimos (4–6). Só ative se os dois concordam — pode esconder quando quiser.", ok: "Sim, somos +18" });
    if (!ok) return;
  }
  try { if (on) localStorage.setItem(ADULTO18_KEY, "1"); else localStorage.removeItem(ADULTO18_KEY); } catch { /* ignore */ }
  render();
}
async function handleUnlockDesafio(key) {
  const d = DESAFIOS_CAT.find((x) => x.key === key);
  if (!d || !state.couple) return;
  if (d.nivel > intensidadePermitida()) { toast("Fora do limite combinado dos dois."); return; }
  if (nosSaldo() < d.custo) { toast(`Faltam ${d.custo - nosSaldo()} pts pra desbloquear.`); return; }
  const ok = await confirmar(`Desbloquear “${d.nome}”?`, { sub: `Custa ${d.custo} pts. Desbloquear não obriga ninguém — ainda precisa de aceite na hora.`, ok: "Desbloquear 🔓" });
  if (!ok) return;
  try {
    await gastarPontos(d.custo, `desbloqueio: ${d.nome}`, "unlock", key);
    coupleLedger = await loadPointsLedger(state.couple.id);
    render();
    toast("Desbloqueado 🔓");
  } catch { toast("Não consegui desbloquear."); }
}
// Um desafio é pros DOIS: cada um confirma; só pontua (e sobe de nível) quando os
// dois confirmaram no mesmo dia. Recusar/esperar nunca tira ponto.
function confsDesafioHoje(key) {
  const hoje = hojeISO();
  return coupleChallenges.filter((c) => c.challenge_key === key && isoDia(c.created_at) === hoje);
}
function euConfirmei(key) {
  return confsDesafioHoje(key).some((c) => c.done_by === authUser?.id);
}
function outroConfirmou(key) {
  return confsDesafioHoje(key).some((c) => c.done_by !== authUser?.id);
}
function ambosConfirmaram(key) {
  const users = new Set(confsDesafioHoje(key).map((c) => c.done_by));
  if (coupleMembers.length < 2) return users.size >= 1; // testando sozinho(a)
  return coupleMembers.every((m) => users.has(m.user_id));
}
function desafioEstado(key) {
  return {
    eu: euConfirmei(key),
    outro: outroConfirmou(key),
    ambos: ambosConfirmaram(key),
  };
}
function desafioRotuloAcao(key) {
  const st = desafioEstado(key);
  if (st.ambos) return "✓ concluído 💞";
  if (st.eu) return "📤 enviado · falta receber";
  if (st.outro) return "📥 Recebi";
  return "📤 Desafiar";
}
function desafioPontuado(key, dia) {
  return coupleLedger.some((l) => l.source_type === "challenge" && l.source_id === `${key}:${dia}` && Number(l.points) > 0);
}
const CHALLENGE_FEEDBACKS = [
  ["amei", "Amei"],
  ["repetir", "Quero repetir"],
  ["adaptar", "Prefiro adaptar"],
  ["nao", "Não de novo"],
];
const DESIRE_STOPWORDS = new Set([
  "a", "ao", "aos", "as", "com", "da", "das", "de", "do", "dos", "e", "em", "eu", "me", "meu",
  "minha", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por", "pra", "que", "se", "sem",
  "sua", "te", "um", "uma", "você",
]);
function feedbacksDesafio(key, dia) {
  const prefix = `${key}:${dia}:`;
  return coupleLedger.filter((l) => l.source_type === "challenge_feedback" && String(l.source_id || "").startsWith(prefix));
}
function meuFeedbackDesafio(key, dia) {
  const prefix = `${key}:${dia}:${authUser?.id}:`;
  return coupleLedger.find((l) => l.source_type === "challenge_feedback" && String(l.source_id || "").startsWith(prefix));
}
function feedbackLabel(value) {
  return CHALLENGE_FEEDBACKS.find(([v]) => v === value)?.[1] || value;
}
async function handleDesafioDone(raw) {
  if (!state.couple) return;
  const [key, nivel] = String(raw).split(":");
  const n = Number(nivel) || 1;
  const d = DESAFIOS_CAT.find((x) => x.key === key);
  const nome = d ? d.nome : "desafio";
  if (d && d.nivel > intensidadePermitida()) { toast("Fora do limite combinado dos dois."); return; }
  const estadoAntes = desafioEstado(key);
  const recebendo = estadoAntes.outro && !estadoAntes.eu;
  if (estadoAntes.eu) { toast("Você já enviou — falta a outra pessoa marcar que recebeu 💞"); return; }
  // Aceite nos níveis íntimos.
  if (n >= 4) {
    const ok = await confirmar(recebendo ? `Marcar “${nome}” como recebido?` : `Enviar desafio “${nome}”?`, { sub: recebendo ? "Ao marcar recebido, o desafio fica concluído e pontua para vocês." : "A outra pessoa precisa marcar que recebeu para concluir e pontuar.", ok: recebendo ? "Recebi 💞" : "Enviei 📤", cancel: "Agora não" });
    if (!ok) return;
  }
  const pts = PONTOS.desafio[n] || 5;
  const hoje = hojeISO();
  try {
    await addCoupleChallengeLog(state.couple.id, authUser.id, { key, intensity: n });
    coupleChallenges = await loadCoupleChallenges(state.couple.id);
    if (ambosConfirmaram(key)) {
      // Os dois confirmaram → pontua UMA vez (anti-dup por key:dia). Sobe de nível.
      await ganharPontos(pts, `desafio: ${nome}`, "challenge", `${key}:${hoje}`);
      coupleLedger = await loadPointsLedger(state.couple.id);
      desafioIdx += 1;
      render();
      toast(`Recebido e concluído! +${pts} pts 🎯`);
    } else {
      render();
      toast(recebendo ? "Recebido! Esperando atualizar 💞" : "Desafio enviado! Esperando a outra pessoa receber 💞");
    }
  } catch { toast("Não consegui registrar."); }
}

async function handleChallengeFeedback(raw) {
  if (!state.couple || !authUser) return;
  const [key, dia, value] = String(raw).split(":");
  if (!key || !dia || !value) return;
  if (!desafioPontuado(key, dia)) { toast("O desafio precisa estar concluído primeiro."); return; }
  if (meuFeedbackDesafio(key, dia)) { toast("Você já marcou seu check-in desse desafio."); return; }
  try {
    await ganharPontos(0, `check-in do desafio: ${feedbackLabel(value)}`, "challenge_feedback", `${key}:${dia}:${authUser.id}:${value}`);
    coupleLedger = await loadPointsLedger(state.couple.id);
    render();
    toast("Check-in guardado 💞");
  } catch {
    toast("Não consegui guardar o check-in.");
  }
}

// Desfazer um desafio: tira as confirmações dos dois e estorna os pontos (se já tinham sido dados).
async function handleUndoChallenge(raw) {
  const parts = String(raw).split(":");
  const ids = String(parts[0] || "").split(",").filter(Boolean);
  const intensity = Number(parts[1]) || 1;
  const key = parts[2] || "";
  const dia = parts[3] || hojeISO();
  if (!state.couple || !ids.length) return;
  const ok = await confirmar("Desfazer esse desafio?", { sub: "Tira as confirmações e estorna os pontos (se já tinham sido dados).", ok: "Desfazer", danger: true });
  if (!ok) return;
  try {
    const tinhaPontos = desafioPontuado(key, dia);
    for (const id of ids) await deleteCoupleChallengeLog(id);
    if (tinhaPontos) await estornarPontos(-(PONTOS.desafio[intensity] || 5), "desafio desfeito", "challenge_undo", `${key}:${dia}`);
    coupleChallenges = await loadCoupleChallenges(state.couple.id);
    coupleLedger = await loadPointsLedger(state.couple.id);
    render();
    toast(tinhaPontos ? "Desfeito. Pontos estornados." : "Desfeito.");
  } catch { toast("Não consegui desfazer."); }
}

async function handleCheckin(mood) {
  if (!state.couple) return;
  const day = new Date().toISOString().slice(0, 10);
  try {
    await upsertCoupleCheckin(state.couple.id, authUser.id, day, { mood });
    await ganharPontos(PONTOS.checkin, "check-in do clima", "checkin", `${authUser.id}:${day}`);
    coupleCheckins = await loadCoupleCheckins(state.couple.id, day);
    // Bônus quando os dois fazem check-in no mesmo dia.
    if (coupleMembers.length >= 2 && coupleMembers.every((m) => coupleCheckins.some((c) => c.user_id === m.user_id))) {
      await ganharPontos(PONTOS.checkinBonus, "os dois fizeram check-in", "checkin_bonus", day);
    }
    coupleLedger = await loadPointsLedger(state.couple.id);
    render();
    toast("Clima registrado 💞");
  } catch { toast("Não consegui registrar."); }
}
async function handleDayLimit(n) {
  if (!state.couple) return;
  const day = new Date().toISOString().slice(0, 10);
  try {
    await upsertCoupleCheckin(state.couple.id, authUser.id, day, { dayLimit: Number(n) });
    coupleCheckins = await loadCoupleCheckins(state.couple.id, day);
    render();
    toast("Limite de hoje salvo 🔐");
  } catch { toast("Não consegui salvar."); }
}

async function handleNosCreate(event) {
  event.preventDefault();
  if (!state.couple) return;
  const d = Object.fromEntries(new FormData(event.currentTarget));
  const title = String(d.title || "").trim();
  if (!title) return;
  try {
    await addCoupleReward(state.couple.id, authUser.id, { title, kind: d.kind, cost: Number(d.cost) || 10 });
    nosRewards = await loadCoupleRewards(state.couple.id);
    render();
    toast("Vale criado 💞");
  } catch { toast("Não consegui criar o vale."); }
}
async function handleNosPreset(i) {
  const p = NOS_PRESETS[Number(i)];
  if (!p || !state.couple) return;
  try {
    await addCoupleReward(state.couple.id, authUser.id, p);
    nosRewards = await loadCoupleRewards(state.couple.id);
    render();
    toast("Vale adicionado 💞");
  } catch { toast("Não consegui adicionar."); }
}
async function handleNosClaim(id) {
  const r = nosRewards.find((x) => x.id === id);
  if (!r || !state.couple) return;
  if (nosSaldo() < Number(r.cost || 0)) { toast(`Faltam ${Number(r.cost) - nosSaldo()} pts pra esse vale.`); return; }
  const ok = await confirmar(`Resgatar “${r.title}”?`, { sub: `Vai custar ${r.cost} pts.`, ok: "Resgatar 🔥" });
  if (!ok) return;
  try {
    const claimId = await addCoupleClaim(state.couple.id, authUser.id, r);
    await gastarPontos(Number(r.cost || 0), `vale: ${r.title}`, "claim", claimId || `${r.id}:${Date.now()}`);
    nosClaims = await loadCoupleClaims(state.couple.id);
    render();
    toast("Resgatado! 🔥 Aguardando o aceite da sua pessoa.");
  } catch { toast("Não consegui resgatar."); }
}
async function handleSurpresaCreate(e) {
  e.preventDefault();
  if (!state.couple) return;
  const f = e.target;
  const message = f.message.value.trim();
  const reveal_date = f.reveal_date.value;
  if (!message || !reveal_date) return;
  try {
    await addCoupleSurprise(state.couple.id, authUser.id, { title: f.title.value.trim(), message, reveal_date });
    coupleSurprises = await loadCoupleSurprises(state.couple.id);
    f.reset();
    render();
    toast("Surpresa guardada! 🤫 Abre no dia.");
  } catch { toast("Não consegui guardar."); }
}
async function handleSurpresaDel(id) {
  const ok = await confirmar("Apagar essa surpresa?", { ok: "Apagar", danger: true });
  if (!ok) return;
  try {
    await deleteCoupleSurprise(id);
    coupleSurprises = coupleSurprises.filter((s) => s.id !== id);
    render();
  } catch { toast("Não consegui apagar."); }
}

async function handleSecretMissionCreate(event) {
  event.preventDefault();
  if (!state.couple || !authUser) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const title = String(data.title || "").trim();
  if (!title) return;
  const partner = coupleMembers.find((m) => m.user_id !== authUser.id);
  try {
    await addSecretMission(state.couple.id, authUser.id, {
      title,
      kind: data.kind,
      intensity: Number(data.intensity) || 1,
      due: data.due,
      targetUser: partner?.user_id || null,
    });
    secretMissions = await loadSecretMissions(state.couple.id);
    render();
    toast("Missão secreta criada 🔥");
  } catch {
    toast("Não consegui criar. Rode a migração 29 no Supabase.");
  }
}

async function handleSecretMissionStatus(raw) {
  const [id, status] = String(raw).split(":");
  if (!id || !status || !state.couple) return;
  try {
    await setSecretMissionStatus(id, status);
    secretMissions = await loadSecretMissions(state.couple.id);
    if (status === "cumprida") {
      await ganharPontos(8, "missão secreta cumprida", "secret_mission", id);
      coupleLedger = await loadPointsLedger(state.couple.id);
    }
    render();
    toast(status === "cumprida" ? "Missão cumprida 🔥" : "Missão atualizada.");
  } catch {
    toast("Não consegui atualizar a missão.");
  }
}

async function handleSecretMissionDelete(id) {
  const ok = await confirmar("Apagar essa missão secreta?", { ok: "Apagar", danger: true });
  if (!ok) return;
  try { await deleteSecretMission(id); secretMissions = secretMissions.filter((m) => m.id !== id); render(); } catch { toast("Não consegui apagar."); }
}

async function handleDesireCreate(event) {
  event.preventDefault();
  if (!state.couple || !authUser) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const body = String(data.body || "").trim();
  if (!body) return;
  try {
    await addCoupleDesire(state.couple.id, authUser.id, {
      body,
      category: data.category,
      intensity: Number(data.intensity) || 1,
    });
    coupleDesires = await loadCoupleDesires(state.couple.id);
    render();
    toast("Desejo guardado no cofrinho 🔒");
  } catch {
    toast("Não consegui guardar. Rode a migração 29 no Supabase.");
  }
}

async function handleDesireReveal(id) {
  const d = coupleDesires.find((x) => x.id === id);
  if (!d || !authUser) return;
  try {
    await voteRevealDesire(d, authUser.id);
    coupleDesires = await loadCoupleDesires(state.couple.id);
    render();
    toast(d.reveal_requested_by && d.reveal_requested_by !== authUser.id ? "Desejo revelado 🔥" : "Pedido de revelar enviado.");
  } catch {
    toast("Não consegui revelar.");
  }
}

async function handleDesireDelete(id) {
  const ok = await confirmar("Apagar esse desejo?", { ok: "Apagar", danger: true });
  if (!ok) return;
  try { await deleteCoupleDesire(id); coupleDesires = coupleDesires.filter((d) => d.id !== id); render(); } catch { toast("Não consegui apagar."); }
}

async function handleFetishPref(raw) {
  const [tag, status] = String(raw).split(":");
  if (!tag || !status || !state.couple || !authUser) return;
  try {
    await saveFetishPref(state.couple.id, authUser.id, tag, status);
    fetishPrefs = await loadFetishPrefs(state.couple.id);
    render();
  } catch {
    toast("Não consegui salvar. Rode a migração 29 no Supabase.");
  }
}

async function handleTgEvent(kind) {
  if (!state.couple) return;
  try {
    const id = await addTelegramEvent(state.couple.id, authUser.id, kind, null);
    if (kind === "done") await ganharPontos(PONTOS.telegram, "momento no Telegram", "telegram", id || `tg:${Date.now()}`);
    coupleTgEvents = await loadTelegramEvents(state.couple.id);
    if (kind === "done") coupleLedger = await loadPointsLedger(state.couple.id);
    render();
    toast(kind === "done" ? `Concluído! +${PONTOS.telegram} 💞` : kind === "sent" ? "Marcado: enviei 📤" : "Marcado: recebi 📥");
  } catch { toast("Não consegui registrar."); }
}
async function handleTgDel(raw) {
  const [id, kind] = String(raw).split(":");
  if (!state.couple) return;
  try {
    await deleteTelegramEvent(id);
    // Se era um "concluímos" que pontuou, estorna (anti-dup por fonte).
    if (kind === "done") {
      await estornarPontos(-PONTOS.telegram, "momento do Telegram desfeito", "telegram_undo", id);
      coupleLedger = await loadPointsLedger(state.couple.id);
    }
    coupleTgEvents = coupleTgEvents.filter((e) => e.id !== id);
    render();
  } catch { toast("Não consegui apagar."); }
}
async function handleMissionClaim(raw) {
  const [key, period, bonus] = String(raw).split(":");
  if (!state.couple) return;
  try {
    await ganharPontos(Number(bonus) || 0, `missão: ${key}`, "mission", `${key}:${period}`);
    coupleLedger = await loadPointsLedger(state.couple.id);
    render();
    toast(`Missão cumprida! +${bonus} 💞`);
  } catch { toast("Não consegui resgatar a missão."); }
}
async function handleNosDeleteReward(id) {
  const ok = await confirmar("Apagar esse vale?", { ok: "Apagar", danger: true });
  if (!ok) return;
  try { await deleteCoupleReward(id); nosRewards = nosRewards.filter((r) => r.id !== id); render(); } catch { toast("Não consegui apagar."); }
}
async function handleNosClaimUsed(raw) {
  const [id, v] = String(raw).split(":");
  try { await setClaimUsed(id, v === "1"); nosClaims = await loadCoupleClaims(state.couple.id); render(); } catch { toast("Não consegui atualizar."); }
}
async function handleClaimStatus(raw) {
  const [id, status] = String(raw).split(":");
  const c = nosClaims.find((x) => x.id === id);
  if (!c || !state.couple) return;
  if (status === "recusado") {
    const ok = await confirmar("Recusar esse vale?", { sub: "Sem problema nenhum — os pontos voltam pra quem resgatou. Recusar nunca tira ponto. 💛", ok: "Recusar" });
    if (!ok) return;
  }
  if (status === "cancelado") {
    const ok = await confirmar("Cancelar esse resgate?", { sub: "Os pontos voltam pro saldo de vocês.", ok: "Cancelar resgate" });
    if (!ok) return;
  }
  try {
    await setClaimStatus(id, status);
    // Recusar/cancelar devolve os pontos (anti-dup por source: nunca devolve 2×).
    if (status === "recusado" || status === "cancelado") {
      await estornarPontos(Number(c.cost || 0), `vale ${status}`, "claim_refund", id);
      coupleLedger = await loadPointsLedger(state.couple.id);
    }
    nosClaims = await loadCoupleClaims(state.couple.id);
    render();
    toast(
      status === "cumprido" ? "Cumprido! 💞" :
      status === "aceito" ? "Aceito 👍 agora é só combinar." :
      status === "recusado" ? "Recusado — pontos devolvidos. 💛" :
      status === "cancelado" ? "Cancelado — pontos de volta." :
      "Atualizado."
    );
  } catch { toast("Não consegui atualizar."); }
}
async function handleNosDeleteClaim(id) {
  const ok = await confirmar("Apagar esse resgate? Os pontos voltam.", { ok: "Apagar", danger: true });
  if (!ok) return;
  const claim = nosClaims.find((c) => c.id === id);
  try {
    await deleteCoupleClaim(id);
    if (claim) await estornarPontos(Number(claim.cost || 0), "resgate cancelado", "claim_refund", id);
    nosClaims = nosClaims.filter((c) => c.id !== id);
    render();
  } catch { toast("Não consegui apagar."); }
}

// ---------- "Nós 🔥": loja privada de recompensas ----------
const NOS_PRESETS = [
  { title: "Vale áudio de boa noite 🎙️", kind: "fofo", cost: 10 },
  { title: "Vale chamada sem pressa 🌙", kind: "fofo", cost: 20 },
  { title: "Vale escolher o date virtual 🎬", kind: "fofo", cost: 12 },
  { title: "Vale cartinha surpresa 💌", kind: "fofo", cost: 25 },
  { title: "Vale assistir juntinhos 🍿", kind: "fofo", cost: 15 },
  { title: "Vale provocação por mensagem 😏", kind: "picante", cost: 20 },
  { title: "Vale pedido seu 🔥", kind: "picante", cost: 35 },
  { title: "Vale guardar pra quando se verem 🔒", kind: "picante", cost: 45 },
];

// Saldo e pontos vêm do EXTRATO (ledger), não de cálculo solto.
// Marco de recomeço: a maior data entre as linhas "reset". Tudo ANTES dela é
// ignorado (resíduo do bug antigo de duplicação). Saldo/acumulado contam só dali.
function nosBaselineTs() {
  let ts = 0;
  for (const l of coupleLedger) {
    if (l.source_type === "reset") {
      const t = new Date(l.created_at).getTime();
      if (t > ts) ts = t;
    }
  }
  return ts;
}
function nosLedgerValido() {
  const base = nosBaselineTs();
  return coupleLedger.filter((l) => l.source_type !== "reset" && new Date(l.created_at).getTime() > base);
}
function nosSaldo() {
  return nosLedgerValido().reduce((s, l) => s + Number(l.points || 0), 0);
}
function nosPontosAcumulados() {
  return nosLedgerValido().filter((l) => l.type === "earned").reduce((s, l) => s + Number(l.points || 0), 0);
}
function nosResumoExtrato() {
  let ganhos = 0, gastos = 0, perdas = 0, estornos = 0;
  for (const l of nosLedgerValido()) {
    const p = Number(l.points || 0);
    if (l.type === "earned") ganhos += p;
    else if (l.type === "spent") gastos += p;
    else if (l.type === "lost") perdas += p;
    else if (l.type === "refunded") estornos += p;
  }
  return { ganhos, gastos, perdas, estornos };
}

// Valor por ação (tabela do brief, versão "lenta").
const PONTOS = { ep: 5, memoria: 3, cartinha: 6, quiz: 2, checkin: 1, checkinBonus: 2, telegram: 4, desafio: { 1: 5, 2: 8, 3: 12, 4: 18, 5: 25, 6: 35 } };

async function lancarPontos(entry) {
  if (!state.couple || !cloudOn()) return;
  try {
    await addPointsLedger(state.couple.id, authUser.id, entry);
    if (casalPrivadoOn() && nosFor === state.couple.id) coupleLedger = await loadPointsLedger(state.couple.id);
  } catch { /* ignore */ }
}
function ganharPontos(points, reason, sourceType, sourceId) {
  return lancarPontos({ points: Math.abs(points), type: "earned", reason, sourceType, sourceId });
}
function gastarPontos(points, reason, sourceType, sourceId) {
  return lancarPontos({ points: -Math.abs(points), type: "spent", reason, sourceType, sourceId });
}
function estornarPontos(points, reason, sourceType, sourceId) {
  return lancarPontos({ points, type: "refunded", reason, sourceType, sourceId });
}

// ---------- Progressão por níveis (Nós 2.0 Fase 1) ----------
const ADULTO18_KEY = "dorama-club-nos-18";
// Níveis: req = pontos ACUMULADOS pra liberar a categoria. 1 já vem liberado.
const NIVEIS = [
  { n: 1, nome: "Safadinho leve", emoji: "😏", req: 0 },
  { n: 2, nome: "Provocante", emoji: "😈", req: 200 },
  { n: 3, nome: "Sensual", emoji: "🔥", req: 350 },
  { n: 4, nome: "Íntimo", emoji: "❤️‍🔥", req: 550 },
  { n: 5, nome: "Picante", emoji: "🌶️", req: 800 },
  { n: 6, nome: "Ultra privado", emoji: "🔒", req: 1200 },
];
const NIVEL_LABEL = NIVEIS.reduce((a, x) => ((a[x.n] = `${x.emoji} ${x.nome}`), a), {});
// Catálogo de desafios prontos. custo = pontos pra DESBLOQUEAR (0 = livre, nível 1).
// Desafios íntimos (4-6) só têm rótulo + "conforme combinado, pelo Telegram" — sem mídia no app.
const DESAFIOS_CAT = [
  { key: "selfie_charme", nivel: 1, nome: "Selfie fazendo charme", desc: "Manda uma selfie fazendo charme.", custo: 0 },
  { key: "audio_saudade", nivel: 1, nome: "Áudio de saudade", desc: "Áudio dizendo que tá com saudade de um jeito provocante.", custo: 0 },
  { key: "frase_safada", nivel: 1, nome: "Frase safadinha leve", desc: "Manda uma frase safadinha leve.", custo: 0 },
  { key: "foto_pijama", nivel: 1, nome: "Foto de pijama", desc: "Foto de pijama, do jeitinho que a pessoa gosta.", custo: 0 },
  { key: "foto_provocante", nivel: 2, nome: "Foto provocante leve", desc: "Foto provocante leve (no Telegram).", custo: 80 },
  { key: "audio_provocante", nivel: 2, nome: "Áudio provocante curto", desc: "Áudio curto com tom provocante.", custo: 90 },
  { key: "duplo_sentido", nivel: 2, nome: "Mensagem de duplo sentido", desc: "Manda uma mensagem com duplo sentido.", custo: 60 },
  { key: "chamada_flerte", nivel: 2, nome: "Chamada com clima de flerte", desc: "Chamada com clima de flerte.", custo: 120 },
  { key: "foto_sensual", nivel: 3, nome: "Foto sensual combinada", desc: "Foto sensual previamente combinada (no Telegram).", custo: 180 },
  { key: "audio_intimo", nivel: 3, nome: "Áudio íntimo", desc: "Áudio íntimo, dentro do limite combinado.", custo: 160 },
  { key: "chamada_quente", nivel: 3, nome: "Chamada com clima quente", desc: "Chamada com clima mais quente.", custo: 250 },
  { key: "foto_intima_leve", nivel: 4, nome: "Foto íntima leve", desc: "Foto íntima leve pelo Telegram, conforme combinado pelo casal.", custo: 350 },
  { key: "video_curto", nivel: 4, nome: "Vídeo curto sensual", desc: "Vídeo curto sensual pelo Telegram, conforme combinado pelo casal.", custo: 450 },
  { key: "pedido_intimo", nivel: 4, nome: "Pedido íntimo combinado", desc: "Cumprir um pedido íntimo previamente combinado, dentro dos limites.", custo: 500 },
  { key: "foto_explicita", nivel: 5, nome: "Foto íntima (combinada)", desc: "Envio de foto íntima específica pelo Telegram, conforme combinado pelo casal.", custo: 650 },
  { key: "video_intimo", nivel: 5, nome: "Vídeo íntimo (combinado)", desc: "Envio de vídeo íntimo pelo Telegram, conforme combinado pelo casal.", custo: 750 },
  { key: "pedido_adulto", nivel: 5, nome: "Pedido adulto personalizado", desc: "Pedido adulto personalizado, dentro dos limites aceitos pelos dois.", custo: 800 },
  { key: "voce_escolhe", nivel: 6, nome: "Vale “você escolhe”", desc: "Conteúdo adulto específico previamente combinado, dentro dos limites. Envio fora do app.", custo: 1200 },
  { key: "ultra_personalizado", nivel: 6, nome: "Desafio ultra privado", desc: "Desafio ultra privado personalizado, conforme combinado pelo casal. Envio fora do app.", custo: 1500 },
];

// Cartas de VERDADE (perguntas), por nível de picância (1 leve → 6 quente).
const VERDADES_CAT = [
  { nivel: 1, texto: "Qual foi a primeira coisa que te atraiu em mim?" },
  { nivel: 1, texto: "Qual momento nosso você mais gosta de relembrar?" },
  { nivel: 1, texto: "O que eu faço que te deixa bobo(a) sem eu perceber?" },
  { nivel: 1, texto: "Qual apelido secreto você me daria hoje?" },
  { nivel: 2, texto: "Onde você mais gosta de ganhar um beijo?" },
  { nivel: 2, texto: "Qual roupa minha você mais gosta de ver em mim?" },
  { nivel: 2, texto: "Qual foi a hora que você mais quis me agarrar e se segurou?" },
  { nivel: 2, texto: "Prefere ser provocado(a) de manhã ou de noite?" },
  { nivel: 3, texto: "Uma fantasia levinha que você tem comigo?" },
  { nivel: 3, texto: "Qual parte do meu corpo é sua fraqueza?" },
  { nivel: 3, texto: "O que você faria comigo se a gente estivesse sozinho agora?" },
  { nivel: 4, texto: "Descreve, sem vergonha, algo que você quer muito fazer comigo." },
  { nivel: 4, texto: "Qual foi a vez mais quente que a gente teve? Conta com detalhes." },
  { nivel: 5, texto: "Um desejo mais ousado que você nunca teve coragem de pedir?" },
  { nivel: 5, texto: "O que você quer que eu faça na nossa próxima vez?" },
  { nivel: 6, texto: "Sua fantasia mais secreta comigo — sem filtro." },
];

function adulto18Ok() {
  try { return localStorage.getItem(ADULTO18_KEY) === "1"; } catch { return false; }
}
function prefMax(uid) {
  const p = couplePrefs.find((x) => x.user_id === uid);
  return p ? Number(p.max_intensity) || 1 : 0; // 0 = ainda não definiu
}
// Consentimento: o MENOR limite dos dois (1–6). Sem definir = 1 (leve).
function intensidadePermitida() {
  const eu = prefMax(authUser?.id);
  const parceira = coupleMembers.find((m) => m.user_id !== authUser?.id);
  const dela = parceira ? prefMax(parceira.user_id) : 0;
  return Math.min(eu || 1, dela || 1);
}
function nivelLiberadoPorPontos(n) {
  return nosPontosAcumulados() >= (NIVEIS.find((x) => x.n === n)?.req || 0);
}
function desafioUnlocked(key) {
  return coupleLedger.some((l) => l.source_type === "unlock" && l.source_id === key);
}
// Pode ATUAR no desafio agora? (categoria liberada por pontos + consentimento + 18+ p/ 4-6 + desbloqueado se pago)
function desafioDisponivel(d) {
  if (d.nivel > intensidadePermitidaHoje()) return false; // respeita o limite de HOJE
  if (!nivelLiberadoPorPontos(d.nivel)) return false;
  if (d.nivel >= 4 && !adulto18Ok()) return false;
  return d.custo === 0 || desafioUnlocked(d.key);
}
function desafioDoDia() {
  const pool = DESAFIOS_CAT.filter(desafioDisponivel);
  if (!pool.length) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  const seed = [...hoje].reduce((a, c) => a + c.charCodeAt(0), 0) + desafioIdx;
  return pool[seed % pool.length];
}

// ---------- Clima do dia + limite do dia (Fase 2) ----------
const MOODS_DIA = [
  { key: "carinho", e: "🥰", l: "Quero carinho" },
  { key: "conversar", e: "💬", l: "Quero conversar" },
  { key: "brincar", e: "😜", l: "Quero brincar" },
  { key: "flertar", e: "😏", l: "Quero flertar" },
  { key: "ousado", e: "🔥", l: "Quero algo ousado" },
  { key: "chamada", e: "📞", l: "Quero chamada" },
  { key: "saudade", e: "🥺", l: "Matando saudade" },
  { key: "cansado", e: "😴", l: "Cansado(a), algo leve" },
  { key: "surpresa", e: "🎁", l: "Quero surpresa" },
];
const SECRET_MISSION_KINDS = [
  ["mensagem", "Mensagem"],
  ["audio", "Áudio"],
  ["chamada", "Chamada"],
  ["quando_ver", "Quando se ver"],
  ["fetiche", "Fetiche combinado"],
  ["surpresa", "Surpresa"],
];
const SECRET_DUES = [
  ["hoje", "Hoje"],
  ["semana", "Essa semana"],
  ["chamada", "Próxima chamada"],
  ["presencial", "Quando se ver"],
];
const FETISH_TAGS = [
  ["provocacao", "Provocação"],
  ["dominacao_leve", "Dominação leve"],
  ["submissao_leve", "Submissão leve"],
  ["oral", "Oral"],
  ["anal", "Anal"],
  ["fantasia", "Fantasia"],
  ["chamada", "Brincadeira por chamada"],
  ["presencial", "Quando se ver"],
];
const FETISH_STATUSES = [
  ["curto", "Curto"],
  ["testar", "Quero testar"],
  ["talvez", "Talvez"],
  ["nao", "Não rola"],
];
function pairLabel(list, key) {
  return list.find(([k]) => k === key)?.[1] || key;
}
function meuCheckin() { return coupleCheckins.find((c) => c.user_id === authUser?.id); }
function checkinDe(uid) { return coupleCheckins.find((c) => c.user_id === uid); }
// Limite de HOJE: se a pessoa marcou um limite do dia, vale ele; senão, o fixo.
function limiteDeHoje(uid) {
  const ci = checkinDe(uid);
  if (ci && ci.day_limit) return Number(ci.day_limit);
  return prefMax(uid) || 1;
}
function intensidadePermitidaHoje() {
  const eu = limiteDeHoje(authUser?.id);
  const parceira = coupleMembers.find((m) => m.user_id !== authUser?.id);
  const dela = parceira ? limiteDeHoje(parceira.user_id) : 1;
  return Math.min(eu, dela);
}
function nosPinSalvo() {
  try { return localStorage.getItem(NOS_PIN_KEY) || ""; } catch { return ""; }
}
// Continua destravado por 20 min após digitar o PIN (sobrevive ao refresh).
function nosUnlockValido() {
  try {
    const ts = Number(localStorage.getItem(NOS_UNLOCK_KEY) || 0);
    return ts > 0 && Date.now() - ts < NOS_UNLOCK_MS;
  } catch { return false; }
}
function marcarNosUnlock() {
  try { localStorage.setItem(NOS_UNLOCK_KEY, String(Date.now())); } catch { /* ignore */ }
}
function nomeMembro(uid) {
  if (uid === authUser?.id) return "você";
  const m = coupleMembers.find((x) => x.user_id === uid);
  return (m?.name || m?.nickname || "sua pessoa").split(" ")[0];
}

async function loadNosData() {
  if (!state.couple || !casalPrivadoOn()) return;
  try {
    const [r, c, p, ch, led, ci, su, tg] = await Promise.all([
      loadCoupleRewards(state.couple.id),
      loadCoupleClaims(state.couple.id),
      loadCouplePrefs(state.couple.id),
      loadCoupleChallenges(state.couple.id),
      loadPointsLedger(state.couple.id),
      loadCoupleCheckins(state.couple.id, new Date().toISOString().slice(0, 10)),
      loadCoupleSurprises(state.couple.id),
      loadTelegramEvents(state.couple.id),
    ]);
    const extras = await Promise.all([
      loadSecretMissions(state.couple.id),
      loadCoupleDesires(state.couple.id),
      loadFetishPrefs(state.couple.id),
    ]).catch(() => null);
    nosRewards = r;
    nosClaims = c;
    couplePrefs = p;
    coupleChallenges = ch;
    coupleLedger = led;
    coupleCheckins = ci;
    coupleSurprises = su;
    coupleTgEvents = tg;
    secretMissions = extras ? extras[0] : [];
    coupleDesires = extras ? extras[1] : [];
    fetishPrefs = extras ? extras[2] : [];
    nosExtrasReady = Boolean(extras);
  } catch {
    nosRewards = []; nosClaims = []; couplePrefs = []; coupleChallenges = []; coupleLedger = []; coupleCheckins = []; coupleSurprises = []; coupleTgEvents = [];
    secretMissions = []; coupleDesires = []; fetishPrefs = []; nosExtrasReady = false;
  }
  // Recomeço único do zero: o extrato herdou lançamentos fantasma do bug antigo
  // de duplicação. Marca UMA linha de baseline (source fixo = anti-dup não repete);
  // saldo e acumulado passam a contar só do baseline pra frente (0/0 limpo).
  try {
    const jaResetou = coupleLedger.some((l) => l.source_type === "reset" && l.source_id === "baseline-1");
    if (!jaResetou) {
      await lancarPontos({ points: 0, type: "adjust", reason: "recomeço do zero (limpeza do bug antigo)", sourceType: "reset", sourceId: "baseline-1" });
      coupleLedger = await loadPointsLedger(state.couple.id);
    }
  } catch { /* ignore */ }
  nosFor = state.couple.id;
  render();
}

function nosLockTemplate() {
  const temPin = Boolean(nosPinSalvo());
  return `
    <div class="section-title"><h2>🔥 Nós</h2></div>
    <section class="nos-lock">
      <div class="nos-lock-emoji">🔒</div>
      <h3>${temPin ? "Cantinho privado de vocês" : "Criem um PIN pra trancar"}</h3>
      <p class="muted">${temPin ? "Digite o PIN pra abrir." : "Escolham um PIN curto. Só vocês dois entram aqui."}</p>
      <form id="${temPin ? "nos-enterpin-form" : "nos-setpin-form"}" class="nos-pin-form">
        <input name="pin" type="password" inputmode="numeric" placeholder="••••" maxlength="8" autocomplete="off" required />
        <button class="btn" type="submit">${temPin ? "Abrir 🔥" : "Criar PIN"}</button>
      </form>
    </section>`;
}

function nosRewardCard(r) {
  return `
    <article class="nos-card ${r.kind === "picante" ? "picante" : "fofo"}">
      <span class="nos-kind">${r.kind === "picante" ? "🔥 picante" : "💕 fofo"}</span>
      <strong>${esc(r.title)}</strong>
      <div class="nos-card-foot">
        <span class="nos-cost">${r.cost} pts</span>
        <div class="mini-actions">
          <button data-nos-claim="${r.id}">Resgatar</button>
          <button data-nos-del-reward="${r.id}">${icon("trash")}</button>
        </div>
      </div>
    </article>`;
}

// Estados do resgate (Fase 3): aceite antes de cumprir; recusar/cancelar devolve pontos.
const CLAIM_STATUS = {
  solicitado: { label: "⏳ aguardando", cls: "wait" },
  aceito: { label: "👍 aceito", cls: "ok" },
  cumprido: { label: "✓ cumprido 💞", cls: "done" },
  recusado: { label: "✋ recusado (pontos voltaram)", cls: "off" },
  cancelado: { label: "⤺ cancelado (pontos voltaram)", cls: "off" },
};
function claimAcoesHtml(c, st) {
  const meu = c.claimed_by === authUser?.id;
  const del = `<button data-nos-del-claim="${c.id}">${icon("trash")}</button>`;
  if (st === "cumprido") return `<button data-claim-status="${c.id}:aceito">Reabrir</button>${del}`;
  if (st === "recusado" || st === "cancelado") return del;
  if (meu) {
    // Quem resgatou só pode cancelar (devolve pontos), não pode "se cumprir".
    return `<button data-claim-status="${c.id}:cancelado">Cancelar</button>${del}`;
  }
  // A pessoa que vai cumprir aceita / cumpre / recusa.
  let b = "";
  if (st === "solicitado") b += `<button class="primary" data-claim-status="${c.id}:aceito">Aceitar</button>`;
  b += `<button class="primary" data-claim-status="${c.id}:cumprido">Cumpri 💞</button>`;
  b += `<button data-claim-status="${c.id}:recusado">Recusar</button>`;
  return b;
}
function nosClaimCard(c) {
  const st = c.status || (c.used ? "cumprido" : "solicitado");
  const info = CLAIM_STATUS[st] || CLAIM_STATUS.solicitado;
  const fechado = st === "cumprido" || st === "recusado" || st === "cancelado";
  return `
    <article class="nos-claim ${fechado ? "used" : ""} st-${info.cls}">
      <div>
        <strong>${esc(c.title || "Vale")}</strong>
        <small>${esc(nomeMembro(c.claimed_by))} resgatou · ${esc(timeAgo(c.created_at))}</small>
        <span class="claim-status ${info.cls}">${info.label}</span>
      </div>
      <div class="mini-actions">${claimAcoesHtml(c, st)}</div>
    </article>`;
}

function extratoModalTemplate() {
  if (!extratoOpen) return "";
  const ext = nosResumoExtrato();
  const linhas = nosLedgerValido().slice(0, 50).map((l) => `
    <div class="ext-line"><span class="${Number(l.points) >= 0 ? "pos" : "neg"}">${Number(l.points) > 0 ? "+" : ""}${l.points}</span><small>${esc(l.reason || l.type)} · ${esc(timeAgo(l.created_at))}</small></div>`).join("") || `<div class="empty">Sem lançamentos ainda. Comecem a ganhar pontos! 💞</div>`;
  return `
    <div class="modal ui-modal">
      <section class="modal-card ui-card" style="width:min(440px,100%);max-height:82vh;overflow:auto">
        <div class="modal-head"><div><h2 style="margin:0">📜 Extrato de pontos</h2><p class="muted" style="margin:4px 0 0">Ganhos +${ext.ganhos} · Gastos ${ext.gastos} · Estornos ${ext.estornos >= 0 ? "+" : ""}${ext.estornos}</p></div><button class="close" type="button" data-extrato-close>×</button></div>
        <div class="nos-extrato" style="border:0;background:transparent;padding:0;margin:0">${linhas}</div>
      </section>
    </div>`;
}

// Clima + limites num card só (antes ficavam duplicados em dois cards).
function nosClimaHtml() {
  const meu = meuCheckin();
  const parceira = coupleMembers.find((m) => m.user_id !== authUser?.id);
  const dela = parceira ? checkinDe(parceira.user_id) : null;
  const nomeP = parceira ? (parceira.name || parceira.nickname || "sua pessoa").split(" ")[0] : "sua pessoa";
  const moodLabel = (k) => { const m = MOODS_DIA.find((x) => x.key === k); return m ? `${m.e} ${m.l}` : "—"; };
  const limiteHoje = limiteDeHoje(authUser?.id);
  const fixo = prefMax(authUser?.id);
  const adulto = adulto18Ok();
  const niveisVis = NIVEIS.filter((x) => x.n <= 3 || adulto);
  const permitida = intensidadePermitida();
  const nomeLimite = (n) => (NIVEIS.find((x) => x.n === n) || {}).nome || "";
  return `
    <section class="clima-card">
      <div class="clima-titulo">🌡️ Como vocês estão hoje</div>
      <div class="clima-moods">
        ${MOODS_DIA.map((m) => `<button class="clima-mood ${meu?.mood === m.key ? "on" : ""}" type="button" data-checkin="${m.key}" title="${esc(m.l)}" aria-label="${esc(m.l)}">${m.e}</button>`).join("")}
      </div>
      <div class="clima-duo">
        <span><b>Você</b> ${meu ? esc(moodLabel(meu.mood)) : "—"}</span>
        <span><b>${esc(nomeP)}</b> ${dela ? esc(moodLabel(dela.mood)) : "esperando…"}</span>
      </div>

      ${(() => {
        const maxN = niveisVis[niveisVis.length - 1].n;
        const val = limiteHoje || 1;
        const lv = NIVEIS.find((x) => x.n === val) || NIVEIS[0];
        return `
      <div class="clima-heat-wrap">
        <span class="clima-heat-cap">Hoje eu topo até <b class="heat-cap-val">${lv.emoji} ${esc(lv.nome)}</b></span>
        <input class="heat-slider" type="range" min="1" max="${maxN}" step="1" value="${val}" data-day-limit-range aria-label="Limite de hoje" />
      </div>`;
      })()}
      ${fixo
        ? `<div class="clima-combina">💞 Vocês combinam até <strong>${esc(nomeLimite(permitida))}</strong></div>`
        : `<div class="clima-combina warn">Defina seu limite no ⚙️ abaixo pra abrir o baralho.</div>`}

      <details class="clima-fixo">
        <summary>⚙️ Limite fixo & conteúdo adulto</summary>
        <p class="muted" style="margin:8px 0;font-size:.82rem">O limite fixo é o seu padrão. O “hoje eu topo até” vale só pra hoje.</p>
        ${(() => {
          const maxN = niveisVis[niveisVis.length - 1].n;
          const val = fixo || 1;
          const lv = NIVEIS.find((x) => x.n === val) || NIVEIS[0];
          return `<span class="clima-heat-cap">Meu limite fixo: <b class="fix-cap-val">${lv.emoji} ${esc(lv.nome)}</b></span>
          <input class="heat-slider" type="range" min="1" max="${maxN}" step="1" value="${val}" data-fix-range aria-label="Limite fixo" />`;
        })()}
        ${!adulto
          ? `<button class="btn ghost" type="button" data-adulto18 style="margin-top:10px">🔞 Liberar conteúdo adulto (18+)</button>`
          : `<small class="muted" style="display:block;margin-top:10px">🔞 Adulto liberado neste aparelho. <button class="linkish" type="button" data-adulto18-off>esconder</button></small>`}
      </details>
    </section>`;
}

// Desafios recentes, agrupados por desafio+dia (enviado + recebido = concluido).
function nosFeitosHtml() {
  if (!coupleChallenges.length) return "";
  const grupos = [];
  const idx = new Map();
  for (const c of coupleChallenges) {
    const dia = isoDia(c.created_at);
    const k = `${c.challenge_key}:${dia}`;
    if (!idx.has(k)) { idx.set(k, { key: c.challenge_key, dia, intensity: c.intensity || 1, created_at: c.created_at, ids: [], users: new Set(), logs: [] }); grupos.push(idx.get(k)); }
    const g = idx.get(k); g.ids.push(c.id); g.users.add(c.done_by); g.logs.push(c);
  }
  const itens = grupos.slice(0, 5).map((g) => {
    const cat = DESAFIOS_CAT.find((d) => d.key === g.key);
    const nome = cat ? cat.nome : (g.key || "desafio");
    const ambos = coupleMembers.length < 2 ? g.users.size >= 1 : coupleMembers.every((m) => g.users.has(m.user_id));
    const logs = g.logs.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const enviou = logs[0]?.done_by;
    const recebeu = logs.find((l) => l.done_by !== enviou)?.done_by;
    const parceiro = coupleMembers.find((m) => m.user_id !== enviou)?.user_id;
    const fluxo = ambos
      ? `${esc(nomeMembro(enviou))} desafiou → ${esc(nomeMembro(recebeu || parceiro))} recebeu`
      : `${esc(nomeMembro(enviou))} desafiou → falta ${esc(nomeMembro(parceiro || ""))} receber`;
    const meusFb = meuFeedbackDesafio(g.key, g.dia);
    const fbs = feedbacksDesafio(g.key, g.dia);
    const fbTxt = fbs.length ? `<small class="feito-feedback">${fbs.map((f) => `${esc(nomeMembro(String(f.source_id).split(":")[2]))}: ${esc(feedbackLabel(String(f.source_id).split(":")[3] || ""))}`).join(" · ")}</small>` : "";
    const fbBtns = ambos && !meusFb
      ? `<div class="feito-feedback-actions">${CHALLENGE_FEEDBACKS.map(([v, label]) => `<button type="button" data-challenge-feedback="${g.key}:${g.dia}:${v}">${esc(label)}</button>`).join("")}</div>`
      : "";
    return `<div class="feito-item"><div><small><strong>${esc(nome)}</strong> · ${fluxo} · ${esc(timeAgo(g.created_at))}</small>${fbTxt}${fbBtns}</div><button class="recado-mini" type="button" data-undo-challenge="${g.ids.join(",")}:${g.intensity}:${g.key}:${g.dia}">Desfazer</button></div>`;
  }).join("");
  return `<section class="nos-feitos"><span class="muted" style="font-weight:800;font-size:.78rem">Desafios recentes</span>${itens}</section>`;
}

// ---------- Fase 4: missões (do dia/semana) ----------
function isoDia(d) { return new Date(d).toISOString().slice(0, 10); }
function hojeISO() { return new Date().toISOString().slice(0, 10); }
function semanaDe(d) {
  const dt = new Date(d);
  const inicio = new Date(dt.getFullYear(), 0, 1);
  const semana = Math.ceil(((dt - inicio) / 86400000 + inicio.getDay() + 1) / 7);
  return `${dt.getFullYear()}-W${semana}`;
}
// quantas ações de um tipo aconteceram hoje / nesta semana (pelo extrato)
function ledgerHoje(type) {
  const t = hojeISO();
  return coupleLedger.filter((l) => l.source_type === type && isoDia(l.created_at) === t).length;
}
function ledgerSemana(type) {
  const w = semanaDe(new Date());
  return coupleLedger.filter((l) => l.source_type === type && semanaDe(l.created_at) === w).length;
}
const MISSOES_DIA = [
  { key: "checkin", emoji: "🌤️", nome: "Clima do dia", desc: "Marque como você está hoje", bonus: 2, feita: () => ledgerHoje("checkin") >= 1 },
  { key: "carinho", emoji: "💌", nome: "Mande um carinho", desc: "Uma cartinha ou recadinho hoje", bonus: 3, feita: () => ledgerHoje("letter") >= 1 },
  { key: "ep", emoji: "🎬", nome: "Um episódio juntos", desc: "Avancem um episódio hoje", bonus: 3, feita: () => ledgerHoje("ep") >= 1 },
];
const MISSOES_SEMANA = [
  { key: "desafio", emoji: "🔥", nome: "Um desafio", desc: "Enviem e recebam um desafio nesta semana", bonus: 6, feita: () => ledgerSemana("challenge") >= 1 },
  { key: "memoria", emoji: "📸", nome: "Guardem uma memória", desc: "Uma página no diário", bonus: 4, feita: () => ledgerSemana("memory") >= 1 },
  { key: "quiz", emoji: "❓", nome: "Quiz do casal", desc: "Respondam o quiz da semana", bonus: 4, feita: () => ledgerSemana("quiz") >= 1 },
];
function missaoFeitaResgatada(key, periodo) {
  return coupleLedger.some((l) => l.source_type === "mission" && l.source_id === `${key}:${periodo}`);
}
function missaoCard(m, periodo) {
  const feita = m.feita();
  const resgatada = missaoFeitaResgatada(m.key, periodo);
  let acao;
  if (resgatada) acao = `<span class="miss-done">✓ +${m.bonus}</span>`;
  else if (feita) acao = `<button class="primary" data-mission="${m.key}:${periodo}:${m.bonus}">Resgatar +${m.bonus}</button>`;
  else acao = `<span class="miss-pts">+${m.bonus} pts</span>`;
  return `
    <article class="missao ${feita ? "feita" : ""} ${resgatada ? "claimed" : ""}">
      <span class="miss-emoji">${feita ? "✅" : m.emoji}</span>
      <div class="miss-txt"><strong>${esc(m.nome)}</strong><small>${esc(m.desc)}</small></div>
      <div class="miss-acao">${acao}</div>
    </article>`;
}
// Missões viram um "tile" compacto que abre um popup (ocupavam muito espaço).
function nosMissoesResumoHtml() {
  const hoje = hojeISO();
  const wk = semanaDe(new Date());
  const all = [...MISSOES_DIA.map((m) => ({ m, p: hoje })), ...MISSOES_SEMANA.map((m) => ({ m, p: wk }))];
  const feitas = all.filter(({ m }) => m.feita()).length;
  const resgatar = all.filter(({ m, p }) => m.feita() && !missaoFeitaResgatada(m.key, p)).length;
  return `
    <button class="nos-tile" type="button" data-missoes-open>
      <span class="tile-ico">🎯</span>
      <span class="tile-main"><strong>Missões</strong><small>${feitas}/${all.length} cumpridas${resgatar ? ` · ${resgatar} pra resgatar 🎁` : ""}</small></span>
      ${resgatar ? `<span class="tile-badge">${resgatar}</span>` : `<span class="tile-go">›</span>`}
    </button>`;
}
function missoesModalTemplate() {
  if (!missoesOpen) return "";
  const hoje = hojeISO();
  const wk = semanaDe(new Date());
  return `
    <div class="modal ui-modal">
      <section class="modal-card ui-card" style="width:min(440px,100%);max-height:82vh;overflow:auto">
        <div class="modal-head"><div><h2 style="margin:0">🎯 Missões</h2><p class="muted" style="margin:4px 0 0">Cumpram e resguem o bônus 🎁</p></div><button class="close" type="button" data-missoes-close>×</button></div>
        <div class="missoes">
          <div class="miss-grupo"><span class="miss-tag">Hoje</span>${MISSOES_DIA.map((m) => missaoCard(m, hoje)).join("")}</div>
          <div class="miss-grupo"><span class="miss-tag">Essa semana</span>${MISSOES_SEMANA.map((m) => missaoCard(m, wk)).join("")}</div>
        </div>
      </section>
    </div>`;
}

// Topo do "Nós": saldo + nível + barra de progresso (vira o cabeçalho do dashboard).
function nosHeroHtml() {
  const saldo = nosSaldo();
  const acumulados = nosPontosAcumulados();
  const carregando = nosFor !== state.couple.id;
  const atual = [...NIVEIS].reverse().find((x) => acumulados >= x.req) || NIVEIS[0];
  const proximo = NIVEIS.find((x) => x.req > acumulados);
  const pct = proximo ? Math.min(100, Math.round((acumulados / proximo.req) * 100)) : 100;
  return `
    <section class="nos-hero">
      <div class="nos-hero-top">
        <div class="nh-vibe">
          <span class="nh-emoji">${atual.emoji}</span>
          <div class="nh-vibe-txt"><strong>${esc(atual.nome)}</strong><span>Nível ${atual.n} de vocês</span></div>
        </div>
      </div>
      <div class="nos-hero-bar"><i style="width:${pct}%"></i></div>
      <small class="nos-hero-sub">${proximo ? `a caminho de ${proximo.emoji} ${esc(proximo.nome)}` : `nível máximo 👑`}</small>
    </section>`;
}

// Loja de vales — o destaque do "Nós".
function nosValesHtml() {
  const fofos = nosRewards.filter((r) => r.kind !== "picante");
  const picantes = nosRewards.filter((r) => r.kind === "picante");
  const claimsHtml = nosClaims.length ? nosClaims.map(nosClaimCard).join("") : "";
  return `
    <details class="nos-panel">
      <summary><span>🎟️ Loja de vales</span><small>${nosRewards.length} criados · ${nosClaims.length} resgatados</small></summary>
    <details class="nos-criar">
      <summary>＋ Criar um vale</summary>
      <form id="nos-create-form" class="form-grid" style="margin-top:12px">
        <div class="field full"><label>O que vale?</label><input name="title" placeholder="Vale chamada, mensagem, pedido combinado…" required /></div>
        <div class="field"><label>Categoria</label><select name="kind"><option value="fofo">💕 Fofo</option><option value="picante">🔥 Picante</option></select></div>
        <div class="field"><label>Custo (pontos)</label><input name="cost" type="number" min="1" value="15" /></div>
        <div class="actions field full"><button class="btn" type="submit">${icon("add")} Criar vale</button></div>
      </form>
      <div class="nos-presets">${NOS_PRESETS.map((p, i) => `<button class="nos-preset ${p.kind}" type="button" data-nos-preset="${i}">${esc(p.title)} · ${p.cost}pts</button>`).join("")}</div>
    </details>

    <div class="vales-head">💕 Fofos</div>
    ${fofos.length ? `<section class="nos-grid">${fofos.map(nosRewardCard).join("")}</section>` : `<div class="empty">Criem o primeiro vale fofo 💕</div>`}
    <div class="vales-head">🔥 Picantes</div>
    ${picantes.length ? `<section class="nos-grid">${picantes.map(nosRewardCard).join("")}</section>` : `<div class="empty">Criem o primeiro vale picante 😏</div>`}
    ${claimsHtml ? `<div class="vales-head">📋 Resgatados</div><section class="nos-claims">${claimsHtml}</section>` : ""}
    </details>`;
}

// ---------- Fase 4: conquistas (derivadas do extrato) ----------
const REFUND_OF = { memory: "memory_refund", letter: "letter_refund", challenge: "challenge_undo" };
function acaoCount(type) {
  const pos = coupleLedger.filter((l) => l.source_type === type).length;
  const ref = REFUND_OF[type] ? coupleLedger.filter((l) => l.source_type === REFUND_OF[type]).length : 0;
  return Math.max(0, pos - ref);
}
function nosConquistas() {
  const eps = acaoCount("ep");
  const mems = acaoCount("memory");
  const cartas = acaoCount("letter");
  const desafios = acaoCount("challenge");
  const checkins = coupleLedger.filter((l) => l.source_type === "checkin").length;
  const sync = coupleLedger.filter((l) => l.source_type === "checkin_bonus").length;
  const valesCumpridos = nosClaims.filter((c) => (c.status || (c.used ? "cumprido" : "")) === "cumprido").length;
  const acc = nosPontosAcumulados();
  const missoesCriadas = secretMissions.length;
  const missoesCumpridas = secretMissions.filter((m) => m.status === "cumprida").length;
  const desejosRevelados = coupleDesires.filter((d) => d.revealed || desireAutoRevealIds().has(d.id)).length;
  const desejosCombinando = desireMatchGroups().length;
  const tagsEmComum = commonFetishTags().length;
  const telegramDone = coupleTgEvents.filter((e) => e.kind === "done").length;
  return [
    { emoji: "🎬", nome: "Primeira maratona", desc: "1º episódio assistido junto", cur: eps, alvo: 1 },
    { emoji: "🍿", nome: "Maratonistas", desc: "10 episódios juntos", cur: eps, alvo: 10 },
    { emoji: "📸", nome: "Primeira memória", desc: "1ª página no diário", cur: mems, alvo: 1 },
    { emoji: "📔", nome: "Diário cheio", desc: "10 memórias guardadas", cur: mems, alvo: 10 },
    { emoji: "💌", nome: "Primeira cartinha", desc: "1ª cartinha ou recadinho", cur: cartas, alvo: 1 },
    { emoji: "✍️", nome: "Cartas de amor", desc: "5 cartinhas", cur: cartas, alvo: 5 },
    { emoji: "😏", nome: "Primeiro desafio", desc: "1º desafio concluído", cur: desafios, alvo: 1 },
    { emoji: "🔥", nome: "Aventureiros", desc: "10 desafios", cur: desafios, alvo: 10 },
    { emoji: "🌤️", nome: "Clima em dia", desc: "1º check-in do clima", cur: checkins, alvo: 1 },
    { emoji: "💞", nome: "Sincronia", desc: "os dois no mesmo dia", cur: sync, alvo: 1 },
    { emoji: "🎁", nome: "Vale cumprido", desc: "1 vale realizado", cur: valesCumpridos, alvo: 1 },
    { emoji: "🔥", nome: "Primeira missão", desc: "1 missão secreta criada", cur: missoesCriadas, alvo: 1 },
    { emoji: "😈", nome: "Missão dada", desc: "3 missões concluídas", cur: missoesCumpridas, alvo: 3 },
    { emoji: "🔓", nome: "Segredo aberto", desc: "1 desejo revelado", cur: desejosRevelados, alvo: 1 },
    { emoji: "💘", nome: "Mesma vontade", desc: "1 match no cofrinho", cur: desejosCombinando, alvo: 1 },
    { emoji: "🧭", nome: "Mapa do tesão", desc: "3 tags em comum", cur: tagsEmComum, alvo: 3 },
    { emoji: "✈️", nome: "Faísca à distância", desc: "5 registros concluídos no Telegram", cur: telegramDone, alvo: 5 },
    { emoji: "⭐", nome: "100 pontos", desc: "100 pontos acumulados", cur: acc, alvo: 100 },
    { emoji: "🏆", nome: "500 pontos", desc: "500 pontos acumulados", cur: acc, alvo: 500 },
    { emoji: "👑", nome: "Lendários", desc: "1000 pontos acumulados", cur: acc, alvo: 1000 },
  ];
}
// ---------- Fase 4: surpresas programadas (revela em data) ----------
function diasAteData(dateStr) {
  const alvo = new Date(`${dateStr}T00:00:00`);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / 86400000);
}
function surpresaCard(s) {
  const aberta = diasAteData(s.reveal_date) <= 0;
  const dias = diasAteData(s.reveal_date);
  return `
    <article class="surpresa ${aberta ? "aberta" : "fechada"}">
      <div class="surp-txt">
        <span class="surp-emoji">${aberta ? "💝" : "🎁"}</span>
        <strong>${esc(s.title || (aberta ? "Surpresa" : "Surpresa guardada"))}</strong>
        ${aberta
          ? `<p>${esc(s.message)}</p><small>de ${esc(nomeMembro(s.created_by))} · revelada ${esc(formatDateShort(s.reveal_date))}</small>`
          : `<small>abre ${dias <= 0 ? "hoje" : `em ${dias} dia${dias > 1 ? "s" : ""}`} · ${esc(formatDateShort(s.reveal_date))} 🤫</small>`}
      </div>
      <button class="recado-mini" type="button" data-surp-del="${s.id}">${icon("trash")}</button>
    </article>`;
}
function nosSurpresasHtml() {
  const hojeStr = hojeISO();
  const fechadas = coupleSurprises.filter((s) => s.reveal_date > hojeStr);
  const abertas = coupleSurprises.filter((s) => s.reveal_date <= hojeStr).reverse();
  const minDate = hojeStr;
  return `
    <details class="nos-panel">
      <summary><span>🎁 Surpresas à distância</span><small>${fechadas.length} fechadas · ${abertas.length} abertas</small></summary>
    <details class="nos-criar">
      <summary>＋ Guardar uma surpresa</summary>
      <p class="muted" style="margin:10px 0;font-size:.82rem">Um recadinho que só revela no dia marcado. Fica escondido até lá — só texto, sem mídia.</p>
      <form id="nos-surpresa-form" class="form-grid">
        <div class="field"><label>Rótulo (discreto)</label><input name="title" placeholder="Pra quando bater saudade…" maxlength="60" /></div>
        <div class="field"><label>Abre em</label><input name="reveal_date" type="date" min="${minDate}" required /></div>
        <div class="field full"><label>O que revela</label><textarea name="message" rows="2" placeholder="Escreva a surpresa…" required></textarea></div>
        <div class="actions field full"><button class="btn" type="submit">${icon("add")} Guardar 🤫</button></div>
      </form>
    </details>
    ${fechadas.length ? `<section class="surpresas">${fechadas.map(surpresaCard).join("")}</section>` : ""}
    ${abertas.length ? `<div class="vales-head" style="font-size:.82rem">💝 Já reveladas</div><section class="surpresas">${abertas.map(surpresaCard).join("")}</section>` : ""}
    ${!coupleSurprises.length ? `<div class="empty">Nenhuma surpresa guardada ainda. Que tal a primeira? 💝</div>` : ""}
    </details>`;
}

function extrasMigrationNotice() {
  return nosExtrasReady ? "" : `<div class="empty">Novos recursos íntimos aguardando a migração <strong>29 - missoes-desejos-e-fetiches.sql</strong> no Supabase.</div>`;
}

function secretStatusText(status) {
  return {
    criada: "pronta para você enviar",
    enviada: "aguardando a outra pessoa marcar que recebeu",
    recebida: "recebida e pronta para ser cumprida",
    cumprida: "concluída pelos dois",
    adaptar: "pede ajuste antes de concluir",
    recusada: "guardada por agora",
  }[status] || status;
}

function missionCounts() {
  return {
    pendentes: secretMissions.filter((m) => ["criada", "enviada", "recebida", "adaptar"].includes(m.status || "criada")).length,
    cumpridas: secretMissions.filter((m) => m.status === "cumprida").length,
  };
}

function commonFetishTags() {
  const partner = coupleMembers.find((m) => m.user_id !== authUser?.id);
  return FETISH_TAGS.filter(([tag]) => {
    const a = fetishPref(tag, authUser?.id);
    const b = partner ? fetishPref(tag, partner.user_id) : "";
    return ["curto", "testar"].includes(a) && ["curto", "testar"].includes(b);
  });
}

function normalizeWords(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !DESIRE_STOPWORDS.has(w));
}

function desireMatchGroups() {
  const mine = coupleDesires.filter((d) => d.created_by === authUser?.id);
  const other = coupleDesires.filter((d) => d.created_by !== authUser?.id);
  const matches = [];
  for (const a of mine) {
    for (const b of other) {
      if ((a.category || "") !== (b.category || "")) continue;
      if (Math.abs(Number(a.intensity || 1) - Number(b.intensity || 1)) > 1) continue;
      const wa = normalizeWords(a.body);
      const wb = normalizeWords(b.body);
      const overlap = wa.filter((w) => wb.includes(w));
      const exact = String(a.body || "").trim().toLowerCase() === String(b.body || "").trim().toLowerCase();
      if (exact || overlap.length >= 2) {
        matches.push({ ids: [a.id, b.id], overlap });
      }
    }
  }
  return matches;
}

function desireAutoRevealIds() {
  const ids = new Set();
  desireMatchGroups().forEach((m) => m.ids.forEach((id) => ids.add(id)));
  return ids;
}

function desireMatchFor(id) {
  return desireMatchGroups().find((m) => m.ids.includes(id)) || null;
}

function secretMissionCard(m) {
  const mine = m.created_by === authUser?.id;
  const status = m.status || "criada";
  const parc = parceiroTelegram();
  const link = tgLink(parc.contato);
  const actions = [];
  if (mine && status === "criada") actions.push(`<button type="button" data-secret-status="${m.id}:enviada">📤 Enviei</button>`);
  if (mine && status === "adaptar") actions.push(`<button type="button" data-secret-status="${m.id}:criada">Ajustar</button>`);
  if (!mine && status === "enviada") actions.push(`<button type="button" data-secret-status="${m.id}:recebida">📥 Recebi</button>`);
  if (!mine && (status === "recebida" || status === "adaptar")) actions.push(`<button type="button" data-secret-status="${m.id}:cumprida">✅ Cumpri</button>`);
  if (!mine && status !== "cumprida" && status !== "recusada") actions.push(`<button type="button" data-secret-status="${m.id}:adaptar">Adaptar</button><button type="button" data-secret-status="${m.id}:recusada">Agora não</button>`);
  if (mine || status === "recusada") actions.push(`<button type="button" data-secret-del="${m.id}">${icon("trash")}</button>`);
  return `
    <article class="secret-card st-${esc(status)}">
      <div>
        <span class="nos-kind">${esc(pairLabel(SECRET_MISSION_KINDS, m.kind))} · ${NIVEL_LABEL[m.intensity] || `Nível ${m.intensity}`}</span>
        <strong>${esc(m.title)}</strong>
        <small>${mine ? "você criou" : `${esc(nomeMembro(m.created_by))} criou`} · ${esc(pairLabel(SECRET_DUES, m.due))} · ${esc(secretStatusText(status))}</small>
      </div>
      <div class="mini-actions">
        ${link ? `<a class="recado-mini" href="${esc(link)}" target="_blank" rel="noopener">Telegram</a>` : ""}
        ${actions.join("")}
      </div>
    </article>`;
}

function nosMissoesSecretasHtml() {
  const counts = missionCounts();
  return `
    <details class="nos-panel">
      <summary><span>🔥 Missões secretas</span><small>${counts.pendentes} pendentes · ${counts.cumpridas} concluídas</small></summary>
      ${extrasMigrationNotice()}
      <details class="nos-criar">
        <summary>＋ Criar missão</summary>
        <form id="secret-mission-form" class="form-grid" style="margin-top:12px">
          <div class="field full"><label>Missão</label><textarea name="title" rows="2" placeholder="Ex.: me manda uma pista de uma vontade sua..." required></textarea></div>
          <div class="field"><label>Tipo</label><select name="kind">${SECRET_MISSION_KINDS.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
          <div class="field"><label>Prazo</label><select name="due">${SECRET_DUES.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
          <div class="field full"><label>Intensidade</label><select name="intensity">${NIVEIS.map((n) => `<option value="${n.n}">${n.emoji} ${esc(n.nome)}</option>`).join("")}</select></div>
          <div class="actions field full"><button class="btn" type="submit">${icon("add")} Criar missão</button></div>
        </form>
      </details>
      ${secretMissions.length ? `<section class="secret-list">${secretMissions.slice(0, 8).map(secretMissionCard).join("")}</section>` : `<div class="empty">Nenhuma missão secreta ainda.</div>`}
    </details>`;
}

function desireCard(d) {
  const mine = d.created_by === authUser?.id;
  const match = desireMatchFor(d.id);
  const autoReveal = desireAutoRevealIds().has(d.id);
  const visible = mine || d.revealed || autoReveal;
  const waiting = d.reveal_requested_by && d.reveal_requested_by === authUser?.id && !d.revealed;
  return `
    <article class="desire-card ${(d.revealed || autoReveal) ? "revealed" : ""}">
      <div>
        <span class="nos-kind">${esc(pairLabel(SECRET_MISSION_KINDS, d.category))} · ${NIVEL_LABEL[d.intensity] || `Nível ${d.intensity}`}</span>
        <strong>${visible ? esc(d.body) : "Desejo guardado 🔒"}</strong>
        <small>${mine ? "seu desejo" : `de ${esc(nomeMembro(d.created_by))}`} · ${d.revealed ? "revelado pelos dois" : autoReveal ? "abriu porque combinou com o outro" : waiting ? "você pediu pra revelar" : "fechado"}</small>
        ${match ? `<span class="match-pill">match de desejo${match.overlap.length ? ` · ${esc(match.overlap.slice(0, 2).join(" · "))}` : ""}</span>` : ""}
      </div>
      <div class="mini-actions">
        ${(!d.revealed && !autoReveal) ? `<button type="button" data-desire-reveal="${d.id}">${waiting ? "Aguardando" : "Revelar"}</button>` : ""}
        ${mine ? `<button type="button" data-desire-del="${d.id}">${icon("trash")}</button>` : ""}
      </div>
    </article>`;
}

function nosCofrinhoHtml() {
  const matches = desireMatchGroups().length;
  return `
    <details class="nos-panel">
      <summary><span>🔒 Cofrinho safado</span><small>${coupleDesires.length} desejos · ${matches} matches</small></summary>
      ${extrasMigrationNotice()}
      <details class="nos-criar">
        <summary>＋ Guardar desejo</summary>
        <form id="desire-form" class="form-grid" style="margin-top:12px">
          <div class="field full"><label>Desejo privado</label><textarea name="body" rows="2" placeholder="Escreve algo que você quer revelar quando os dois toparem..." required></textarea></div>
          <div class="field"><label>Categoria</label><select name="category">${SECRET_MISSION_KINDS.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("")}</select></div>
          <div class="field"><label>Intensidade</label><select name="intensity">${NIVEIS.map((n) => `<option value="${n.n}">${n.emoji} ${esc(n.nome)}</option>`).join("")}</select></div>
          <div class="actions field full"><button class="btn" type="submit">${icon("add")} Guardar</button></div>
        </form>
      </details>
      ${coupleDesires.length ? `<section class="secret-list">${coupleDesires.slice(0, 10).map(desireCard).join("")}</section>` : `<div class="empty">Cofrinho vazio por enquanto.</div>`}
    </details>`;
}

function fetishPref(tag, uid) {
  return fetishPrefs.find((p) => p.tag === tag && p.user_id === uid)?.status || "";
}
function nosFetichesHtml() {
  const partner = coupleMembers.find((m) => m.user_id !== authUser?.id);
  const comuns = commonFetishTags();
  return `
    <details class="nos-panel">
      <summary><span>🧭 Tags de desejo</span><small>${comuns.length} combinam nos dois</small></summary>
      ${extrasMigrationNotice()}
      <section class="fetish-grid">
        ${FETISH_TAGS.map(([tag, label]) => {
          const mine = fetishPref(tag, authUser?.id);
          const other = partner ? fetishPref(tag, partner.user_id) : "";
          return `<article class="fetish-card"><strong>${esc(label)}</strong><small>Você: ${esc(mine || "—")} · ${esc(nomeMembro(partner?.user_id))}: ${esc(other || "—")}</small><div class="feito-feedback-actions">${FETISH_STATUSES.map(([v, l]) => `<button class="${mine === v ? "on" : ""}" type="button" data-fetish-pref="${tag}:${v}">${esc(l)}</button>`).join("")}</div></article>`;
        }).join("")}
      </section>
    </details>`;
}

function nosRoletaSafadaHtml() {
  const comuns = commonFetishTags();
  const base = comuns.length ? comuns : FETISH_TAGS.slice(0, 3);
  const seed = hojeISO().split("").reduce((s, c) => s + c.charCodeAt(0), desafioIdx);
  const picked = base[seed % base.length];
  return `
    <section class="desafio-card nivel-${Math.min(3, intensidadePermitidaHoje())}">
      <span class="desafio-nivel">Roleta safada por clima</span>
      <strong>${esc(picked?.[1] || "Provocação")}</strong>
      <p class="desafio-desc">Use isso como tema para criar uma missão secreta ou um vale. Só aparece a partir do que vocês marcaram como permitido.</p>
      <div class="actions" style="margin-top:14px"><button class="btn ghost" type="button" data-desafio-outro>Sortear outro clima</button></div>
    </section>`;
}

// ---------- Fase 6: Telegram (conteúdo íntimo fora do app) ----------
const TG_KIND = { sent: "📤 enviei", received: "📥 recebi", done: "✅ concluímos" };
// Monta o link do Telegram a partir de número (com DDI), @usuário ou link pronto.
function tgLink(raw) {
  if (!raw) return "";
  const v = String(raw).trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("@")) return `https://t.me/${v.slice(1)}`;
  const num = v.replace(/[\s\-().]/g, "");
  if (/^\+?\d{8,15}$/.test(num)) return `https://t.me/${num.startsWith("+") ? num : "+" + num}`;
  return `https://t.me/${v.replace(/^@/, "")}`;
}
function meuTelegram() {
  return couplePrefs.find((p) => p.user_id === authUser?.id)?.telegram || "";
}
function parceiroTelegram() {
  const parc = coupleMembers.find((m) => m.user_id !== authUser?.id);
  if (!parc) return { nome: "sua pessoa", contato: "" };
  const pref = couplePrefs.find((p) => p.user_id === parc.user_id);
  return { nome: nomeMembro(parc.user_id), contato: pref?.telegram || "" };
}
function nosTelegramHtml() {
  const parc = parceiroTelegram();
  const link = tgLink(parc.contato);
  const eventos = coupleTgEvents.slice(0, 4);
  const planeIco = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M21.7 3.3 2.9 10.6c-.9.4-.9 1.6 0 1.9l4.6 1.5 1.8 5.4c.3.8 1.3 1 1.9.4l2.5-2.4 4.6 3.4c.6.5 1.5.2 1.7-.6l3.3-15.5c.2-.9-.7-1.7-1.6-1.4ZM9.7 13.7l9-7.4-7.5 8.3v3.1l-1.5-4Z"/></svg>`;
  return `
    <details class="nos-panel">
      <summary><span>✈️ Telegram privado</span><small>registrar envio e conclusão</small></summary>
    <section class="tg-box">
      <div class="tg-top">
        <span class="tg-logo">${planeIco}</span>
        <div class="tg-head"><strong>Continuar no Telegram</strong><small>o conteúdo íntimo fica só lá, nunca no app</small></div>
      </div>
      ${link
        ? `<a class="tg-open" href="${esc(link)}" target="_blank" rel="noopener">${planeIco} Abrir conversa com ${esc(parc.nome)}</a>`
        : `<div class="tg-empty">${parc.contato ? "" : `Falta o Telegram d${parc.nome === "sua pessoa" ? "a sua pessoa" : "e " + esc(parc.nome)}. ` }Cada um cadastra o seu em <strong>Ajustes</strong>. 💬</div>`}
      <div class="tg-chips">
        <button class="tg-chip" type="button" data-tg-event="sent">📤 Enviei</button>
        <button class="tg-chip" type="button" data-tg-event="received">📥 Recebi</button>
        <button class="tg-chip done" type="button" data-tg-event="done">✅ Concluímos <b>+${PONTOS.telegram}</b></button>
      </div>
      ${eventos.length ? `<div class="tg-events">${eventos.map((e) => `<div class="tg-event"><small>${TG_KIND[e.kind] || esc(e.kind)} · ${esc(nomeMembro(e.user_id))} · ${esc(timeAgo(e.created_at))}</small><button class="recado-mini" type="button" data-tg-del="${e.id}:${esc(e.kind)}">${icon("trash")}</button></div>`).join("")}</div>` : ""}
    </section>
    </details>`;
}

function nosConquistasHtml() {
  const lista = nosConquistas();
  const feitas = lista.filter((c) => c.cur >= c.alvo).length;
  return `
    <details class="nos-panel">
      <summary><span>🏅 Conquistas</span><small>${feitas}/${lista.length} liberadas</small></summary>
    <section class="conquistas">
      ${lista.map((c) => {
        const ok = c.cur >= c.alvo;
        const pct = Math.min(100, Math.round((c.cur / c.alvo) * 100));
        return `<article class="conq ${ok ? "on" : ""}">
          <span class="conq-emoji">${ok ? c.emoji : "🔒"}</span>
          <strong>${esc(c.nome)}</strong>
          <small>${esc(c.desc)}</small>
          ${ok ? `<span class="conq-badge">conquistado!</span>` : `<div class="conq-bar"><i style="width:${pct}%"></i></div><span class="conq-pct">${c.cur}/${c.alvo}</span>`}
        </article>`;
      }).join("")}
    </section>
    </details>`;
}

// Bloco de um nível (catálogo desbloqueável). Reusado inline e no popup.
function nosNivelBloco(niv) {
  const acumulados = nosPontosAcumulados();
  const saldo = nosSaldo();
  const permitida = intensidadePermitida();
  const liberadoPontos = acumulados >= niv.req;
  const bloqueado18 = niv.n >= 4 && !adulto18Ok();
  const desafios = DESAFIOS_CAT.filter((d) => d.nivel === niv.n);
  if (!liberadoPontos) {
    return `<div class="prog-cat locked"><span class="prog-cat-head">🔒 ${niv.emoji} ${esc(niv.nome)}</span><small>Faltam ${niv.req - acumulados} pts acumulados</small></div>`;
  }
  if (bloqueado18) {
    return `<div class="prog-cat locked"><span class="prog-cat-head">🔞 ${niv.emoji} ${esc(niv.nome)}</span><small>Liberem o conteúdo adulto (18+) no clima</small></div>`;
  }
  const cards = desafios.map((d) => {
    const unlocked = d.custo === 0 || desafioUnlocked(d.key);
    const noConsent = d.nivel > permitida;
    if (!unlocked) {
      const podePagar = saldo >= d.custo && !noConsent;
      return `<div class="cat-desafio locked"><strong>🔒 ${esc(d.nome)}</strong><div class="cat-foot"><span class="nos-cost">${d.custo} pts</span><button class="btn ghost" type="button" data-unlock-desafio="${d.key}" ${podePagar ? "" : "disabled"}>${noConsent ? "fora do limite" : "Desbloquear"}</button></div></div>`;
    }
    const st = desafioEstado(d.key);
    const rotulo = desafioRotuloAcao(d.key);
    return `<div class="cat-desafio"><strong>${esc(d.nome)}</strong><small class="muted">${esc(d.desc)}</small><div class="cat-foot"><button class="btn" type="button" data-desafio-done="${d.key}:${d.nivel}" ${(noConsent || st.ambos || st.eu) ? "disabled" : ""}>${noConsent ? "fora do limite" : rotulo}</button></div></div>`;
  }).join("");
  return `<div class="prog-cat"><span class="prog-cat-head">${niv.emoji} ${esc(niv.nome)}</span><div class="cat-grid">${cards}</div></div>`;
}
// Progressão: mostra os níveis JÁ liberados aqui; o resto (bloqueados) vai pro popup.
function nosProgressaoHtml() {
  const acumulados = nosPontosAcumulados();
  const liberados = NIVEIS.filter((niv) => acumulados >= niv.req && !(niv.n >= 4 && !adulto18Ok()));
  const atual = liberados.length ? liberados[liberados.length - 1] : NIVEIS[0];
  const inline = liberados.length ? liberados : [NIVEIS[0]];
  const restantes = NIVEIS.length - liberados.length;
  return `
    <details class="nos-panel">
      <summary><span>🏆 Níveis & desafios</span><small>Nível ${atual.n} · ${restantes > 0 ? `${restantes} bloqueados` : "todos liberados"}</small></summary>
    <div class="nos-level-rail">
      ${NIVEIS.map((niv) => {
        const ok = acumulados >= niv.req && !(niv.n >= 4 && !adulto18Ok());
        return `<span class="${ok ? "on" : ""}">${niv.emoji}<b>${niv.n}</b><small>${esc(niv.nome)}</small></span>`;
      }).join("")}
    </div>
    <div class="nos-ready-levels">
      ${inline.map(nosNivelBloco).join("")}
    </div>
    <button class="nos-tile" type="button" data-desafios-open>
      <span class="tile-ico">🗺️</span>
      <span class="tile-main"><strong>Todos os níveis</strong><small>${restantes > 0 ? `+${restantes} nível${restantes > 1 ? "is" : ""} pra desbloquear` : "ver os 6 níveis"}</small></span>
      <span class="tile-go">›</span>
    </button>
    </details>`;
}
function desafiosModalTemplate() {
  if (!desafiosOpen) return "";
  return `
    <div class="modal ui-modal">
      <section class="modal-card ui-card" style="width:min(460px,100%);max-height:84vh;overflow:auto">
        <div class="modal-head"><div><h2 style="margin:0">🗺️ Níveis & desafios</h2><p class="muted" style="margin:4px 0 0">Quanto mais íntimo, mais caro 🔓</p></div><button class="close" type="button" data-desafios-close>×</button></div>
        ${NIVEIS.map(nosNivelBloco).join("")}
      </section>
    </div>`;
}

// ===== Baralho Verdade ou Desafio =====
function cartaAtiva() {
  try { return JSON.parse(coupleAbout.carta_ativa || "null"); } catch { return null; }
}
function nomeParceiroCurto() {
  const p = parceiraMembro();
  return (p?.nickname || p?.name || "sua pessoa").split(" ")[0];
}
function puxarCarta(tipo) {
  const lim = intensidadePermitida();
  const verdades = VERDADES_CAT.filter((v) => v.nivel <= lim).map((v) => ({ tipo: "verdade", texto: v.texto, nivel: v.nivel }));
  const desafios = DESAFIOS_CAT.filter((d) => d.nivel <= lim).map((d) => ({ tipo: "desafio", texto: d.desc, nome: d.nome, nivel: d.nivel }));
  const pool = tipo === "verdade" ? verdades : tipo === "desafio" ? desafios : verdades.concat(desafios);
  if (!pool.length) { toast("Definam os limites no ‘clima’ pra liberar as cartas 🔥"); return; }
  let nova; let i = 0;
  do { nova = pool[Math.floor(Math.random() * pool.length)]; i++; } while (cartaAtual && nova.texto === cartaAtual.texto && pool.length > 1 && i < 8);
  cartaAtual = nova;
  render();
}
async function enviarCarta() {
  if (!cartaAtual || !state.couple) return;
  const payload = JSON.stringify({ tipo: cartaAtual.tipo, texto: cartaAtual.texto, nome: cartaAtual.nome || "", nivel: cartaAtual.nivel, by: authUser.id, at: new Date().toISOString() });
  try {
    await saveCoupleAbout(state.couple.id, authUser.id, "carta_ativa", payload);
    coupleAbout.carta_ativa = payload;
    cartaAtual = null;
    render();
    toast(`Carta enviada pra ${nomeParceiroCurto()}! 🔥`);
  } catch { toast("Não consegui enviar a carta."); }
}
function cartasHistorico() {
  try { return JSON.parse(coupleAbout.cartas_hist || "[]"); } catch { return []; }
}
async function limparCarta(cumprida) {
  const c = cartaAtiva();
  if (!state.couple) return;
  try {
    if (cumprida && c) {
      const hist = [{ tipo: c.tipo, texto: c.texto, nome: c.nome || "", nivel: c.nivel, by: c.by, at: new Date().toISOString() }, ...cartasHistorico()].slice(0, 20);
      const histStr = JSON.stringify(hist);
      await saveCoupleAbout(state.couple.id, authUser.id, "cartas_hist", histStr);
      coupleAbout.cartas_hist = histStr;
      await ganharPontos(PONTOS.desafio[c.nivel] || 8, `carta cumprida (${c.tipo})`, "carta", `carta:${Date.now()}`);
    }
    await saveCoupleAbout(state.couple.id, authUser.id, "carta_ativa", "");
    coupleAbout.carta_ativa = "";
    render();
    toast(cumprida ? "Cumprido! 💋" : "Carta descartada.");
  } catch { toast("Não consegui atualizar."); }
}

function baralhoHistoricoTemplate() {
  const hist = cartasHistorico();
  if (!hist.length) return "";
  return `
    <details class="nos-panel cartas-hist">
      <summary><span>📜 Cartas que rolaram</span><small>${hist.length}</small></summary>
      <div class="cartas-hist-list">
        ${hist.map((c) => {
          const quem = c.by === authUser?.id ? "você mandou" : `${esc(nomeParceiroCurto())} mandou`;
          return `<div class="cartas-hist-item"><span class="chi-selo ${c.tipo}">${c.tipo === "verdade" ? "💬" : "😈"}</span><div><p>${esc(c.texto)}</p><small>${quem} · ${esc(timeAgo(c.at))}</small></div></div>`;
        }).join("")}
      </div>
    </details>`;
}

// Card visual de uma carta.
function cartaFaceHtml(c, { compacta } = {}) {
  const cor = c.tipo === "verdade" ? "verdade" : "desafio";
  const selo = c.tipo === "verdade" ? "💬 Verdade" : "😈 Desafio";
  return `
    <div class="carta-face ${cor} ${compacta ? "compacta" : ""}">
      <span class="carta-selo">${selo}</span>
      <span class="carta-nivel">${NIVEL_LABEL[c.nivel] || `Nível ${c.nivel}`}</span>
      ${c.nome ? `<strong class="carta-nome">${esc(c.nome)}</strong>` : ""}
      <p class="carta-texto">${esc(c.texto)}</p>
    </div>`;
}

function baralhoTemplate() {
  const meu = prefMax(authUser?.id);
  if (!meu) {
    return `
      <section class="baralho">
        <div class="baralho-vazio">🔒 Definam os limites de vocês no <strong>clima</strong> (abaixo) pra abrir o baralho.</div>
      </section>`;
  }
  const ativa = cartaAtiva();
  // Já existe uma carta em jogo (enviada por alguém).
  if (ativa) {
    const minha = ativa.by === authUser?.id;
    if (minha) {
      return `
        <section class="baralho">
          <div class="baralho-head"><strong>📤 Carta enviada</strong><small>esperando ${esc(nomeParceiroCurto())} cumprir…</small></div>
          ${cartaFaceHtml(ativa)}
          <div class="baralho-acoes"><button class="btn ghost" type="button" data-carta-cancelar>Cancelar carta</button></div>
        </section>`;
    }
    return `
      <section class="baralho">
        <div class="baralho-head"><strong>💌 ${esc(nomeParceiroCurto())} te mandou uma carta!</strong><small>topa?</small></div>
        ${cartaFaceHtml(ativa)}
        <div class="baralho-acoes">
          <button class="btn" type="button" data-carta-cumpri>✅ Cumpri 💋</button>
          <button class="btn ghost" type="button" data-carta-recusar>🙈 Agora não</button>
        </div>
      </section>`;
  }
  // Sem carta em jogo: puxar do baralho.
  return `
    <section class="baralho">
      <div class="baralho-head"><strong>🃏 Verdade ou Desafio</strong><small>puxe e mande pra ${esc(nomeParceiroCurto())}</small></div>
      ${cartaAtual
        ? `${cartaFaceHtml(cartaAtual)}
           <div class="baralho-acoes">
             <button class="btn" type="button" data-carta-enviar>💌 Mandar pra ${esc(nomeParceiroCurto())}</button>
             <button class="btn ghost" type="button" data-carta-puxar="${cartaAtual.tipo}">🎲 Outra</button>
           </div>`
        : `<div class="baralho-deck" data-carta-puxar="ambos"><span>🔥</span><b>Toque pra puxar uma carta</b></div>
           <div class="baralho-tipos">
             <button class="btn ghost" type="button" data-carta-puxar="verdade">💬 Verdade</button>
             <button class="btn ghost" type="button" data-carta-puxar="desafio">😈 Desafio</button>
           </div>`}
    </section>`;
}

function nosSection() {
  if (!nosUnlocked) return nosLockTemplate();

  // Desafio do dia (livre, respeitando consentimento + progressão).
  const meu = prefMax(authUser?.id);
  const desafio = meu ? desafioDoDia() : null;
  let desafioAcao = "";
  if (desafio) {
    const st = desafioEstado(desafio.key);
    if (st.ambos) {
      desafioAcao = `<div class="desafio-status ok">✓ Recebido e concluído! 💞</div><button class="btn ghost" type="button" data-desafio-outro>Outro desafio</button>`;
    } else if (st.eu) {
      desafioAcao = `<div class="desafio-status wait">📤 Você enviou o desafio — esperando a outra pessoa marcar que recebeu…</div><button class="btn ghost" type="button" data-desafio-outro>Trocar</button>`;
    } else if (st.outro) {
      desafioAcao = `<button class="btn" type="button" data-desafio-done="${desafio.key}:${desafio.nivel}">📥 Recebi</button><button class="btn ghost" type="button" data-desafio-outro>Trocar</button>`;
    } else {
      desafioAcao = `<button class="btn" type="button" data-desafio-done="${desafio.key}:${desafio.nivel}">📤 Desafiar</button><button class="btn ghost" type="button" data-desafio-outro>Trocar</button>`;
    }
  }
  const desafioHtml = `
    <div class="section-title compact"><h2>Desafio do dia 🎯</h2><span class="muted" style="font-size:.8rem">os dois confirmam</span></div>
    ${!meu
      ? `<div class="empty">Defina seus limites (no card de clima) pra liberar o desafio.</div>`
      : desafio
        ? `<section class="desafio-card nivel-${desafio.nivel}">
             <span class="desafio-nivel">${NIVEL_LABEL[desafio.nivel]}</span>
             <strong>${esc(desafio.nome)}</strong>
             <p class="desafio-desc">${esc(desafio.desc)}</p>
             <div class="actions" style="margin-top:14px">${desafioAcao}</div>
           </section>`
        : `<div class="empty">Sem desafio livre agora. Subam de nível ou ajustem os limites.</div>`}`;

  const abas = [
    ["hoje", "🔥 Hoje"],
    ["brincar", "🎲 Brincadeiras"],
    ["desejos", "💝 Desejos"],
    ["progresso", "🏆 Progresso"],
  ];
  if (!abas.some(([k]) => k === nosTab)) nosTab = "hoje";
  const subnav = `<div class="nos-subtabs">${abas.map(([k, l]) => `<button class="${nosTab === k ? "on" : ""}" type="button" data-nos-tab="${k}">${l}</button>`).join("")}</div>`;

  let corpo = "";
  if (nosTab === "hoje") {
    corpo = `
      ${baralhoTemplate()}
      ${baralhoHistoricoTemplate()}
      ${nosClimaHtml()}
      ${nosTelegramHtml()}`;
  } else if (nosTab === "brincar") {
    corpo = `${nosRoletaSafadaHtml()}${nosValesHtml()}${nosMissoesSecretasHtml()}${nosFetichesHtml()}`;
  } else if (nosTab === "desejos") {
    corpo = `${nosCofrinhoHtml()}${nosSurpresasHtml()}`;
  } else {
    corpo = `${nosProgressaoHtml()}${nosMissoesResumoHtml()}${nosConquistasHtml()}`;
  }

  return `
    <div class="nos-wrap">
      <div class="nos-title"><h2>🔥 Nós</h2><span>só de vocês dois · confidencial</span></div>
      ${nosHeroHtml()}
      ${subnav}
      ${corpo}
    </div>

    ${missoesModalTemplate()}
    ${desafiosModalTemplate()}`;
}

// ---------- Planos: wishlist + calendário de encontros ----------
async function loadPlanosData() {
  if (!state.couple || !cloudOn()) return;
  try {
    const [w, d, rl, sd] = await Promise.all([
      loadCoupleWishlist(state.couple.id),
      loadCoupleDates(state.couple.id),
      loadReunionList(state.couple.id),
      loadSaudade(state.couple.id),
    ]);
    coupleWishlist = w;
    coupleDates = d;
    coupleReunion = rl;
    coupleSaudade = sd;
  } catch {
    coupleWishlist = []; coupleDates = []; coupleReunion = []; coupleSaudade = [];
  }
  planosFor = state.couple.id;
  render();
}

// ---------- Fase 5: Modo saudade (namoro a distância) ----------
function diasSemVer() {
  const d = state.couple?.lastMetDate;
  if (!d) return null;
  const alvo = new Date(`${d}T00:00:00`);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoje - alvo) / 86400000));
}
function coupleSaudadeTemplate() {
  const hoje = new Date().toISOString().slice(0, 10);
  const dias = diasSemVer();
  const ultima = coupleSaudade[0];
  const reunionAbertos = coupleReunion.filter((r) => !r.done);
  const reunionFeitos = coupleReunion.filter((r) => r.done);
  const reunionCard = (r) => `
    <article class="plano-item ${r.done ? "done" : ""}">
      <span class="plano-emoji">${r.done ? "✅" : "📝"}</span>
      <div class="plano-text"><strong>${esc(r.text)}</strong><small>${esc(nomeMembro(r.created_by))}${r.done ? " · ✓ feito" : ""}</small></div>
      <div class="mini-actions"><button data-reunion-done="${r.id}:${r.done ? "0" : "1"}">${r.done ? "Reabrir" : "Já fizemos"}</button><button data-reunion-del="${r.id}">${icon("trash")}</button></div>
    </article>`;
  return `
    <div class="section-title compact"><h2>💗 Modo saudade</h2></div>
    <section class="saudade-box">
      ${dias !== null
        ? `<div class="saudade-dias"><strong>${dias}</strong><span>dia${dias === 1 ? "" : "s"} sem te ver 🥺</span></div>`
        : `<p class="muted" style="margin:0 0 8px;font-size:.84rem">Marca a última vez que vocês se viram pra contar a saudade.</p>`}
      <form id="couple-lastmet-form" class="search-bar" style="margin-top:8px">
        <input name="lastmet" type="date" max="${hoje}" value="${esc(state.couple.lastMetDate || "")}" />
        <button class="btn secondary" type="submit">Última vez que nos vimos</button>
      </form>
      <form id="couple-saudade-form" class="search-bar" style="margin-top:10px">
        <input name="note" placeholder="Manda uma saudade… 💌" maxlength="140" />
        <button class="btn" type="submit">Mandar saudade</button>
      </form>
      ${ultima ? `<p class="saudade-ultima">💌 <strong>${esc(nomeMembro(ultima.user_id))}</strong>: ${ultima.note ? esc(ultima.note) : "tô com saudade"} <span class="muted">· ${esc(timeAgo(ultima.created_at))}</span></p>` : ""}
      ${coupleSaudade.length > 1 ? `<details class="saudade-mais"><summary>Saudades anteriores (${coupleSaudade.length})</summary>${coupleSaudade.slice(1).map((s) => `<div class="saudade-linha"><small>💌 ${esc(nomeMembro(s.user_id))}: ${s.note ? esc(s.note) : "saudade"} · ${esc(timeAgo(s.created_at))}</small><button class="recado-mini" type="button" data-saudade-del="${s.id}">${icon("trash")}</button></div>`).join("")}</details>` : ""}
    </section>

    <div class="section-title compact"><h2>📝 Pra quando a gente se ver</h2></div>
    <form id="couple-reunion-form" class="search-bar">
      <input name="text" placeholder="Um lugar, um date, um abraço demorado…" required />
      <button class="btn secondary" type="submit">Adicionar</button>
    </form>
    ${reunionAbertos.length ? `<section class="plano-grid">${reunionAbertos.map(reunionCard).join("")}</section>` : `<div class="empty">Listem o que querem fazer quando se virem. 💕</div>`}
    ${reunionFeitos.length ? `<div class="section-title compact"><h2>Já fizemos 💞</h2></div><section class="plano-grid">${reunionFeitos.map(reunionCard).join("")}</section>` : ""}`;
}

function couplePlanosSection() {
  const carregando = planosFor !== state.couple.id;
  const hoje = new Date().toISOString().slice(0, 10);
  const dateEmoji = { chamada: "📞", filme: "🎬", jogo: "🎮", outro: "✨" };
  const wishEmoji = { presente: "🎁", experiencia: "✨" };
  const proximos = coupleDates.filter((d) => !d.done && (!d.when_at || d.when_at >= hoje));
  const passados = coupleDates.filter((d) => d.done || (d.when_at && d.when_at < hoje));
  const dateCard = (d) => `
    <article class="plano-item ${d.done ? "done" : ""}">
      <span class="plano-emoji">${dateEmoji[d.kind] || "✨"}</span>
      <div class="plano-text"><strong>${esc(d.title)}</strong><small>${d.when_at ? esc(formatDateShort(d.when_at)) : "sem data"}${d.done ? " · ✓ feito" : ""}</small></div>
      <div class="mini-actions"><button data-date-done="${d.id}:${d.done ? "0" : "1"}">${d.done ? "Reabrir" : "Feito"}</button><button data-del-date="${d.id}">${icon("trash")}</button></div>
    </article>`;
  const wishCard = (w) => `
    <article class="plano-item ${w.done ? "done" : ""}">
      <span class="plano-emoji">${wishEmoji[w.kind] || "🎁"}</span>
      <div class="plano-text"><strong>${esc(w.title)}</strong><small>${esc(nomeMembro(w.wanted_by))} quer${w.done ? " · ✓ realizado" : ""}</small></div>
      <div class="mini-actions"><button data-wish-done="${w.id}:${w.done ? "0" : "1"}">${w.done ? "Reabrir" : "Realizado"}</button><button data-del-wish="${w.id}">${icon("trash")}</button></div>
    </article>`;

  return `
    <div class="section-title"><h2>📅 Planos de vocês</h2></div>
    <section class="form-card">
      <label style="display:block;font-weight:800;margin-bottom:8px">⏳ Próximo encontro presencial</label>
      <form id="couple-meet-form" class="search-bar">
        <input name="meet" type="date" value="${esc(state.couple.nextMeetDate || "")}" />
        <button class="btn secondary" type="submit">Salvar contagem</button>
      </form>
      <p class="muted" style="margin:8px 0 0;font-size:.8rem">Vira a contagem regressiva no painel.</p>
    </section>

    ${coupleSaudadeTemplate()}

    <div class="section-title compact"><h2>🗓️ Encontros virtuais</h2></div>
    <form id="couple-date-form" class="form-card form-grid">
      <div class="field"><label>O quê?</label><input name="title" placeholder="Assistir o ep 5 juntos…" required /></div>
      <div class="field"><label>Tipo</label><select name="kind"><option value="chamada">📞 Chamada</option><option value="filme">🎬 Assistir junto</option><option value="jogo">🎮 Jogar</option><option value="outro">✨ Outro</option></select></div>
      <div class="field"><label>Quando</label><input name="whenAt" type="date" /></div>
      <div class="actions field full"><button class="btn" type="submit">${icon("add")} Agendar</button></div>
    </form>
    ${proximos.length ? `<section class="plano-grid">${proximos.map(dateCard).join("")}</section>` : `<div class="empty">${carregando ? "Carregando…" : "Nada agendado. Marquem o próximo date virtual. 💕"}</div>`}
    ${passados.length ? `<div class="section-title compact"><h2>Já rolaram</h2></div><section class="plano-grid">${passados.map(dateCard).join("")}</section>` : ""}

    <div class="section-title compact"><h2>🎁 Wishlist de vocês</h2></div>
    <form id="couple-wish-form" class="search-bar">
      <select name="kind"><option value="presente">🎁 Presente</option><option value="experiencia">✨ Experiência</option></select>
      <input name="title" placeholder="O que você quer ganhar/fazer…" required />
      <button class="btn secondary" type="submit">Adicionar</button>
    </form>
    ${coupleWishlist.length ? `<section class="plano-grid">${coupleWishlist.map(wishCard).join("")}</section>` : `<div class="empty">${carregando ? "Carregando…" : "Listem presentes e experiências que vocês querem. 🎁"}</div>`}`;
}

function coupleDiversaoSection() {
  return `
    <div class="section-title"><h2>Diversão do casal</h2></div>
    <section class="couple-fun-grid">
      <button class="couple-dash-card featured" type="button" data-date-roulette>
        <span class="muted">Roleta de date</span>
        <strong>Sortear um date</strong>
        <small>Para quando vocês querem fazer algo juntos e ninguém decide.</small>
      </button>
      <div class="couple-dash-card">
        <span class="muted">Joguinho</span>
        <strong>💞 Quiz do casal</strong>
        <small>4 perguntas da semana pra ver o quanto vocês combinam.</small>
      </div>
      <div class="couple-dash-card">
        <span class="muted">Joguinho</span>
        <strong>🎬 Bingo do episódio</strong>
        <small>Marquem os clichês que aparecerem. Fechou linha, deu bingo!</small>
      </div>
    </section>
    ${coupleQuizTemplate()}
    ${bingoTemplate()}
    ${coupleCertificadosSection()}
    ${couplePetSection()}`;
}

// Seção "Tema": o mesmo seletor de temas, mas salvando NO casal (vale pros dois).
function coupleTemaSection() {
  const atual = state.couple?.tema || "";
  const custom = atual === "custom" ? resolverTema("custom", state.couple?.temaCustom) : null;
  const buscaDorama = `
    <section class="form-card">
      <p class="muted" style="margin:0 0 8px;font-weight:800">🎬 Tema com a cara de um dorama</p>
      <p class="muted" style="margin:0 0 10px;font-size:.82rem">Busca um dorama e o cantinho de vocês fica com as cores dele. Quando um muda, vale pros dois. 💕</p>
      <form id="tema-casal-search-form" class="search-bar">
        <input name="q" placeholder="Ex.: Goblin, Rainha das Lágrimas…" value="${esc(temaSearchCasal.query)}" autocomplete="off" />
        <button class="btn" type="submit">Buscar</button>
      </form>
      ${temaSearchCasal.loading ? `<p class="muted" style="margin-top:10px">Buscando…</p>` : ""}
      ${temaSearchCasal.results.length
        ? `<div class="search-results">${temaSearchCasal.results
            .slice(0, 12)
            .map((d) => `<button type="button" class="search-result" data-tema-dorama-casal="${d.tmdbId}"><img src="${esc(thumb(d.cover) || POSTER_PLACEHOLDER)}" alt="" loading="lazy" /><span class="search-result-info"><strong>${esc(d.title)}</strong><small>${d.year || "—"}</small></span></button>`)
            .join("")}</div>`
        : ""}
      ${custom ? `<p class="muted" style="margin-top:12px">Tema de vocês: <strong style="color:var(--cor-texto)">🎬 ${esc(custom.nome)}</strong></p>` : ""}
    </section>`;

  const grids = categorias
    .map((categoria) => {
      const lista = temas.filter((tema) => tema.categoria === categoria);
      return `
        <p class="muted" style="margin:6px 0 8px;font-weight:800">${esc(categoria)}</p>
        <section class="tema-grid">
          ${lista.map((tema) => {
            const fundo = tema.backdrop
              ? `background-image:url('${tema.backdrop}')`
              : `background:linear-gradient(135deg, ${tema.variaveis["--cor-primaria"]}, ${tema.variaveis["--cor-secundaria"]})`;
            return `
              <button type="button" class="tema-card ${atual === tema.id ? "active" : ""}" data-tema-casal="${tema.id}">
                <span class="tema-swatch" style="${fundo}">
                  <span class="emoji">${tema.marca.emoji}</span>
                  <span class="dot" style="background:${tema.variaveis["--cor-primaria"]}"></span>
                </span>
                <span class="tema-info"><strong>${esc(tema.nome)}</strong><small>${esc(tema.descricao)}</small></span>
              </button>`;
          }).join("")}
        </section>`;
    })
    .join("");

  return `<div class="section-title"><h2>${icon("paint")} Tema de nós dois</h2></div>${buscaDorama}${grids}`;
}

// Roteador das seções do ambiente do casal.
// Faixa de abas das seções do casal — visível só no celular (no PC é a sidebar).
function coupleSectionTabs() {
  const secoes = [
    ["inicio", "Painel"], ["assistindo", "Assistindo"], ["diario", "Diário"],
    ["sobre", "Nossa história"], ["planos", "Planos"], ["diversao", "Diversão"],
    ...(casalPrivadoOn() ? [["nos", "Nós 🔥"]] : []),
    ["ajustes", "Ajustes"],
  ];
  return `<div class="couple-tabs">${secoes.map(([k, l]) => `<button class="${coupleSection === k ? "active" : ""}" data-couple-section="${k}">${esc(l)}</button>`).join("")}</div>`;
}

function coupleSpaceView() {
  if (!state.couple) return `<div class="section-title"><h2>Nós dois</h2></div><div class="empty">Crie o espaço do casal no seu <strong>Perfil</strong> pra abrir o cantinho de vocês. 💕</div>`;
  if (coupleFor !== state.couple.id) return `<div class="section-title"><h2>Nós dois</h2></div><div class="empty">Carregando o cantinho de vocês…</div>`;
  let conteudo;
  switch (coupleSection) {
    case "assistindo": conteudo = coupleDramasTemplate(); break;
    case "diario": conteudo = coupleDiaryTemplate() + coupleLettersTemplate(); break;
    case "sobre": conteudo = coupleAboutTemplate(); break;
    case "cartinhas": conteudo = coupleLettersTemplate(); break;
    case "pet": conteudo = couplePetSection(); break;
    case "certificados": conteudo = coupleCertificadosSection(); break;
    case "tema": conteudo = coupleTemaSection(); break;
    case "planos": conteudo = couplePlanosSection(); break;
    case "diversao": conteudo = coupleDiversaoSection(); break;
    case "nos": conteudo = casalPrivadoOn() ? nosSection() : coupleInicioSection(); break;
    case "ajustes": conteudo = coupleAjustesSection(); break;
    default: conteudo = coupleInicioSection();
  }
  return coupleSectionTabs() + conteudo;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

function corte(text, max = 80) {
  const s = String(text || "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function favoriteGenre() {
  const counts = {};
  state.dramas.forEach((drama) => (drama.genres || []).forEach((genre) => {
    counts[genre] = (counts[genre] || 0) + 1;
  }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "—";
}

function averageRating() {
  const rated = state.dramas
    .map((drama) => Number(drama.personalRating))
    .filter((value) => value > 0);
  if (!rated.length) return "—";
  return (rated.reduce((sum, value) => sum + value, 0) / rated.length).toFixed(1);
}

// Gestão do espaço do casal — mora no Perfil (igual o "Espaço Casal" das
// Configurações do app financeiro). É o ÚNICO lugar de criar/entrar/sair.
function coupleProfileSection() {
  if (!cloudOn()) return "";

  // Topo: criar (sem casal) OU gerenciar (com casal).
  const topo = state.couple
    ? `<section class="form-card">
        <p class="muted" style="margin:0 0 6px">Vocês já têm um cantinho! Pra entrar, use o alternador <strong>🏠 Meu app / 💕 Nós dois</strong> (no PC) ou o botão abaixo.</p>
        <p class="muted" style="margin:0 0 4px">Código do casal:</p>
        <p style="margin:0 0 12px;font-size:1.5rem;font-weight:900;letter-spacing:.06em;color:var(--cor-primaria)">${esc(state.couple.code)}</p>
        <p class="muted" style="margin:0 0 12px;font-size:.84rem">Mande esse código pra sua pessoa. Ela entra em <strong>Perfil → Espaço do casal → “Recebeu um código?”</strong> e cola aí. 💌</p>
        <div class="actions" style="margin:0">
          <button class="btn" type="button" data-space-go="couple">${icon("heart")} Abrir nosso cantinho</button>
          <button class="btn secondary" type="button" data-copy-couple-code>Copiar código</button>
          <button class="btn ghost" type="button" data-leave-couple>Sair deste casal</button>
        </div>
      </section>`
    : `<section class="form-card">
        <p class="muted" style="margin:0 0 12px">Um cantinho privado só de vocês dois — doramas vistos juntos, memórias, cartinhas, dates, um pet e um tema só de vocês. Crie e mande o código pra sua pessoa.</p>
        <form id="create-couple-form" class="form-grid">
          <div class="field full"><label for="couple-title">Nome do casal</label><input id="couple-title" name="title" placeholder="Ex.: Você & seu amor" /></div>
          <div class="actions field full"><button class="btn" type="submit">Criar nosso espaço 💕</button></div>
        </form>
      </section>`;

  // "Recebeu um código?" SEMPRE visível (é onde a outra pessoa cola o código).
  const entrar = state.couple
    ? ""
    : `<section class="form-card">
        <p class="muted" style="margin:0 0 10px"><strong style="color:var(--cor-texto)">Recebeu um código?</strong> Cole aqui pra entrar no casal da sua pessoa.</p>
        <form id="join-couple-form" class="search-bar">
          <input name="code" placeholder="CASAL-123456" autocomplete="off" required />
          <button class="btn secondary" type="submit">Entrar</button>
        </form>
      </section>`;

  return `<div class="section-title"><h2>💕 Espaço do casal</h2></div>${topo}${entrar}`;
}

function profileTemplate() {
  const profile = state.profile;
  const episodes = state.dramas.reduce((sum, drama) => sum + Number(drama.currentEpisode || 0), 0);

  return `
    <div class="profile-head">
      <img class="avatar lg" src="${esc(avatarUrl(profile))}" alt="Foto de perfil" />
      <div>
        <h2 style="margin:0">${esc(profile.name || "Perfil")}</h2>
        <p class="muted" style="margin:4px 0 0">${esc(profile.nickname || profile.type || "")}</p>
        ${titulosGanhos()[0] ? `<span class="chip" style="margin-top:8px;display:inline-flex">🏆 ${esc(titulosGanhos()[0])}</span>` : ""}
      </div>
    </div>
    <div class="section-title"><h2>🔗 Convidar ${gx("amigos", "amigas", "gente")}</h2></div>
    <section class="form-card">
      <p class="muted" style="margin:0 0 10px">Seu código de convite: <strong style="color:var(--cor-texto)">${esc(profile.inviteCode || "—")}</strong>. Cada pessoa que entrar pelo seu link fica registrada como ${gx("convidado", "convidada", "convidada(o)")} por você.</p>
      <div class="actions" style="margin:0">
        <button class="btn" type="button" data-invite-share>${icon("share")} Convidar no WhatsApp</button>
        <button class="btn ghost" type="button" data-invite-copy>Copiar link</button>
      </div>
    </section>
    ${coupleProfileSection()}
    <section class="form-card">
      <form id="profile-form" class="form-grid">
        ${profileFields(profile)}
        <div class="actions field full">
          <button class="btn" type="submit">Salvar perfil</button>
        </div>
      </form>
    </section>
    <section class="grid stats">
      <div class="stat"><span class="muted">Doramas assistidos</span><strong>${byStatus("finished").length}</strong></div>
      <div class="stat"><span class="muted">Episódios assistidos</span><strong>${episodes}</strong></div>
      <div class="stat"><span class="muted">Favoritos</span><strong>${byStatus("favorites").length}</strong></div>
      <div class="stat"><span class="muted">Gênero favorito</span><strong>${favoriteGenre()}</strong></div>
      <div class="stat"><span class="muted">Nota média</span><strong>${averageRating()}</strong></div>
    </section>
    <div class="section-title"><h2>📊 Suas estatísticas</h2></div>
    <section class="grid cards">
      ${funnyStats().map((linha) => `<div class="card">${linha}</div>`).join("")}
    </section>
    <div class="section-title"><h2>🏆 Conquistas</h2></div>
    <section class="badge-grid">
      ${badges().map((b) => `<div class="badge ${b.earned ? "" : "locked"}"><span class="badge-emoji">${b.emoji}</span><strong>${esc(b.nome)}</strong><small>${esc(b.desc)}</small></div>`).join("")}
    </section>
    <div class="section-title"><h2>💗 Ranking emocional</h2></div>
    ${rankingEmocionalTemplate()}
    <div class="section-title"><h2>🕰️ Linha do tempo dorameira</h2></div>
    ${linhaDoTempoTemplate()}
    <div class="section-title"><h2>⚰️ Cemitério dos dropados</h2></div>
    ${cemiterioTemplate()}
    <div class="section-title"><h2>💞 Casais que eu shippo</h2></div>
    ${casaisTemplate()}
    <div class="section-title"><h2>⭐ Favoritos especiais</h2></div>
    ${favoritosTemplate()}
    <div class="section-title"><h2>❓ Como usar o app</h2></div>
    <section class="form-card">
      <p class="muted" style="margin:0 0 10px">Reveja o passo a passo do Dorama Club quando quiser.</p>
      <div class="actions" style="margin:0">
        <button class="btn ghost" type="button" data-open-tutorial>Ver tutorial de novo</button>
      </div>
    </section>
    <div class="section-title"><h2>🔒 Segurança</h2></div>
    <section class="form-card">
      <form id="change-pass-form" class="form-grid">
        <div class="field full">
          <label for="changePass">Trocar senha</label>
          <input id="changePass" name="password" type="password" minlength="6" placeholder="nova senha (mínimo 6)" required />
        </div>
        <div class="actions field full"><button class="btn secondary" type="submit">Salvar nova senha</button></div>
      </form>
    </section>
    <div class="section-title">
      <h2>${icon("paint")} Tema do app</h2>
    </div>
    ${temasTemplate()}
  `;
}

function casaisTemplate() {
  const dramasComTitulo = state.dramas.map((d) => d.title);
  const form = `
    <section class="form-card">
      <form id="casal-form" class="form-grid">
        <div class="field">
          <label for="casalNames">O casal</label>
          <input id="casalNames" name="names" placeholder="Ex.: protagonistas de Pretendente Surpresa" required />
        </div>
        <div class="field">
          <label for="casalCategory">Categoria</label>
          <select id="casalCategory" name="category">
            ${casalCategorias.map((c) => `<option>${esc(c)}</option>`).join("")}
          </select>
        </div>
        <div class="field full">
          <label for="casalDrama">Dorama (opcional)</label>
          <input id="casalDrama" name="dramaTitle" list="casal-dramas" placeholder="De qual dorama?" />
          <datalist id="casal-dramas">${dramasComTitulo.map((t) => `<option value="${esc(t)}"></option>`).join("")}</datalist>
        </div>
        <div class="actions field full"><button class="btn secondary" type="submit">Adicionar casal</button></div>
      </form>
    </section>
  `;
  let lista;
  if (casaisFor !== (authUser?.id || "_")) {
    lista = `<div class="empty">Carregando seus casais…</div>`;
  } else if (!casais.length) {
    lista = `<div class="empty">Você ainda não shippa ninguém por aqui. 💔</div>`;
  } else {
    lista = `<section class="grid cards">${casais
      .map(
        (c) => `<div class="card"><span class="chip">${esc(c.category || "Casal")}</span><strong style="margin-top:6px">${esc(c.names)}</strong>${c.drama_title ? `<span class="muted">${esc(c.drama_title)}</span>` : ""}<div class="mini-actions"><button data-del-casal="${c.id}">${icon("trash")} Tirar</button></div></div>`,
      )
      .join("")}</section>`;
  }
  return form + lista;
}

function favoritosTemplate() {
  const dramasComTitulo = state.dramas.map((d) => d.title);
  const form = `
    <section class="form-card">
      <form id="favorito-form" class="form-grid">
        <div class="field">
          <label for="favCategory">Categoria</label>
          <select id="favCategory" name="category">
            ${favoritoCategorias.map((c) => `<option>${esc(c)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="favValue">Qual?</label>
          <input id="favValue" name="value" placeholder="Ex.: o vilão de Vincenzo" required />
        </div>
        <div class="field full">
          <label for="favDrama">Dorama (opcional)</label>
          <input id="favDrama" name="dramaTitle" list="fav-dramas" placeholder="De qual dorama?" />
          <datalist id="fav-dramas">${dramasComTitulo.map((t) => `<option value="${esc(t)}"></option>`).join("")}</datalist>
        </div>
        <div class="actions field full"><button class="btn secondary" type="submit">Adicionar favorito</button></div>
      </form>
    </section>
  `;
  let lista;
  if (favoritosFor !== (authUser?.id || "_")) {
    lista = `<div class="empty">Carregando…</div>`;
  } else if (!favoritos.length) {
    lista = `<div class="empty">Adicione seus personagens, vilões, cenas e trilhas favoritas. ⭐</div>`;
  } else {
    lista = `<section class="grid cards">${favoritos
      .map(
        (f) => `<div class="card"><span class="chip">${esc(f.category)}</span><strong style="margin-top:6px">${esc(f.value)}</strong>${f.drama_title ? `<span class="muted">${esc(f.drama_title)}</span>` : ""}<div class="mini-actions"><button data-del-favorito="${f.id}">${icon("trash")} Tirar</button></div></div>`,
      )
      .join("")}</section>`;
  }
  return form + lista;
}

async function loadFavoritosData() {
  if (!cloudOn()) {
    favoritosFor = authUser?.id || "_";
    favoritos = [];
    render();
    return;
  }
  favoritosFor = authUser.id;
  try {
    favoritos = await loadFavoritos(authUser.id);
  } catch {
    favoritos = [];
  }
  render();
}

async function handleAddFavorito(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const value = String(data.value || "").trim();
  if (!value) return;
  try {
    await addFavorito(authUser.id, { category: data.category, value, dramaTitle: data.dramaTitle });
    favoritos = await loadFavoritos(authUser.id);
    render();
    toast("Favorito salvo! ⭐");
  } catch {
    toast("Não consegui salvar.");
  }
}

async function handleChangePassword(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const pass = new FormData(form).get("password");
  try {
    await updatePassword(pass);
    form.reset();
    toast("Senha alterada! 💜");
  } catch (error) {
    toast(error?.message || "Não consegui trocar a senha.");
  }
}

async function handleDeleteFavorito(id) {
  try {
    await deleteFavorito(id);
    favoritos = favoritos.filter((f) => f.id !== id);
    render();
    toast("Removido.");
  } catch {
    toast("Não consegui remover.");
  }
}

function funnyStats() {
  const episodes = state.dramas.reduce((sum, d) => sum + Number(d.currentEpisode || 0), 0);
  const choros = state.dramas.filter((d) => Number(d.cry) > 0).length;
  const drops = byStatus("dropped").length;
  const since = state.profile?.since;
  const horas = Math.round(episodes * 1.05);
  const comecados = state.dramas.filter((d) => d.status !== "wishlist").length;
  const taxaDrop = comecados ? Math.round((drops / comecados) * 100) : 0;
  const linhas = [
    `Você já assistiu <strong>${episodes}</strong> episódios — umas <strong>${horas}h</strong> de tela. ⏰`,
    `Você chorou oficialmente em <strong>${choros}</strong> ${choros === 1 ? "dorama" : "doramas"}.`,
    `Seu gênero mais assistido é <strong>${favoriteGenre()}</strong>.`,
  ];
  if (comecados) linhas.push(`Você dropa <strong>${taxaDrop}%</strong> dos doramas que começa.`);
  if (drops) linhas.push(`Foram <strong>${drops}</strong> ${drops === 1 ? "dorama dropado" : "doramas dropados"} sem dó.`);
  if (since) linhas.push(`Sua vida dorameira começou em <strong>${esc(since)}</strong>.`);
  return linhas;
}

function titulosGanhos() {
  const dramas = state.dramas;
  const eps = dramas.reduce((s, d) => s + Number(d.currentEpisode || 0), 0);
  const list = [];
  if (dramas.some((d) => Number(d.cry) >= 9)) list.push("Sofredora Premium 😭");
  if (byStatus("dropped").length >= 3) list.push("Rainha do Drop ✂️");
  if (state.profile?.type === "A que ama um CEO frio") list.push("CEO Defender 🧊");
  if (eps >= 100) list.push("Maratonista 🏃‍♀️");
  if (byStatus("finished").length >= 10) list.push("Veterana 🎖️");
  if (byStatus("favorites").length >= 5) list.push("Coração Mole 💕");
  return list;
}

function cemiterioTemplate() {
  const dropados = byStatus("dropped");
  if (!dropados.length) return `<div class="empty">Nenhum dorama dropado. Você é forte. 💪</div>`;
  return `<section class="grid cards">${dropados
    .map(
      (d) => `<div class="card cemiterio-card"><span class="muted">⚰️ Descanse em paz</span><strong>${esc(d.title)}</strong>${d.dropReason ? `<span class="muted">“${esc(d.dropReason)}”</span>` : ""}<span class="muted">parou no ep. ${d.currentEpisode || 0}</span></div>`,
    )
    .join("")}</section>`;
}

function badges() {
  const dramas = state.dramas;
  const finished = byStatus("finished");
  const episodes = dramas.reduce((sum, d) => sum + Number(d.currentEpisode || 0), 0);
  const since = Number(state.profile?.since) || 9999;
  const has = (fn) => dramas.some(fn);
  return [
    { emoji: "🌟", nome: "Dorameira Raiz", desc: "Assiste desde antes de virar moda", earned: since <= 2019 },
    { emoji: "😭", nome: "Sofredora Profissional", desc: "Marcou choro 10/10", earned: has((d) => Number(d.cry) >= 10) },
    { emoji: "🏃‍♀️", nome: "Maratonista", desc: "Mais de 100 episódios assistidos", earned: episodes >= 100 },
    { emoji: "✂️", nome: "Rainha do Drop", desc: "Dropou 3+ doramas", earned: byStatus("dropped").length >= 3 },
    { emoji: "💪", nome: "Sem Medo de Sofrer", desc: "Finalizou um dorama de chorar", earned: finished.some((d) => Number(d.cry) >= 8) },
    { emoji: "💔", nome: "Não Superei", desc: "Tem um dorama favorito", earned: byStatus("favorites").length > 0 },
    { emoji: "🧊", nome: "CEO Lover", desc: "Tipo: ama um CEO frio", earned: state.profile?.type === "A que ama um CEO frio" },
    { emoji: "⭐", nome: "Crítica", desc: "Avaliou 5+ doramas", earned: dramas.filter((d) => d.personalRating).length >= 5 },
  ];
}

function topPor(campo) {
  const lista = state.dramas.filter((d) => Number(d[campo]) > 0);
  if (!lista.length) return null;
  return lista.reduce((a, b) => (Number(b[campo]) > Number(a[campo]) ? b : a));
}

function linhaDoTempoTemplate() {
  const eventos = [];
  const since = state.profile?.since;
  if (since) eventos.push([since, "🌱 Começou a vida dorameira"]);
  const dezao = state.dramas.find((d) => Number(d.personalRating) === 10);
  if (dezao) eventos.push([dezao.year || "—", `💯 Primeiro 10/10: ${dezao.title}`]);
  const favorito = byStatus("favorites")[0];
  if (favorito) eventos.push([favorito.year || "—", `💖 Favoritou: ${favorito.title}`]);
  const dropado = byStatus("dropped")[0];
  if (dropado) eventos.push([dropado.year || "—", `✂️ Primeiro drop: ${dropado.title}`]);
  const maratona = state.dramas.slice().sort((a, b) => Number(b.currentEpisode || 0) - Number(a.currentEpisode || 0))[0];
  if (maratona && Number(maratona.currentEpisode) > 0) eventos.push([maratona.year || "—", `🏃‍♀️ Maior maratona: ${maratona.title} (${maratona.currentEpisode} eps)`]);
  eventos.push([new Date().getFullYear(), "💜 Entrou no Dorama Club"]);

  eventos.sort((a, b) => Number(a[0]) - Number(b[0]));
  if (eventos.length <= 1) return `<div class="empty">Sua linha do tempo vai se montando conforme você usa o app. ✨</div>`;
  return `<section class="timeline">${eventos
    .map(([ano, texto]) => `<div class="tl-item"><span class="tl-ano">${esc(ano)}</span><span class="tl-texto">${esc(texto)}</span></div>`)
    .join("")}</section>`;
}

function rankingEmocionalTemplate() {
  const itens = [
    ["😭 Mais me fez chorar", topPor("cry"), "cry"],
    ["😂 Mais me fez rir", topPor("laugh"), "laugh"],
    ["🔥 Mais me fez surtar", topPor("hype"), "hype"],
    ["😡 Mais me fez passar raiva", topPor("rage"), "rage"],
  ];
  const conforto = state.dramas.find((d) => d.comfort);
  const recomendo = state.dramas
    .filter((d) => d.recommend === "Sim" && d.personalRating)
    .sort((a, b) => Number(b.personalRating) - Number(a.personalRating))[0];
  if (conforto) itens.push(["🧸 Meu dorama conforto", conforto, null]);
  if (recomendo) itens.push(["📣 Que mais recomendo", recomendo, "personalRating"]);

  const cards = itens
    .filter(([, drama]) => drama)
    .map(([label, drama, campo]) => `<div class="card"><span class="muted">${label}</span><strong>${esc(drama.title)}</strong>${campo ? `<span class="muted">${campo === "personalRating" ? `nota ${esc(drama[campo])}` : `${drama[campo]}/10`}</span>` : ""}</div>`)
    .join("");
  return cards ? `<section class="grid cards">${cards}</section>` : `<div class="empty">Avalie alguns doramas (choro, surto, raiva) pra montar seu ranking.</div>`;
}

function temasTemplate() {
  const atual = temaAtual();
  const custom = atual === "custom" ? temaCorrente() : null;
  const buscaDorama = `
    <section class="form-card">
      <p class="muted" style="margin:0 0 8px;font-weight:800">🎬 Tema de qualquer dorama</p>
      <p class="muted" style="margin:0 0 10px;font-size:.82rem">Busca um dorama e o app fica com a cara dele (fundo e cores tiradas da imagem).</p>
      <form id="tema-search-form" class="search-bar">
        <input name="q" placeholder="Ex.: Goblin, Rainha das Lágrimas…" value="${esc(temaSearch.query)}" autocomplete="off" />
        <button class="btn" type="submit">Buscar</button>
      </form>
      ${temaSearch.loading ? `<p class="muted" style="margin-top:10px">Buscando…</p>` : ""}
      ${temaSearch.results.length
        ? `<div class="search-results">${temaSearch.results
            .slice(0, 12)
            .map(
              (d) => `<button type="button" class="search-result" data-tema-dorama="${d.tmdbId}"><img src="${esc(thumb(d.cover) || POSTER_PLACEHOLDER)}" alt="" loading="lazy" /><span class="search-result-info"><strong>${esc(d.title)}</strong><small>${d.year || "—"}</small></span></button>`,
            )
            .join("")}</div>`
        : ""}
      ${custom ? `<p class="muted" style="margin-top:12px">Tema atual: <strong style="color:var(--cor-texto)">🎬 ${esc(custom.nome)}</strong></p>` : ""}
    </section>`;

  return (
    buscaDorama +
    categorias
    .map((categoria) => {
      const lista = temas.filter((tema) => tema.categoria === categoria);
      return `
        <p class="muted" style="margin:6px 0 8px;font-weight:800">${esc(categoria)}</p>
        <section class="tema-grid">
          ${lista
            .map((tema) => {
              const fundo = tema.backdrop
                ? `background-image:url('${tema.backdrop}')`
                : `background:linear-gradient(135deg, ${tema.variaveis["--cor-primaria"]}, ${tema.variaveis["--cor-secundaria"]})`;
              return `
                <button type="button" class="tema-card ${atual === tema.id ? "active" : ""}" data-tema="${tema.id}">
                  <span class="tema-swatch" style="${fundo}">
                    <span class="emoji">${tema.marca.emoji}</span>
                    <span class="dot" style="background:${tema.variaveis["--cor-primaria"]}"></span>
                  </span>
                  <span class="tema-info"><strong>${esc(tema.nome)}</strong><small>${esc(tema.descricao)}</small></span>
                </button>`;
            })
            .join("")}
        </section>`;
    })
    .join("")
  );
}

function profileFields(profile = {}) {
  return `
    <div class="field">
      <label for="name">Nome</label>
      <input id="name" name="name" value="${profile.name || ""}" placeholder="Ana" required />
    </div>
    <div class="field">
      <label for="nickname">Apelido</label>
      <input id="nickname" name="nickname" value="${profile.nickname || ""}" placeholder="Dorameira Sofredora" />
    </div>
    <div class="field">
      <label for="gender">Como te chamamos?</label>
      <select id="gender" name="gender">
        <option value="ela" ${profile.gender === "ela" || !profile.gender ? "selected" : ""}>No feminino (ela)</option>
        <option value="ele" ${profile.gender === "ele" ? "selected" : ""}>No masculino (ele)</option>
        <option value="neutro" ${profile.gender === "neutro" ? "selected" : ""}>Neutro / tanto faz</option>
      </select>
    </div>
    <div class="field full">
      <label>Foto de perfil</label>
      <div class="avatar-edit">
        <img class="avatar" id="photo-preview" src="${esc(profile.photo || AVATAR_PLACEHOLDER)}" alt="Foto de perfil" />
        <div>
          <input type="file" id="photo-file" accept="image/*" />
          <input type="hidden" name="photo" id="photo-input" value="${esc(profile.photo || "")}" />
          <p class="muted" style="font-size:.76rem;margin:6px 0 0">Escolha uma foto do aparelho.</p>
        </div>
      </div>
    </div>
    <div class="field">
      <label for="since">${gx("Dorameiro", "Dorameira", "No mundo dos doramas")} desde</label>
      <input id="since" name="since" type="number" min="1950" max="2026" value="${profile.since || "2018"}" />
    </div>
    <div class="field full">
      <label for="type">Tipo de ${gx("dorameiro", "dorameira", "fã de dorama")}</label>
      <select id="type" name="type">
        ${dramaTypes.map((type) => `<option ${profile.type === type ? "selected" : ""}>${type}</option>`).join("")}
      </select>
    </div>
  `;
}

function dramaGrid(dramas) {
  if (!dramas.length) return `<div class="empty">Nada aqui ainda. Adicione um dorama para começar essa lista.</div>`;
  return `<section class="drama-grid">${dramas.map(dramaCard).join("")}</section>`;
}

async function openDetail(id) {
  modal = { type: "detail", id };
  detailProviders = null;
  detailSurtos = null;
  detailProgress = null;
  render();
  const drama = state.dramas.find((item) => item.id === id);

  // Posso comentar com quem (progresso das doramigas neste dorama).
  if (cloudOn() && state.club && drama?.tmdbId) {
    clubDramaProgress(state.club.id, drama.tmdbId)
      .then((lista) => {
        if (modal?.type === "detail" && modal.id === id) {
          detailProgress = lista;
          render();
        }
      })
      .catch(() => {
        detailProgress = [];
      });
  } else {
    detailProgress = [];
  }

  // Diário de surtos (do banco).
  if (cloudOn()) {
    loadSurtos(id)
      .then((lista) => {
        if (modal?.type === "detail" && modal.id === id) {
          detailSurtos = lista;
          render();
        }
      })
      .catch(() => {
        detailSurtos = [];
      });
  } else {
    detailSurtos = [];
  }

  // Onde assistir (TMDB).
  if (drama?.tmdbId && tmdbReady()) {
    const lista = await getWatchProviders(drama.tmdbId);
    if (modal?.type === "detail" && modal.id === id) {
      detailProviders = lista;
      render();
    }
  } else {
    detailProviders = [];
  }
}

function semaforoEmoji(value) {
  return { verde: "🟢 Vale", amarelo: "🟡 Talvez", vermelho: "🔴 Não", partido: "💔 Sofra" }[value] || value;
}

function dramaCard(drama) {
  const ep = Number(drama.currentEpisode || 0);
  const total = Number(drama.episodes || 0);
  const pct = total ? Math.min(100, Math.round((ep / total) * 100)) : 0;
  const showProgress = drama.status !== "wishlist" && total > 0 && ep > 0;
  const temEpisodio = drama.status !== "wishlist" && total > 0;
  // Só repete o status quando a aba mistura status (favoritos / conforto).
  const mostrarStatus = state.activeList === "favorites" || state.activeList === "comfort";
  const faltam = drama.status === "watching" && total ? total - ep : 0;
  const meta = drama.status === "wishlist"
    ? `${drama.year || "—"} · ${esc(drama.priority || "Quero assistir")}`
    : `${drama.year || "—"}${mostrarStatus ? ` · ${statusLabel(drama.status)}` : ""}${(drama.genres || [])[0] ? ` · ${esc(drama.genres[0])}` : ""}${faltam > 0 ? ` · faltam ${faltam} ep${faltam > 1 ? "s" : ""}` : ""}`;

  const chips = [
    drama.comfort ? `<span class="chip">🧸 Conforto</span>` : "",
    drama.semaforo ? `<span class="chip">${semaforoEmoji(drama.semaforo)}</span>` : "",
    drama.status === "paused" && drama.pauseReason ? `<span class="chip">⏸️ ${esc(drama.pauseReason)}</span>` : "",
    drama.status === "dropped" && drama.dropReason ? `<span class="chip">🚫 ${esc(drama.dropReason)}</span>` : "",
    Number(drama.cry) > 0 ? `<span class="chip choro">😭 ${drama.cry}</span>` : "",
    Number(drama.laugh) > 0 ? `<span class="chip riso">😂 ${drama.laugh}</span>` : "",
    Number(drama.hype) > 0 ? `<span class="chip surto">🔥 ${drama.hype}</span>` : "",
    Number(drama.rage) > 0 ? `<span class="chip raiva">😡 ${drama.rage}</span>` : "",
    drama.personalRating ? `<span class="chip">⭐ ${esc(drama.personalRating)}</span>` : "",
  ].filter(Boolean).join("");

  return `
    <article class="drama-card list-item" data-title="${esc((drama.title || "").toLowerCase())}">
      <button class="poster-btn" data-detail="${drama.id}" aria-label="Ver ${esc(drama.title)}">
        <img class="poster" src="${esc(drama.cover || POSTER_PLACEHOLDER)}" alt="Capa de ${esc(drama.title)}" loading="lazy" decoding="async" />
        ${drama.favorite ? `<span class="poster-fav">${icon("heart")}</span>` : ""}
      </button>
      <div class="drama-body">
        <h3 class="drama-title" data-detail="${drama.id}">${esc(drama.title)}</h3>
        <p class="meta">${meta}</p>
        ${temEpisodio ? `<button class="ep-set card-ep" data-set-ep="${drama.id}">Ep. ${ep}/${total} ✏️</button>` : ""}
        ${showProgress ? `<div class="progress"><span style="width:${pct}%"></span></div>` : ""}
        ${chips ? `<div class="chips">${chips}</div>` : ""}
        <div class="mini-actions">
          ${drama.status === "watching" ? `<button data-plus-one="${drama.id}">${icon("add")} +1 ep</button>` : ""}
          <button class="${drama.favorite ? "fav-on" : ""}" data-toggle-favorite="${drama.id}" title="${drama.favorite ? "Desfavoritar" : "Favoritar"}">${icon("heart")} ${drama.favorite ? "Favorito" : "Favoritar"}</button>
          <select class="move-select" data-move="${drama.id}" title="Mover para outra lista">
            ${statuses.slice(0, 5).map((s) => `<option value="${s.key}" ${drama.status === s.key ? "selected" : ""}>${s.label}</option>`).join("")}
          </select>
        </div>
      </div>
    </article>
  `;
}

const sorteadorFiltros = [
  ["✨ Qualquer um", ""],
  ["🥰 Romance fofo", "fofo"],
  ["😭 Quero sofrer", "sofrer"],
  ["😂 Quero rir", "rir"],
  ["🔪 Vingança", "vinganca"],
  ["🌸 Algo leve", "leve"],
  ["💧 Quero chorar", "chorar"],
  ["😡 Passar raiva", "raiva"],
];

function openSortear() {
  modal = { type: "sortear", result: null };
  render();
}

function sortearComFiltro(tag) {
  let pool = byStatus("wishlist");
  if (tag) {
    const generos = moodGenres[tag] || [];
    const filtrado = pool.filter((d) => (d.genres || []).some((g) => generos.includes(g)));
    if (filtrado.length) pool = filtrado;
  }
  modal.result = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { empty: true };
  render();
}

function sortearModalTemplate() {
  const r = modal.result;
  const resultado = !r
    ? ""
    : r.empty
      ? `<div class="empty" style="margin-top:14px">Nada na watchlist com esse clima. Adicione doramas em "Quero assistir"!</div>`
      : `<div class="card" style="margin-top:14px;text-align:center"><span class="muted">Seu próximo surto será</span><strong style="font-size:1.4rem;display:block;margin:6px 0">${esc(r.title)}</strong><div class="chips" style="justify-content:center">${(r.genres || []).slice(0, 3).map((g) => `<span class="chip">${esc(g)}</span>`).join("")}</div></div>`;
  return `
    <div class="modal">
      <section class="modal-card">
        <div class="modal-head"><div><h2>🎲 Sortear próximo</h2><p class="muted">O que seu coração aguenta hoje?</p></div><button class="close" data-close>×</button></div>
        <div class="mood-row">${sorteadorFiltros.map(([label, tag]) => `<button data-sortear="${tag}">${esc(label)}</button>`).join("")}</div>
        ${resultado}
      </section>
    </div>`;
}

function modalTemplate() {
  if (modal.type === "sortear") return sortearModalTemplate();
  if (modal.type === "profile") {
    return `
      <div class="modal">
        <section class="modal-card">
          <div class="modal-head">
            <div><h2>Criar perfil</h2><p class="muted">Antes de entrar, conte que tipo de dorameira você é.</p></div>
          </div>
          <form id="profile-form" class="form-grid">
            ${profileFields({ name: "Ana", nickname: "Dorameira Sofredora", since: "2018", type: dramaTypes[0] })}
            <div class="actions field full">
              <button class="btn" type="submit">Entrar no Dorama Club</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }

  const drama = state.dramas.find((item) => item.id === modal.id);
  if (!drama) return "";

  return `
    <div class="modal">
      <section class="modal-card">
        <div class="modal-head">
          <div>
            <h2>${drama.title}</h2>
            <p class="muted">${drama.year} · ${drama.episodes} episódios · nota geral ${drama.rating}</p>
          </div>
          <button class="close" data-close>×</button>
        </div>
        <div class="detail">
          <img class="poster" src="${drama.cover}" alt="Capa de ${drama.title}" />
          <form id="drama-form" class="form-grid" data-id="${drama.id}">
            <div class="field full">
              <label>Sinopse</label>
              <p>${esc(drama.synopsis || "Sem sinopse disponível.")}</p>
              <div class="chips">${(drama.genres || []).map((genre) => `<span class="chip">${esc(genre)}</span>`).join("")}</div>
            </div>
            <div class="field full">
              <label>Onde assistir</label>
              ${detailProviders === null
                ? `<p class="muted">Procurando no TMDB…</p>`
                : detailProviders.length
                  ? `<div class="providers">${detailProviders.map((p) => `<span class="provider" title="${esc(p.name)}">${p.logo ? `<img src="${esc(p.logo)}" alt="${esc(p.name)}" />` : ""}<span>${esc(p.name)}</span></span>`).join("")}</div>`
                  : `<p class="muted">Não achei onde assistir no Brasil (ou não está em streaming).</p>`}
            </div>
            <div class="field">
              <label for="status">Status pessoal</label>
              <select id="status" name="status">${statuses.slice(0, 5).map((status) => `<option value="${status.key}" ${drama.status === status.key ? "selected" : ""}>${status.label}</option>`).join("")}</select>
            </div>
            <div class="field" data-when="paused" ${drama.status === "paused" ? "" : "hidden"}>
              <label for="pauseReason">Por que pausou?</label>
              <select id="pauseReason" name="pauseReason">
                ${["", ...pauseReasons].map((item) => `<option value="${item}" ${drama.pauseReason === item ? "selected" : ""}>${item || "—"}</option>`).join("")}
              </select>
            </div>
            <div class="field" data-when="dropped" ${drama.status === "dropped" ? "" : "hidden"}>
              <label for="dropReason">Por que dropou?</label>
              <select id="dropReason" name="dropReason">
                ${["", ...dropReasons].map((item) => `<option value="${item}" ${drama.dropReason === item ? "selected" : ""}>${item || "—"}</option>`).join("")}
              </select>
            </div>
            <div class="field" data-when="finished" ${drama.status === "finished" ? "" : "hidden"}>
              <label for="semaforo">Vale assistir?</label>
              <select id="semaforo" name="semaforo">
                ${semaforoOptions.map(([value, label]) => `<option value="${value}" ${drama.semaforo === value ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label for="currentEpisode">Episódio atual</label>
              <input id="currentEpisode" name="currentEpisode" type="number" min="0" max="${drama.episodes}" value="${drama.currentEpisode || 0}" />
            </div>
            <div class="field">
              <label for="personalRating">Nota pessoal</label>
              <input id="personalRating" name="personalRating" type="number" min="0" max="10" step="0.5" value="${drama.personalRating || ""}" />
            </div>
            <div class="field">
              <label for="cry">Quanto chorou?</label>
              <input id="cry" name="cry" type="range" min="0" max="10" value="${drama.cry || 0}" />
            </div>
            <div class="field">
              <label for="laugh">Quanto riu?</label>
              <input id="laugh" name="laugh" type="range" min="0" max="10" value="${drama.laugh || 0}" />
            </div>
            <div class="field">
              <label for="hype">Quanto surtou?</label>
              <input id="hype" name="hype" type="range" min="0" max="10" value="${drama.hype || 0}" />
            </div>
            <div class="field">
              <label for="rage">Quanto passou raiva?</label>
              <input id="rage" name="rage" type="range" min="0" max="10" value="${drama.rage || 0}" />
            </div>
            <div class="field">
              <label for="recommend">Você recomenda?</label>
              <select id="recommend" name="recommend">
                ${["", "Sim", "Talvez", "Não"].map((item) => `<option value="${item}" ${drama.recommend === item ? "selected" : ""}>${item || "—"}</option>`).join("")}
              </select>
            </div>
            <div class="field full">
              <label for="note">Comentário sem spoiler</label>
              <textarea id="note" name="note" placeholder="Me destruiu, mas eu amei cada segundo.">${drama.note || ""}</textarea>
            </div>
            <label class="field"><input type="checkbox" name="favorite" ${drama.favorite ? "checked" : ""} /> Favorito</label>
            <label class="field"><input type="checkbox" name="comfort" ${drama.comfort ? "checked" : ""} /> Dorama conforto</label>
            <div class="actions field full">
              <button class="btn" type="submit">Salvar detalhes</button>
              <button class="btn secondary" type="button" data-share-card="${drama.id}">${icon("share")} Compartilhar</button>
              ${drama.status === "finished" ? `<button class="btn secondary" type="button" data-certificado="${drama.id}">🎓 Certificado</button>` : ""}
              <button class="btn danger" type="button" data-remove="${drama.id}">${icon("trash")} Remover</button>
            </div>
          </form>
        </div>
        ${podeComentarTemplate(drama)}
        ${diaryTemplate(drama)}
      </section>
    </div>
  `;
}

function podeComentarTemplate(drama) {
  if (!state.club || !drama.tmdbId) return "";
  if (detailProgress === null) return `<div class="section-title" style="margin-top:10px"><h2>💬 Posso comentar com quem?</h2></div><p class="muted">Vendo o progresso das doramigas…</p>`;
  const outras = detailProgress.filter((m) => m.user_id !== authUser?.id);
  if (!outras.length) return "";
  const meu = Number(drama.currentEpisode || 0);
  const livres = [];
  const cuidado = [];
  outras.forEach((m) => {
    const ep = Number(m.current_episode || 0);
    const label = m.status === "finished" ? `${esc(m.name)} — finalizou` : `${esc(m.name)} — ep. ${ep}`;
    // Pode falar livre se ela está no mesmo ponto ou à frente do seu episódio.
    if (m.status === "finished" || ep >= meu) livres.push(label);
    else cuidado.push(label);
  });
  return `
    <div class="section-title" style="margin-top:10px"><h2>💬 Posso comentar com quem?</h2></div>
    <section class="grid cards">
      <div class="card"><span class="muted">Pode falar livre (no seu ponto ou à frente)</span>${livres.length ? livres.map((l) => `<strong style="font-weight:600">${l}</strong>`).join("") : `<strong style="font-weight:600">Ninguém ainda</strong>`}</div>
      <div class="card"><span class="muted">Cuidado com spoiler (estão atrás)</span>${cuidado.length ? cuidado.map((l) => `<strong style="font-weight:600">${l}</strong>`).join("") : `<strong style="font-weight:600">Ninguém atrás 🎉</strong>`}</div>
    </section>
  `;
}

function diaryTemplate(drama) {
  return `
    <div class="section-title" style="margin-top:10px"><h2>📔 Diário de surtos</h2></div>
    <form id="surto-form" class="form-grid" data-drama="${drama.id}">
      <div class="field">
        <label for="surtoEp">Episódio</label>
        <input id="surtoEp" name="episode" type="number" min="0" value="${drama.currentEpisode || 0}" />
      </div>
      <label class="field" style="align-self:end"><input type="checkbox" name="shared" /> Compartilhar com doramigas</label>
      <div class="field full">
        <label for="surtoBody">O que rolou nesse episódio?</label>
        <textarea id="surtoBody" name="body" placeholder="Eu sabia que ele ia fazer isso, mas mesmo assim fiquei chocada…"></textarea>
      </div>
      <div class="actions field full"><button class="btn secondary" type="submit">Registrar surto</button></div>
    </form>
    ${surtosListTemplate()}
  `;
}

function surtosListTemplate() {
  if (detailSurtos === null) return `<p class="muted">Carregando seu diário…</p>`;
  if (!detailSurtos.length) return `<div class="empty">Nenhum surto registrado ainda neste dorama.</div>`;
  return `<section class="grid">${detailSurtos
    .map(
      (s) => `
    <div class="card comment-card">
      <div class="comment-head"><strong>Episódio ${s.episode || "?"}</strong><span class="muted">${timeAgo(s.created_at)}${s.shared ? " · compartilhado" : ""}</span></div>
      <p>${esc(s.body)}</p>
      <div class="mini-actions"><button data-del-surto="${s.id}">${icon("trash")} Apagar</button></div>
    </div>`,
    )
    .join("")}</section>`;
}

function bindWelcome() {
  document.querySelectorAll("[data-start]").forEach((button) => {
    listen(button, "click", () => {
      modal = { type: "profile" };
      render();
    });
  });
}

function bindAuth() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    listen(button, "click", () => {
      authMode = button.dataset.authMode;
      render();
    });
  });
  listen(document.querySelector("#auth-form"), "submit", handleAuthSubmit);
  listen(document.querySelector("[data-forgot]"), "click", handleForgot);
}

async function handleForgot() {
  const email = String(document.querySelector("#auth-form [name='email']")?.value || "").trim();
  if (!email) {
    toast("Digite seu e-mail no campo acima primeiro.");
    return;
  }
  try {
    await resetPassword(email);
    toast("Enviamos um link de recuperação pro seu e-mail. 💌");
  } catch {
    toast("Não consegui enviar agora. Confira o e-mail.");
  }
}

async function handleRecoverySubmit(event) {
  event.preventDefault();
  const pass = new FormData(event.currentTarget).get("password");
  try {
    await updatePassword(pass);
    recovery = false;
    render();
    toast("Senha alterada! 💜");
  } catch (error) {
    toast(error?.message || "Não consegui salvar a senha.");
  }
}

function authError(error) {
  const message = (error?.message || "").toLowerCase();
  if (message.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (message.includes("already registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (message.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (message.includes("email")) return "Confira o e-mail digitado.";
  return error?.message || "Algo deu errado. Tente de novo.";
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (authBusy) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  authBusy = true;
  render();
  try {
    if (authMode === "signup") {
      // Guarda o código digitado pra registrar quem convidou (depois do perfil).
      if (data.invite) localStorage.setItem(INVITE_KEY, String(data.invite).trim().toUpperCase());
      await signUp(String(data.email).trim(), data.password, String(data.name || "").trim());
      const user = await getCurrentUser();
      if (!user) {
        // Confirmação de e-mail está ligada: ainda não há sessão.
        authBusy = false;
        authMode = "signin";
        toast("Conta criada! Confirme o e-mail e depois entre.");
        render();
        return;
      }
    } else {
      await signIn(String(data.email).trim(), data.password);
    }
    // onAuthChange faz o hydrate + render e zera authBusy.
  } catch (error) {
    authBusy = false;
    toast(authError(error));
    render();
  }
}

async function handleLogout() {
  teardownClubRealtime();
  await signOut();
  authUser = null;
  state.profile = null;
  state.dramas = [];
  state.club = null;
  state.clubs = [];
  state.couple = null;
  state.view = "home";
  addingClub = false;
  moodResult = null;
  clubMembers = [];
  clubMembersFor = null;
  clubFeedItems = [];
  clubFeedFor = null;
  clubSocial = { for: null, activities: [], picks: [], ranking: [], shared: [], reactions: [], commonDramas: [], list: [], compat: [], featured: null, polls: [], events: [], points: [], challenges: [], chat: [] };
  coupleFor = null;
  coupleMembers = [];
  coupleDramas = [];
  coupleDiary = [];
  coupleAbout = {};
  coupleLetters = [];
  coupleDiaryDay = null;
  coupleDiaryFoto = null;
  coupleLetterFoto = null;
  coupleLoading = false;
  casais = [];
  casaisFor = null;
  favoritos = [];
  favoritosFor = null;
  admin = { loaded: false, loading: false, error: "", overview: null, users: [], clubs: [], comments: [] };
  saveState();
  render();
}

function bindPhotoPicker() {
  const file = document.querySelector("#photo-file");
  if (!file) return;
  listen(file, "change", async (event) => {
    const f = event.target.files?.[0];
    if (!f) return;
    try {
      const dataUrl = await resizeImage(f, 256);
      const input = document.querySelector("#photo-input");
      const preview = document.querySelector("#photo-preview");
      if (input) input.value = dataUrl;
      if (preview) preview.src = dataUrl;
    } catch {
      toast("Não consegui carregar essa imagem.");
    }
  });
}

async function loadCasaisData() {
  if (!cloudOn()) {
    casaisFor = authUser?.id || "_";
    casais = [];
    render();
    return;
  }
  casaisFor = authUser.id;
  try {
    casais = await loadCasais(authUser.id);
  } catch {
    casais = [];
  }
  render();
}

async function handleAddCasal(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const names = String(data.names || "").trim();
  if (!names) return;
  try {
    await addCasal(authUser.id, { names, category: data.category, dramaTitle: data.dramaTitle });
    casais = await loadCasais(authUser.id);
    render();
    toast("Casal shippado! 💞");
  } catch {
    toast("Não consegui salvar o casal.");
  }
}

async function handleDeleteCasal(id) {
  try {
    await deleteCasal(id);
    casais = casais.filter((c) => c.id !== id);
    render();
    toast("Casal removido.");
  } catch {
    toast("Não consegui remover.");
  }
}

async function handleAddSurto(event) {
  event.preventDefault();
  const dramaId = event.currentTarget.dataset.drama;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const body = String(data.body || "").trim();
  if (!body) return;
  try {
    await addSurto(authUser.id, { dramaId, episode: data.episode, body, shared: Boolean(data.shared) });
    detailSurtos = await loadSurtos(dramaId);
    render();
    toast("Surto registrado! 😭");
  } catch {
    toast("Não consegui salvar o surto.");
  }
}

async function handleDeleteSurto(id) {
  try {
    await deleteSurto(id);
    detailSurtos = (detailSurtos || []).filter((s) => s.id !== id);
    render();
    toast("Surto apagado.");
  } catch {
    toast("Não consegui apagar.");
  }
}

async function removeDrama(id) {
  const drama = state.dramas.find((item) => item.id === id);
  if (!drama) return;
  if (!(await confirmar(`Remover “${drama.title}”?`, { sub: "Sai das suas listas (e da nuvem).", ok: "Remover", danger: true }))) return;
  if (cloudOn()) deleteDramaRemote(id).catch(() => {});
  modal = null;
  setState({ dramas: state.dramas.filter((item) => item.id !== id) });
  toast("Dorama removido.");
}

function bindShell() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    listen(button, "click", () => setState({ view: button.dataset.view }));
  });

  document.querySelectorAll("[data-list]").forEach((button) => {
    listen(button, "click", () => setState({ view: "lists", activeList: button.dataset.list }));
  });

  document.querySelectorAll("[data-active-list]").forEach((button) => {
    listen(button, "click", () => setState({ activeList: button.dataset.activeList }));
  });

  const buscaLista = document.querySelector("#list-search");
  if (buscaLista) {
    listen(buscaLista, "input", () => {
      const q = buscaLista.value.trim().toLowerCase();
      let visiveis = 0;
      document.querySelectorAll(".list-item").forEach((card) => {
        const ok = !q || (card.dataset.title || "").includes(q);
        card.style.display = ok ? "" : "none";
        if (ok) visiveis += 1;
      });
      const vazio = document.querySelector("#list-empty");
      if (vazio) vazio.hidden = visiveis !== 0;
    });
  }
  listen(document.querySelector("#list-sort"), "change", (event) => {
    listSort = event.target.value;
    render();
  });
  listen(document.querySelector("[data-toggle-view]"), "click", () => {
    listView = listView === "grade" ? "lista" : "grade";
    render();
  });
  document.querySelectorAll("[data-move]").forEach((sel) => {
    listen(sel, "change", () => moverStatus(sel.dataset.move, sel.value));
  });

  document.querySelectorAll("[data-plus-one]").forEach((button) => {
    listen(button, "click", () => incrementEpisode(button.dataset.plusOne));
  });
  document.querySelectorAll("[data-set-ep]").forEach((button) => {
    listen(button, "click", () => setEpisodeQuick(button.dataset.setEp));
  });

  document.querySelectorAll("[data-detail]").forEach((button) => {
    listen(button, "click", () => openDetail(button.dataset.detail));
  });

  document.querySelectorAll("[data-toggle-favorite]").forEach((button) => {
    listen(button, "click", () => toggleField(button.dataset.toggleFavorite, "favorite"));
  });
  document.querySelectorAll("[data-comentar-surto]").forEach((button) => {
    listen(button, "click", () => handleComentarSurto(button.dataset.comentarSurto));
  });
  listen(document.querySelector("[data-rename-club]"), "click", handleRenameClub);
  listen(document.querySelector("[data-edit-club-about]"), "click", handleEditClubAbout);
  document.querySelectorAll("[data-switch-club]").forEach((button) => {
    listen(button, "click", () => handleSwitchClub(button.dataset.switchClub));
  });
  document.querySelectorAll("[data-club-tab]").forEach((button) => {
    listen(button, "click", () => {
      clubTab = button.dataset.clubTab;
      render();
    });
  });
  listen(document.querySelector("[data-add-club]"), "click", () => {
    addingClub = true;
    render();
  });
  listen(document.querySelector("[data-cancel-add-club]"), "click", () => {
    addingClub = false;
    render();
  });

  document.querySelectorAll("[data-pick]").forEach((button) => {
    listen(button, "click", () => pickResult(Number(button.dataset.pick)));
  });

  document.querySelectorAll("[data-admin-del-user]").forEach((button) => {
    listen(button, "click", () => handleAdminDeleteUser(button.dataset.adminDelUser, button.dataset.adminUserName));
  });

  const adminBusca = document.querySelector("[data-admin-user-search]");
  if (adminBusca) {
    listen(adminBusca, "input", (event) => {
      adminUserSearch = event.target.value;
      const grid = document.querySelector(".admin-people-grid");
      const conta = document.querySelector(".admin-people .admin-panel-head > span");
      if (!grid) { render(); return; }
      const busca = adminUserSearch.trim().toLowerCase();
      const todos = admin.users || [];
      const filtrados = busca
        ? todos.filter((u) => `${u.name || ""} ${u.nickname || ""} ${u.email || ""}`.toLowerCase().includes(busca))
        : todos;
      if (conta) conta.textContent = busca ? `${filtrados.length}/${todos.length}` : String(todos.length);
      grid.innerHTML = filtrados.length
        ? filtrados.map((u) => adminPersonCard(u)).join("")
        : `<div class="empty">Ninguém bate com “${esc(adminUserSearch)}”.</div>`;
      grid.querySelectorAll("[data-admin-del-user]").forEach((button) => {
        listen(button, "click", () => handleAdminDeleteUser(button.dataset.adminDelUser, button.dataset.adminUserName));
      });
    });
  }

  document.querySelectorAll("[data-admin-del-club]").forEach((button) => {
    listen(button, "click", () => handleAdminDeleteClub(button.dataset.adminDelClub, button.dataset.adminClubName));
  });

  document.querySelectorAll("[data-mood]").forEach((button) => {
    listen(button, "click", () => sugerirPorHumor(button.dataset.mood));
  });
  document.querySelectorAll("[data-mood-home]").forEach((button) => {
    listen(button, "click", () => sugerirNoHome(button.dataset.moodHome));
  });
  document.querySelectorAll("[data-mood-share]").forEach((button) => {
    listen(button, "click", () => handleMoodShare(button.dataset.moodShare));
  });
  listen(document.querySelector("[data-share-day]"), "click", shareMeuDia);

  document.querySelectorAll("[data-discover]").forEach((button) => {
    listen(button, "click", () => addFromDiscover(button.dataset.discover));
  });
  listen(document.querySelector("[data-discover-refresh]"), "click", () => loadDiscover(true));

  document.querySelectorAll("[data-tema]").forEach((button) => {
    listen(button, "click", () => salvarTema(button.dataset.tema));
  });
  listen(document.querySelector("#tema-search-form"), "submit", runTemaSearch);
  document.querySelectorAll("[data-tema-dorama]").forEach((button) => {
    listen(button, "click", () => {
      const d = temaSearch.results.find((x) => x.tmdbId === Number(button.dataset.temaDorama));
      if (d) usarDoramaComoTema(d);
    });
  });

  listen(document.querySelector("[data-random]"), "click", openSortear);
  listen(document.querySelector("[data-copy-code]"), "click", copyClubCode);
  listen(document.querySelector("[data-logout]"), "click", handleLogout);
  listen(document.querySelector("[data-share-club]"), "click", shareClub);
  listen(document.querySelector("[data-leave-club]"), "click", handleLeaveClub);
  listen(document.querySelector("[data-delete-club]"), "click", handleDeleteClub);
  listen(document.querySelector("[data-invite-share]"), "click", shareInvite);
  listen(document.querySelector("[data-invite-copy]"), "click", copyInvite);
  listen(document.querySelector("[data-admin-refresh]"), "click", () => loadAdmin(true));
  listen(document.querySelector("#search-form"), "submit", runSearch);
  listen(document.querySelector("[data-manual-toggle]"), "click", () => { manualAdd = !manualAdd; render(); });
  listen(document.querySelector("#manual-form"), "submit", handleManualPick);
  listen(document.querySelector("#add-form"), "submit", addDrama);
  listen(document.querySelector("#profile-form"), "submit", saveProfile);
  listen(document.querySelector("#create-club-form"), "submit", handleCreateClub);
  listen(document.querySelector("#join-club-form"), "submit", handleJoinClub);
  listen(document.querySelector("#create-couple-form"), "submit", handleCreateCouple);
  listen(document.querySelector("#join-couple-form"), "submit", handleJoinCouple);
  listen(document.querySelector("#couple-capa-form"), "submit", handleCoupleCapa);
  listen(document.querySelector("#couple-meet-form"), "submit", handleMeetDate);
  listen(document.querySelector("#couple-date-form"), "submit", handleAddDate);
  listen(document.querySelector("#couple-wish-form"), "submit", handleAddWish);
  document.querySelectorAll("[data-date-done]").forEach((b) => listen(b, "click", () => handleDateDone(b.dataset.dateDone)));
  document.querySelectorAll("[data-del-date]").forEach((b) => listen(b, "click", () => handleDeleteDate(b.dataset.delDate)));
  document.querySelectorAll("[data-wish-done]").forEach((b) => listen(b, "click", () => handleWishDone(b.dataset.wishDone)));
  document.querySelectorAll("[data-del-wish]").forEach((b) => listen(b, "click", () => handleDeleteWish(b.dataset.delWish)));
  listen(document.querySelector("#couple-lastmet-form"), "submit", handleLastMet);
  listen(document.querySelector("#couple-saudade-form"), "submit", handleSaudade);
  listen(document.querySelector("#couple-reunion-form"), "submit", handleReunionAdd);
  document.querySelectorAll("[data-reunion-done]").forEach((b) => listen(b, "click", () => handleReunionDone(b.dataset.reunionDone)));
  document.querySelectorAll("[data-reunion-del]").forEach((b) => listen(b, "click", () => handleReunionDel(b.dataset.reunionDel)));
  document.querySelectorAll("[data-saudade-del]").forEach((b) => listen(b, "click", () => handleSaudadeDel(b.dataset.saudadeDel)));
  listen(document.querySelector("#couple-pinned-form"), "submit", handleCouplePinned);
  listen(document.querySelector("#couple-telegram-form"), "submit", handleTelegramSave);
  listen(document.querySelector("#couple-add-drama-form"), "submit", handleCoupleAddDrama);
  listen(document.querySelector("#couple-diary-form"), "submit", handleCoupleDiary);
  listen(document.querySelector("#couple-letter-form"), "submit", handleCoupleLetter);
  document.querySelectorAll(".diary-entry-foto, .cartinha-foto, .mural-foto").forEach((img) => listen(img, "click", () => abrirFotoZoom(img.src)));
  listen(document.querySelector("[data-comment-foto]"), "change", (e) => handleCommentFoto(e.target));
  listen(document.querySelector("[data-comment-foto-remove]"), "click", () => { clubCommentFoto = null; const w = document.querySelector("#comment-foto-wrap"); if (w) w.innerHTML = ""; });
  listen(document.querySelector("[data-diary-foto]"), "change", (e) => handleDiaryFoto(e.target));
  listen(document.querySelector("[data-letter-foto]"), "change", (e) => handleLetterFoto(e.target));
  listen(document.querySelector("[data-diary-foto-remove]"), "click", () => { coupleDiaryFoto = null; const w = document.querySelector("#diary-foto-wrap"); if (w) w.innerHTML = ""; });
  listen(document.querySelector("[data-letter-foto-remove]"), "click", () => { coupleLetterFoto = null; const w = document.querySelector("#letter-foto-wrap"); if (w) w.innerHTML = ""; });
  listen(document.querySelector("[data-copy-couple-code]"), "click", copyCoupleCode);
  document.querySelectorAll("[data-date-roulette]").forEach((b) => listen(b, "click", handleDateRoulette));
  listen(document.querySelector("[data-leave-couple]"), "click", handleLeaveCouple);
  document.querySelectorAll("[data-space-go]").forEach((b) => {
    listen(b, "click", () => (b.dataset.spaceGo === "couple" ? enterCoupleSpace() : leaveCoupleSpace()));
  });
  document.querySelectorAll("[data-couple-section]").forEach((button) => {
    listen(button, "click", () => setCoupleSection(button.dataset.coupleSection));
  });
  document.querySelectorAll("[data-about-pick]").forEach((button) => {
    listen(button, "click", () => handleAboutPick(button.dataset.aboutPick));
  });
  listen(document.querySelector("[data-namoro-inicio]"), "change", (e) => handleNamoroInicio(e.target.value));
  // Tema do casal (compartilhado)
  document.querySelectorAll("[data-tema-casal]").forEach((button) => {
    listen(button, "click", () => salvarTemaCasal(button.dataset.temaCasal));
  });
  listen(document.querySelector("#tema-casal-search-form"), "submit", runTemaSearchCasal);
  document.querySelectorAll("[data-tema-dorama-casal]").forEach((button) => {
    listen(button, "click", () => {
      const d = temaSearchCasal.results.find((x) => x.tmdbId === Number(button.dataset.temaDoramaCasal));
      if (d) usarDoramaComoTemaCasal(d);
    });
  });
  document.querySelectorAll("[data-couple-ep]").forEach((button) => {
    listen(button, "click", () => handleCoupleEpisode(button.dataset.coupleEp));
  });
  document.querySelectorAll("[data-couple-memory]").forEach((button) => {
    listen(button, "click", () => handleCoupleMemory(button.dataset.coupleMemory));
  });
  document.querySelectorAll("[data-couple-plus]").forEach((button) => {
    listen(button, "click", () => handleCouplePlusEp(button.dataset.couplePlus));
  });
  document.querySelectorAll("[data-couple-finish]").forEach((button) => {
    listen(button, "click", () => handleCoupleFinish(button.dataset.coupleFinish));
  });
  document.querySelectorAll("[data-couple-move]").forEach((button) => {
    listen(button, "click", () => handleCoupleMove(button.dataset.coupleMove));
  });
  document.querySelectorAll("[data-couple-move-to]").forEach((sel) => {
    listen(sel, "change", () => handleCoupleMoveTo(sel.dataset.coupleMoveTo, sel.value));
  });
  document.querySelectorAll("[data-couple-sortear-fila]").forEach((b) => listen(b, "click", handleCoupleSortearFila));
  document.querySelectorAll("[data-diary-kind]").forEach((button) => {
    listen(button, "click", () => { coupleDiaryKind = button.dataset.diaryKind; render(); });
  });
  listen(document.querySelector("[data-diary-older]"), "click", () => diarioNavega(-1));
  listen(document.querySelector("[data-diary-newer]"), "click", () => diarioNavega(1));
  listen(document.querySelector("[data-diary-hoje]"), "click", () => { coupleDiaryDay = new Date().toISOString().slice(0, 10); coupleDiaryFoto = null; renderMantendoScroll(); });
  listen(document.querySelector("[data-diary-goto]"), "change", (e) => { if (e.target.value) { coupleDiaryDay = e.target.value; coupleDiaryFoto = null; renderMantendoScroll(); } });
  document.querySelectorAll("[data-nos-tab]").forEach((b) => listen(b, "click", () => { nosTab = b.dataset.nosTab; render(); }));
  document.querySelectorAll("[data-carta-puxar]").forEach((b) => listen(b, "click", () => puxarCarta(b.dataset.cartaPuxar)));
  listen(document.querySelector("[data-carta-enviar]"), "click", enviarCarta);
  listen(document.querySelector("[data-carta-cumpri]"), "click", () => limparCarta(true));
  listen(document.querySelector("[data-carta-recusar]"), "click", () => limparCarta(false));
  listen(document.querySelector("[data-carta-cancelar]"), "click", () => limparCarta(false));
  document.querySelectorAll("[data-bingo-cell]").forEach((button) => {
    listen(button, "click", () => toggleBingoCell(Number(button.dataset.bingoCell)));
  });
  listen(document.querySelector("[data-bingo-novo]"), "click", () => { gerarBingoCard(bingoCard?.size || 3); render(); });
  listen(document.querySelector("[data-bingo-share]"), "click", shareBingo);
  document.querySelectorAll("[data-quiz]").forEach((button) => {
    listen(button, "click", () => handleQuizAnswer(button.dataset.quiz));
  });
  listen(document.querySelector("#nos-setpin-form"), "submit", handleNosSetPin);
  listen(document.querySelector("#nos-enterpin-form"), "submit", handleNosEnterPin);
  listen(document.querySelector("#nos-create-form"), "submit", handleNosCreate);
  document.querySelectorAll("[data-nos-preset]").forEach((b) => listen(b, "click", () => handleNosPreset(b.dataset.nosPreset)));
  document.querySelectorAll("[data-nos-claim]").forEach((b) => listen(b, "click", () => handleNosClaim(b.dataset.nosClaim)));
  document.querySelectorAll("[data-nos-del-reward]").forEach((b) => listen(b, "click", () => handleNosDeleteReward(b.dataset.nosDelReward)));
  document.querySelectorAll("[data-nos-used]").forEach((b) => listen(b, "click", () => handleNosClaimUsed(b.dataset.nosUsed)));
  document.querySelectorAll("[data-nos-del-claim]").forEach((b) => listen(b, "click", () => handleNosDeleteClaim(b.dataset.nosDelClaim)));
  document.querySelectorAll("[data-claim-status]").forEach((b) => listen(b, "click", () => handleClaimStatus(b.dataset.claimStatus)));
  document.querySelectorAll("[data-mission]").forEach((b) => listen(b, "click", () => handleMissionClaim(b.dataset.mission)));
  listen(document.querySelector("#nos-surpresa-form"), "submit", handleSurpresaCreate);
  document.querySelectorAll("[data-surp-del]").forEach((b) => listen(b, "click", () => handleSurpresaDel(b.dataset.surpDel)));
  listen(document.querySelector("#secret-mission-form"), "submit", handleSecretMissionCreate);
  document.querySelectorAll("[data-secret-status]").forEach((b) => listen(b, "click", () => handleSecretMissionStatus(b.dataset.secretStatus)));
  document.querySelectorAll("[data-secret-del]").forEach((b) => listen(b, "click", () => handleSecretMissionDelete(b.dataset.secretDel)));
  listen(document.querySelector("#desire-form"), "submit", handleDesireCreate);
  document.querySelectorAll("[data-desire-reveal]").forEach((b) => listen(b, "click", () => handleDesireReveal(b.dataset.desireReveal)));
  document.querySelectorAll("[data-desire-del]").forEach((b) => listen(b, "click", () => handleDesireDelete(b.dataset.desireDel)));
  document.querySelectorAll("[data-fetish-pref]").forEach((b) => listen(b, "click", () => handleFetishPref(b.dataset.fetishPref)));
  document.querySelectorAll("[data-tg-event]").forEach((b) => listen(b, "click", () => handleTgEvent(b.dataset.tgEvent)));
  document.querySelectorAll("[data-tg-del]").forEach((b) => listen(b, "click", () => handleTgDel(b.dataset.tgDel)));
  document.querySelectorAll("[data-extrato-open]").forEach((b) => listen(b, "click", () => { extratoOpen = true; render(); }));
  document.querySelectorAll("[data-extrato-close]").forEach((b) => listen(b, "click", () => { extratoOpen = false; render(); }));
  document.querySelectorAll("[data-missoes-open]").forEach((b) => listen(b, "click", () => { missoesOpen = true; render(); }));
  document.querySelectorAll("[data-missoes-close]").forEach((b) => listen(b, "click", () => { missoesOpen = false; render(); }));
  document.querySelectorAll("[data-desafios-open]").forEach((b) => listen(b, "click", () => { desafiosOpen = true; render(); }));
  document.querySelectorAll("[data-desafios-close]").forEach((b) => listen(b, "click", () => { desafiosOpen = false; render(); }));
  document.querySelectorAll("[data-set-intensity]").forEach((b) => listen(b, "click", () => handleSetIntensity(b.dataset.setIntensity)));
  document.querySelectorAll("[data-desafio-done]").forEach((b) => listen(b, "click", () => handleDesafioDone(b.dataset.desafioDone)));
  document.querySelectorAll("[data-challenge-feedback]").forEach((b) => listen(b, "click", () => handleChallengeFeedback(b.dataset.challengeFeedback)));
  listen(document.querySelector("[data-desafio-outro]"), "click", handleDesafioOutro);
  listen(document.querySelector("[data-adulto18]"), "click", () => handleAdulto18(true));
  listen(document.querySelector("[data-adulto18-off]"), "click", () => handleAdulto18(false));
  document.querySelectorAll("[data-unlock-desafio]").forEach((b) => listen(b, "click", () => handleUnlockDesafio(b.dataset.unlockDesafio)));
  document.querySelectorAll("[data-undo-challenge]").forEach((b) => listen(b, "click", () => handleUndoChallenge(b.dataset.undoChallenge)));
  document.querySelectorAll("[data-checkin]").forEach((b) => listen(b, "click", () => handleCheckin(b.dataset.checkin)));
  document.querySelectorAll("[data-day-limit]").forEach((b) => listen(b, "click", () => handleDayLimit(b.dataset.dayLimit)));
  const climaSlider = document.querySelector("[data-day-limit-range]");
  if (climaSlider) {
    listen(climaSlider, "input", (e) => { const lv = NIVEIS.find((x) => x.n === Number(e.target.value)); const c = document.querySelector(".heat-cap-val"); if (c && lv) c.textContent = `${lv.emoji} ${lv.nome}`; });
    listen(climaSlider, "change", (e) => handleDayLimit(e.target.value));
  }
  const fixSlider = document.querySelector("[data-fix-range]");
  if (fixSlider) {
    listen(fixSlider, "input", (e) => { const lv = NIVEIS.find((x) => x.n === Number(e.target.value)); const c = document.querySelector(".fix-cap-val"); if (c && lv) c.textContent = `${lv.emoji} ${lv.nome}`; });
    listen(fixSlider, "change", (e) => handleSetIntensity(e.target.value));
  }
  listen(document.querySelector("#couple-add-cat"), "change", (e) => { coupleAddCatSel = e.target.value; });
  listen(document.querySelector("#couple-search-form"), "submit", runCoupleSearch);
  document.querySelectorAll("[data-couple-add-tmdb]").forEach((button) => {
    listen(button, "click", () => handleCoupleAddTmdb(button.dataset.coupleAddTmdb, button.dataset.media));
  });
  listen(document.querySelector("[data-couple-name]"), "click", handleCoupleSetName);
  listen(document.querySelector("[data-couple-recado]"), "click", handleCoupleRecado);
  listen(document.querySelector("[data-recados-toggle]"), "click", () => { recadosExpandidos = !recadosExpandidos; render(); });
  listen(document.querySelector("[data-cartinhas-toggle]"), "click", () => { cartinhasExpandidas = !cartinhasExpandidas; render(); });
  listen(document.querySelector("[data-recado-shuffle]"), "click", handleRecadoShuffle);
  document.querySelectorAll("[data-del-couple-drama]").forEach((button) => {
    listen(button, "click", () => handleDeleteCoupleDrama(button.dataset.delCoupleDrama));
  });
  document.querySelectorAll("[data-couple-cert]").forEach((button) => {
    listen(button, "click", () => compartilharCertificadoCasal(button.dataset.coupleCert));
  });
  document.querySelectorAll("[data-cert-share]").forEach((button) => {
    listen(button, "click", () => compartilharCertificadoMarco(button.dataset.certShare));
  });
  listen(document.querySelector("#pet-create-form"), "submit", handleSavePet);
  document.querySelectorAll("[data-pet-care]").forEach((button) => {
    listen(button, "click", () => handlePetCare(button.dataset.petCare));
  });
  document.querySelectorAll("[data-del-couple-diary]").forEach((button) => {
    listen(button, "click", () => handleDeleteCoupleDiary(button.dataset.delCoupleDiary));
  });
  document.querySelectorAll("[data-del-couple-letter]").forEach((button) => {
    listen(button, "click", () => handleDeleteCoupleLetter(button.dataset.delCoupleLetter));
  });
  listen(document.querySelector("#comment-form"), "submit", handlePostComment);
  document.querySelectorAll("[data-del-comment]").forEach((button) => {
    listen(button, "click", () => handleDeleteComment(button.dataset.delComment));
  });
  document.querySelectorAll("[data-reveal-post]").forEach((button) => {
    listen(button, "click", () => { revealedPosts.add(button.dataset.revealPost); render(); });
  });
  document.querySelectorAll("[data-mural-filter]").forEach((button) => {
    listen(button, "click", () => { clubMuralFilter = button.dataset.muralFilter; render(); });
  });
  document.querySelectorAll("[data-mural-tab]").forEach((button) => {
    listen(button, "click", () => { clubMuralTab = button.dataset.muralTab; render(); });
  });
  document.querySelectorAll("[data-club-profile]").forEach((button) => {
    listen(button, "click", () => toggleClubProfile(button.dataset.clubProfile));
  });
  listen(document.querySelector("[data-club-profile-close]"), "click", () => { clubProfileOpen = null; render(); });
  listen(document.querySelector("[data-set-notice]"), "click", handleSetNotice);
  listen(document.querySelector("[data-clear-notice]"), "click", handleClearNotice);
  document.querySelectorAll("[data-manage-member]").forEach((button) => {
    listen(button, "click", () => handleManageMember(button.dataset.manageMember, button.dataset.action));
  });
  document.querySelectorAll("[data-react]").forEach((button) => {
    listen(button, "click", () => handleToggleReaction(button.dataset.react, button.dataset.emoji));
  });
  document.querySelectorAll("[data-react-surto]").forEach((button) => {
    listen(button, "click", () => handleToggleSurtoReaction(button.dataset.reactSurto, button.dataset.emoji));
  });
  document.querySelectorAll("[data-frase]").forEach((button) => {
    listen(button, "click", () => {
      const ta = document.querySelector("#commentBody");
      if (ta) {
        ta.value = ta.value ? `${ta.value} ${button.dataset.frase}` : button.dataset.frase;
        ta.focus();
      }
    });
  });
  listen(document.querySelector("#lista-add-form"), "submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    handleListAdd(data.dramaId, data.manualTitle);
  });
  listen(document.querySelector("#club-search-form"), "submit", runClubSearch);
  document.querySelectorAll("[data-club-add-tmdb]").forEach((button) => {
    listen(button, "click", () => handleClubAddTmdb(button.dataset.clubAddTmdb));
  });
  document.querySelectorAll("[data-club-finish]").forEach((b) => listen(b, "click", () => handleClubFinish(b.dataset.clubFinish)));
  document.querySelectorAll("[data-ep-toggle]").forEach((b) => listen(b, "click", () => handleEpToggle(b.dataset.epToggle, b.dataset.seen === "1")));
  document.querySelectorAll("[data-ep-star]").forEach((b) => listen(b, "click", () => handleRateEpisode(b.dataset.epStar, b.dataset.star)));
  document.querySelectorAll("[data-ep-open]").forEach((b) => listen(b, "click", () => toggleEpisodioDetalhe(b.dataset.epOpen)));
  document.querySelectorAll("[data-ep-comment]").forEach((f) => listen(f, "submit", (e) => {
    e.preventDefault();
    handlePostEpisodeComment(f.dataset.epComment, new FormData(f).get("body"));
  }));
  listen(document.querySelector("[data-club-open-voting]"), "click", handleClubOpenVoting);
  listen(document.querySelector("[data-club-close-voting]"), "click", handleClubCloseVoting);
  document.querySelectorAll("[data-list-vote]").forEach((button) => {
    listen(button, "click", () => handleListVote(button.dataset.listVote, button.dataset.vote));
  });
  document.querySelectorAll("[data-list-feature]").forEach((button) => {
    listen(button, "click", () => handleSetClubFeaturedFromList(button.dataset.listFeature));
  });
  document.querySelectorAll("[data-list-debate]").forEach((button) => {
    listen(button, "click", () => handleDebateClubList(button.dataset.listDebate));
  });
  document.querySelectorAll("[data-list-remove]").forEach((button) => {
    listen(button, "click", () => handleListRemove(button.dataset.listRemove));
  });
  listen(document.querySelector("#pick-form"), "submit", (e) => {
    e.preventDefault();
    const dramaId = new FormData(e.currentTarget).get("dramaId");
    if (dramaId) handlePickMonth(dramaId);
  });
  listen(document.querySelector("#club-featured-form"), "submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data.dramaId) handleSetClubFeatured(data.dramaId, data.periodType);
  });
  listen(document.querySelector("#club-checkin-form"), "submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    handleClubFeaturedCheckin(data.episode, data.status);
  });
  listen(document.querySelector("#club-poll-form"), "submit", handleCreateClubPoll);
  document.querySelectorAll("[data-poll-vote]").forEach((button) => {
    listen(button, "click", () => handleVoteClubPoll(button.dataset.pollVote, button.dataset.optionId));
  });
  document.querySelectorAll("[data-close-poll]").forEach((button) => {
    listen(button, "click", () => handleCloseClubPoll(button.dataset.closePoll));
  });
  listen(document.querySelector("#club-event-form"), "submit", handleCreateClubEvent);
  document.querySelectorAll("[data-event-rsvp]").forEach((button) => {
    listen(button, "click", () => handleClubEventRsvp(button.dataset.eventRsvp, button.dataset.rsvp));
  });
  document.querySelectorAll("[data-cancel-event]").forEach((button) => {
    listen(button, "click", () => handleCancelClubEvent(button.dataset.cancelEvent));
  });
  listen(document.querySelector("#club-challenge-form"), "submit", handleCreateClubChallenge);
  document.querySelectorAll("[data-challenge-complete]").forEach((form) => {
    listen(form, "submit", handleCompleteClubChallenge);
  });
  document.querySelectorAll("[data-close-challenge]").forEach((button) => {
    listen(button, "click", () => handleCloseClubChallenge(button.dataset.closeChallenge));
  });
  listen(document.querySelector("#club-chat-form"), "submit", handleCreateClubChatMessage);
  const chatInput = document.querySelector("#clubChatBody");
  if (chatInput) {
    listen(chatInput, "input", () => { chatDraft = chatInput.value; });
  }
  listen(document.querySelector("[data-chat-spoiler]"), "click", () => { clubChatSpoilerOn = !clubChatSpoilerOn; render(); });
  listen(document.querySelector("[data-cancel-chat-reply]"), "click", () => { chatReplyTo = null; render(); });
  document.querySelectorAll("[data-reveal-chat]").forEach((b) => listen(b, "click", () => { revealedChat.add(b.dataset.revealChat); render(); }));
  document.querySelectorAll("[data-react-chat]").forEach((button) => {
    listen(button, "click", () => handleToggleChatReaction(button.dataset.reactChat, button.dataset.emoji));
  });
  document.querySelectorAll("[data-react-open]").forEach((button) => {
    listen(button, "click", () => { chatReactPicker = chatReactPicker === button.dataset.reactOpen ? null : button.dataset.reactOpen; render(); });
  });
  document.querySelectorAll("[data-reply-chat]").forEach((button) => {
    listen(button, "click", () => handleReplyChat(button.dataset.replyChat));
  });
  document.querySelectorAll("[data-jump-chat]").forEach((button) => {
    listen(button, "click", () => handleJumpChat(button.dataset.jumpChat));
  });
  document.querySelectorAll("[data-del-chat]").forEach((button) => {
    listen(button, "click", () => handleDeleteClubChatMessage(button.dataset.delChat));
  });
  // chat sempre rolado pro fim (mensagem mais nova).
  const chatList = document.querySelector("#club-chat-list");
  if (chatList) chatList.scrollTop = chatList.scrollHeight;
  listen(document.querySelector("#casal-form"), "submit", handleAddCasal);
  document.querySelectorAll("[data-del-casal]").forEach((button) => {
    listen(button, "click", () => handleDeleteCasal(button.dataset.delCasal));
  });
  listen(document.querySelector("#favorito-form"), "submit", handleAddFavorito);
  document.querySelectorAll("[data-del-favorito]").forEach((button) => {
    listen(button, "click", () => handleDeleteFavorito(button.dataset.delFavorito));
  });
  listen(document.querySelector("#change-pass-form"), "submit", handleChangePassword);
  listen(document.querySelector("[data-open-tutorial]"), "click", () => abrirTutorial(0, "geral"));
  listen(document.querySelector("[data-open-couple-tutorial]"), "click", () => abrirTutorial(0, "casal"));
  bindPhotoPicker();

  // Motivo "Outro": mostra o campo de texto quando escolhido.
  const reasonSel = document.querySelector("#add-form #reason");
  if (reasonSel) {
    const sync = () => {
      const campo = document.querySelector("#reason-custom-field");
      if (campo) campo.hidden = reasonSel.value !== "__outro";
    };
    listen(reasonSel, "change", sync);
    sync();
  }

  // Carrega dados sob demanda ao abrir as telas.
  if (state.view === "admin" && isAdmin() && !admin.loaded && !admin.loading) loadAdmin();
  if (state.view === "discover" && !discover.loaded && !discover.loading) loadDiscover();
  if (state.view === "club" && (clubHasNews || localStorage.getItem(SEEN_CLUB_KEY) === null)) marcarClubeVisto();
  if (state.view === "club" && state.club && clubMembersFor !== state.club.id) loadClubMembers();
  if (state.view === "club" && state.club && clubFeedFor !== state.club.id) loadClubFeed();
  if (state.view === "club" && state.club && clubSocial.for !== state.club.id) loadClubSocial();
  if (state.view === "club" && state.club) ensureClubRealtime(); else teardownClubRealtime();
  if (state.space === "couple" && state.couple) ensureCoupleRealtime(); else teardownCoupleRealtime();
  if (state.space === "couple" && state.couple && coupleFor !== state.couple.id) loadCoupleData();
  if (state.space === "couple" && state.couple && coupleSection === "certificados" && coupleFor === state.couple.id && coupleRuntimesFor !== state.couple.id) loadCoupleRuntimes();
  if (state.space === "couple" && state.couple && coupleSection === "diversao" && coupleFor === state.couple.id && coupleQuizFor !== `${state.couple.id}:${semanaAtual()}`) loadCoupleQuizData();
  if (state.space === "couple" && state.couple && (coupleSection === "nos" || coupleSection === "ajustes") && casalPrivadoOn() && coupleFor === state.couple.id && nosFor !== state.couple.id) loadNosData();
  if (state.space === "couple" && state.couple && coupleSection === "planos" && coupleFor === state.couple.id && planosFor !== state.couple.id) loadPlanosData();
  if (state.view === "profile" && casaisFor !== (authUser?.id || "_")) loadCasaisData();
  if (state.view === "profile" && favoritosFor !== (authUser?.id || "_")) loadFavoritosData();
}

async function runSearch(event) {
  event.preventDefault();
  const query = String(new FormData(event.currentTarget).get("search") || "").trim();
  if (!query) return;
  if (!tmdbReady()) {
    search = { ...search, query, error: "TMDB sem token configurado. Confira config.js.", results: [], selected: null };
    render();
    return;
  }
  manualAdd = false;
  search = { ...search, query, loading: true, error: "", results: [], selected: null };
  render();
  try {
    const results = await searchDramas(query);
    search = { ...search, loading: false, results, error: results.length ? "" : "Nada encontrado. Tente o nome original ou adicione manualmente." };
  } catch {
    search = { ...search, loading: false, error: "Não consegui buscar agora. Confira a conexão e tente de novo." };
  }
  render();
}

// "Adicionar manualmente": monta um selecionado sem TMDB e segue o fluxo normal.
function handleManualPick(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const title = String(data.title || "").trim();
  if (!title) return;
  manualAdd = false;
  search = {
    ...search,
    selected: {
      tmdbId: null,
      mediaType: "tv",
      title,
      year: data.year ? Number(data.year) : new Date().getFullYear(),
      episodes: data.episodes ? Number(data.episodes) : 16,
      cover: "",
      synopsis: "",
      genres: [],
      origem: "",
    },
  };
  render();
}

async function pickResult(tmdbId) {
  const brief = search.results.find((drama) => drama.tmdbId === tmdbId);
  search = { ...search, selected: brief };
  render();
  try {
    const details = await getDramaDetails(tmdbId, brief?.mediaType || "tv");
    search = { ...search, selected: { ...brief, ...details } };
    render();
  } catch {
    // Mantém os dados resumidos da busca se os detalhes falharem.
  }
}

function bindModal() {
  listen(document.querySelector("[data-close]"), "click", () => {
    modal = null;
    render();
  });
  listen(document.querySelector("#profile-form"), "submit", saveProfile);
  listen(document.querySelector("#drama-form"), "submit", saveDramaDetails);
  listen(document.querySelector("[data-share-card]"), "click", () => compartilharDorama(modal.id));
  listen(document.querySelector("[data-certificado]"), "click", () => compartilharDorama(modal.id, { certificado: true, frase: fraseFim() }));
  document.querySelectorAll("[data-sortear]").forEach((button) => {
    listen(button, "click", () => sortearComFiltro(button.dataset.sortear));
  });
  listen(document.querySelector("[data-remove]"), "click", () => modal.id && removeDrama(modal.id));
  listen(document.querySelector("#surto-form"), "submit", handleAddSurto);
  document.querySelectorAll("[data-del-surto]").forEach((button) => {
    listen(button, "click", () => handleDeleteSurto(button.dataset.delSurto));
  });
  bindPhotoPicker();

  // Mostra/esconde os campos que dependem do status (motivo da pausa/drop, semáforo)
  // sem re-renderizar, preservando o que já foi digitado.
  const statusSelect = document.querySelector("#drama-form #status");
  if (statusSelect) {
    const sync = () => {
      document.querySelectorAll("#drama-form [data-when]").forEach((node) => {
        node.hidden = node.dataset.when !== statusSelect.value;
      });
    };
    listen(statusSelect, "change", sync);
    sync();
  }
}

async function saveProfile(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (cloudOn()) {
    try {
      await saveProfileRemote(authUser.id, data);
      // Recarrega pra trazer o código de convite (e quem convidou).
      const fresh = await loadProfile(authUser.id);
      if (fresh) {
        data.inviteCode = fresh.inviteCode;
        data.invitedBy = fresh.invitedBy;
      }
    } catch {
      toast("Não consegui salvar o perfil na nuvem. Tente de novo.");
      return;
    }
  }
  modal = null;
  setState({ profile: data, view: "home" });
  resolveInvite();
  toast(`${gx("Bem-vindo", "Bem-vinda", "Que bom te ver")}, ${data.name}.`);
}

function addDrama(event) {
  event.preventDefault();
  if (!search.selected) {
    toast("Escolha um dorama da busca primeiro.");
    return;
  }
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const reason = data.reason === "__outro" ? String(data.reasonCustom || "").trim() || "Escolhido a dedo" : data.reason;
  const drama = normalizeDrama({
    ...search.selected,
    id: createId(),
    status: data.status,
    currentEpisode: Number(data.currentEpisode || 0),
    reason,
    priority: data.priority,
    mood: data.mood,
  });

  search = { query: "", loading: false, results: [], selected: null, error: "" };
  manualAdd = false;
  syncDrama(drama);
  setState({ dramas: [drama, ...state.dramas], view: "lists", activeList: data.status });
  toast(`${drama.title} entrou em ${statusLabel(data.status)}.`);
}

function saveDramaDetails(event) {
  event.preventDefault();
  const id = event.currentTarget.dataset.id;
  const formData = new FormData(event.currentTarget);
  const data = Object.fromEntries(formData);
  let updated = null;
  const dramas = state.dramas.map((drama) => {
    if (drama.id !== id) return drama;
    updated = {
      ...drama,
      status: data.status,
      currentEpisode: Number(data.currentEpisode || 0),
      personalRating: data.personalRating,
      cry: data.cry,
      laugh: data.laugh,
      hype: data.hype,
      rage: data.rage,
      note: data.note,
      recommend: data.recommend,
      semaforo: data.semaforo ?? drama.semaforo,
      pauseReason: data.pauseReason ?? drama.pauseReason,
      dropReason: data.dropReason ?? drama.dropReason,
      favorite: formData.has("favorite"),
      comfort: formData.has("comfort"),
    };
    return updated;
  });
  modal = null;
  if (updated) syncDrama(updated);
  setState({ dramas });
  toast("Detalhes salvos.");
}

// Define o episódio atual direto (sem ficar apertando +1 várias vezes).
function setEpisode(id, alvo) {
  let justFinished = false;
  let updated = null;
  const dramas = state.dramas.map((drama) => {
    if (drama.id !== id) return drama;
    const total = Number(drama.episodes || 0);
    let ep = Math.max(0, Number(alvo) || 0);
    if (total) ep = Math.min(ep, total);
    const reachedEnd = total && ep >= total && drama.status !== "finished";
    if (reachedEnd) justFinished = true;
    updated = { ...drama, currentEpisode: ep, status: reachedEnd ? "finished" : drama.status };
    return updated;
  });
  if (!updated) return;
  state.dramas = dramas;
  saveState();
  syncDrama(updated);
  if (justFinished) {
    // Spec seção 7: ao terminar, abrir avaliação (nota, choro, surto, raiva, recomenda).
    modal = { type: "detail", id };
    render();
    toast(`Terminou! ${fraseFim()} Conta como foi 💜`);
  } else {
    render();
    toast(`Episódio ${updated.currentEpisode} marcado.`);
  }
}

function incrementEpisode(id) {
  const drama = state.dramas.find((d) => d.id === id);
  if (drama) setEpisode(id, Number(drama.currentEpisode || 0) + 1);
}

// Pergunta o episódio (pra quem maratonou vários de uma vez).
async function setEpisodeQuick(id) {
  const drama = state.dramas.find((d) => d.id === id);
  if (!drama) return;
  const total = Number(drama.episodes || 0);
  const resp = await perguntar(`Em qual episódio você está?${total ? ` (de ${total})` : ""}`, String(drama.currentEpisode || 0), { inputType: "number", ok: "Marcar" });
  if (resp === null) return;
  const n = parseInt(resp, 10);
  if (Number.isNaN(n)) return;
  setEpisode(id, n);
}

function toggleField(id, field) {
  let updated = null;
  const dramas = state.dramas.map((drama) => {
    if (drama.id !== id) return drama;
    updated = { ...drama, [field]: !drama[field] };
    return updated;
  });
  if (updated) syncDrama(updated);
  setState({ dramas });
}

function moverStatus(id, novo) {
  let updated = null;
  const dramas = state.dramas.map((drama) => {
    if (drama.id !== id) return drama;
    updated = { ...drama, status: novo };
    return updated;
  });
  if (!updated) return;
  syncDrama(updated);
  setState({ dramas });
  toast(`Movido para ${statusLabel(novo)}.`);
}

function randomDrama() {
  const pool = byStatus("wishlist");
  if (!pool.length) {
    toast("Sua watchlist está vazia. Adicione um dorama primeiro.");
    return;
  }
  const drama = pool[Math.floor(Math.random() * pool.length)];
  toast(`Seu próximo surto será: ${drama.title}.`);
}

async function copyClubCode() {
  if (!state.club) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(state.club.code);
  }
  toast(`Código ${state.club.code} copiado.`);
}

// ---------- Clube ----------
async function loadClubMembers() {
  if (!state.club) return;
  // Marca ANTES de buscar: evita re-disparar em loop se voltar vazio/erro.
  clubMembersFor = state.club.id;
  try {
    clubMembers = await clubMembersList(state.club.id);
  } catch {
    clubMembers = [];
  }
  render();
}

// Perfil do membro (aba Sobre): abre/fecha.
function toggleClubProfile(userId) {
  clubProfileOpen = clubProfileOpen === userId ? null : userId;
  render();
}

// Aviso fixado: definir/editar/remover.
function atualizarClubeLocal(patch) {
  state.club = { ...state.club, ...patch };
  state.clubs = (state.clubs || []).map((c) => c.id === state.club.id ? { ...c, ...patch } : c);
  setState({ club: state.club });
}
async function handleSetNotice() {
  const novo = await perguntar("Aviso fixado do clube:", state.club?.pinned_notice || "", { ok: "Fixar" });
  if (novo === null || novo === undefined) return;
  const texto = String(novo).trim();
  try {
    await setClubNotice(state.club.id, texto);
    atualizarClubeLocal({ pinned_notice: texto });
    toast(texto ? "Aviso fixado. 📌" : "Aviso removido.");
  } catch (error) {
    toast(error?.message?.includes("permiss") ? "Só dono ou moderador pode fixar avisos." : "Não consegui salvar o aviso.");
  }
}
async function handleClearNotice() {
  if (!(await confirmar("Remover o aviso fixado?", { ok: "Remover", danger: true }))) return;
  try {
    await setClubNotice(state.club.id, "");
    atualizarClubeLocal({ pinned_notice: "" });
    toast("Aviso removido.");
  } catch {
    toast("Não consegui remover o aviso.");
  }
}

// Moderação: promover/rebaixar/remover (manage_club_member, mig 47).
async function handleManageMember(userId, action) {
  if (!state.club || !userId) return;
  const m = clubMembers.find((x) => x.user_id === userId);
  const nome = m?.name || "esta pessoa";
  if (action === "remove" && !(await confirmar(`Remover ${nome} do clube?`, { sub: "A pessoa perde o acesso ao clube (pode voltar com o código).", ok: "Remover", danger: true }))) return;
  try {
    await manageClubMember(state.club.id, userId, action);
    if (action === "remove") clubProfileOpen = null;
    await loadClubMembers();
    toast(action === "promote" ? "Agora é moderador 🛡️" : action === "demote" ? "Voltou a ser membro." : "Removido do clube.");
  } catch (error) {
    toast(error?.message?.includes("permiss") ? "Você não tem permissão pra isso." : "Não consegui fazer isso agora.");
  }
}

async function loadClubFeed() {
  if (!state.club) return;
  clubFeedFor = state.club.id;
  try {
    clubFeedItems = await clubFeed(state.club.id);
  } catch {
    clubFeedItems = [];
  }
  render();
}

async function loadClubSocial() {
  if (!state.club) return;
  clubAddSearch = { query: "", loading: false, results: [] }; // limpa busca ao trocar de clube
  clubMuralFilter = null;
  chatDraft = "";
  chatReplyTo = null;
  clubChatSpoilerOn = false;
  epDetailOpen = null;
  clubMuralTab = "geral";
  clubProfileOpen = null;
  clubSocial = { ...clubSocial, for: state.club.id };
  const empty = emptyClubSocial(state.club.id);
  try {
    const [activities, picks, ranking, shared, reactions, surtoReactions, commonDramas, list, compat, featured, polls, events, points, challenges, chat, chatReactions, cycle, clubDramasHist, myPointsLedger] = await Promise.all([
      clubActivities(state.club.id),
      clubPicksTally(state.club.id),
      clubRanking(state.club.id),
      clubSharedSurtos(state.club.id),
      clubReactions(state.club.id),
      clubSurtoReactions(state.club.id).catch(() => []),
      clubDramas(state.club.id),
      clubListFeed(state.club.id),
      clubCompatibility(state.club.id),
      clubCurrentFeaturedDrama(state.club.id).catch(() => null),
      clubPollsFeed(state.club.id).catch(() => []),
      clubEventsFeed(state.club.id).catch(() => []),
      clubPointsRanking(state.club.id).catch(() => []),
      clubChallengesFeed(state.club.id).catch(() => []),
      clubChatFeed(state.club.id).catch(() => []),
      clubChatReactions(state.club.id).catch(() => []),
      clubCycle(state.club.id).catch(() => null),
      clubFeaturedHistory(state.club.id).catch(() => []),
      clubMyPointsLedger(state.club.id, authUser?.id).catch(() => []),
    ]);
    clubSocial = { for: state.club.id, activities, picks, ranking, shared, reactions, surtoReactions, commonDramas, list, compat, featured, polls, events, points, challenges, chat, chatReactions, cycle, clubDramas: clubDramasHist, myPoints: myPointsLedger, epRatings: [], epCount: 0 };
  } catch {
    clubSocial = empty;
  }
  render();
  carregarModoEpisodio(); // notas + contagem de episódios (não bloqueia o render principal)
}

// Modo Episódio: nota por episódio + total de episódios (TMDB). Carrega em 2º plano.
async function carregarModoEpisodio() {
  const featured = clubSocial.featured;
  if (!featured?.id || clubSocial.for !== state.club?.id) return;
  const clubeAlvo = state.club.id;
  const [ratings, detalhe] = await Promise.all([
    clubEpisodeRatings(featured.id).catch(() => []),
    featured.tmdb_id && tmdbReady() ? getDramaDetails(featured.tmdb_id).catch(() => null) : Promise.resolve(null),
  ]);
  if (clubSocial.for !== clubeAlvo || clubSocial.featured?.id !== featured.id) return; // trocou de clube/dorama no meio
  clubSocial.epRatings = ratings || [];
  clubSocial.epCount = Number(detalhe?.episodes || 0) || 0;
  render();
}

// ---------- Chat ao vivo + presença (Realtime) ----------
function ensureClubRealtime() {
  if (!cloudOn() || !state.club || state.view !== "club") { teardownClubRealtime(); return; }
  if (clubChannelFor === state.club.id && clubChannel) return;
  teardownClubRealtime();
  clubChannelFor = state.club.id;
  clubChannel = subscribeClubRealtime(state.club.id, {
    me: { id: authUser?.id, name: state.profile?.name || state.profile?.nickname || "Membro" },
    onChatInsert: onRealtimeChatInsert,
    onChatDelete: onRealtimeChatDelete,
    onPresence: onRealtimePresence,
  });
}
function teardownClubRealtime() {
  if (clubChannel) unsubscribeChannel(clubChannel);
  clubChannel = null;
  clubChannelFor = null;
  clubOnline = [];
}

// Realtime do casal: baralho aparece na hora pro parceiro.
function ensureCoupleRealtime() {
  if (!cloudOn() || !state.couple || state.space !== "couple") { teardownCoupleRealtime(); return; }
  if (coupleChannelFor === state.couple.id && coupleChannel) return;
  teardownCoupleRealtime();
  coupleChannelFor = state.couple.id;
  coupleChannel = subscribeCoupleRealtime(state.couple.id, { onAboutChange: onRealtimeCoupleAbout });
}
function teardownCoupleRealtime() {
  if (coupleChannel) unsubscribeChannel(coupleChannel);
  coupleChannel = null;
  coupleChannelFor = null;
}
async function onRealtimeCoupleAbout(payload) {
  if (!state.couple || coupleChannelFor !== state.couple.id) return;
  const row = payload?.new || payload?.old;
  // Recarrega o "sobre" e re-renderiza; avisa se chegou carta nova pra você.
  const antesCarta = coupleAbout.carta_ativa;
  try {
    const aboutRows = await loadCoupleAbout(state.couple.id);
    coupleAbout = Object.fromEntries((aboutRows || []).map((r) => [r.key, r.value || ""]));
  } catch { return; }
  const c = cartaAtiva();
  if (c && c.by !== authUser?.id && coupleAbout.carta_ativa !== antesCarta) {
    toast(`💌 ${nomeParceiroCurto()} te mandou uma carta! 🔥`);
  }
  render();
}
function onRealtimeChatInsert(row) {
  if (!row || !state.club || (clubSocial.chat || []).some((m) => m.id === row.id)) return;
  const nome = clubMembers.find((m) => m.user_id === row.user_id)?.name
    || (row.user_id === authUser?.id ? (state.profile?.name || "Você") : "Membro");
  const msg = { ...row, author: nome };
  const prev = (clubSocial.chat || [])[0]; // mais recente atual = anterior na exibição
  clubSocial.chat = [msg, ...(clubSocial.chat || [])];
  const list = document.querySelector("#club-chat-list");
  if (state.view === "club" && clubTab === "chat" && list) {
    list.insertAdjacentHTML("beforeend", chatBubbleHtml(msg, prev));
    bindChatNode(list.lastElementChild);
    list.scrollTop = list.scrollHeight;
  }
}
function onRealtimeChatDelete(id) {
  if (!id) return;
  clubSocial.chat = (clubSocial.chat || []).filter((m) => m.id !== id);
  document.querySelector(`.club-chat-message[data-msg="${id}"]`)?.remove();
}
function onRealtimePresence(online) {
  clubOnline = online || [];
  if (state.view === "club" && clubTab === "chat") {
    const bar = document.querySelector(".chat-online");
    if (bar) bar.outerHTML = chatOnlineBarHtml();
  }
}
function bindChatNode(node) {
  if (!node) return;
  node.querySelectorAll("[data-del-chat]").forEach((b) => listen(b, "click", () => handleDeleteClubChatMessage(b.dataset.delChat)));
  node.querySelectorAll("[data-reveal-chat]").forEach((b) => listen(b, "click", () => { revealedChat.add(b.dataset.revealChat); render(); }));
  node.querySelectorAll("[data-react-chat]").forEach((b) => listen(b, "click", () => handleToggleChatReaction(b.dataset.reactChat, b.dataset.emoji)));
  node.querySelectorAll("[data-react-open]").forEach((b) => listen(b, "click", () => { chatReactPicker = chatReactPicker === b.dataset.reactOpen ? null : b.dataset.reactOpen; render(); }));
  node.querySelectorAll("[data-reply-chat]").forEach((b) => listen(b, "click", () => handleReplyChat(b.dataset.replyChat)));
  node.querySelectorAll("[data-jump-chat]").forEach((b) => listen(b, "click", () => handleJumpChat(b.dataset.jumpChat)));
}

async function loadCoupleData() {
  if (!state.couple || !cloudOn() || coupleLoading) return;
  coupleLoading = true;
  const id = state.couple.id;
  try {
    const [members, dramas, diary, aboutRows, letters] = await Promise.all([
      coupleMembersList(id),
      loadCoupleDramas(id),
      loadCoupleDiary(id),
      loadCoupleAbout(id),
      loadCoupleLetters(id),
    ]);
    coupleMembers = members;
    coupleDramas = dramas;
    coupleDiary = diary;
    coupleLetters = letters;
    coupleAbout = Object.fromEntries((aboutRows || []).map((row) => [row.key, row.value || ""]));
    // Pet à parte: se a migração 16 ainda não rodou, não quebra o resto.
    try { couplePet = await loadCouplePet(id); } catch { couplePet = null; }
  } catch {
    toast("Não consegui carregar o espaço do casal.");
  } finally {
    // Marca como carregado MESMO em erro: evita loop infinito de render
    // (bindShell re-chamaria loadCoupleData enquanto coupleFor !== id).
    coupleFor = id;
    coupleLoading = false;
  }
  render();
}

// Converte a linha do banco (couples) para o formato do estado (camelCase + tema).
// Só considera casal VÁLIDO quando tem id e código — senão devolve null
// (evita o estado quebrado de "tenho casal" com código vazio).
function mapCoupleRow(couple) {
  if (Array.isArray(couple)) couple = couple[0];
  if (!couple || !couple.id || !couple.code) return null;
  return {
    id: couple.id,
    code: couple.code,
    title: couple.title || "",
    tagline: couple.tagline || "",
    specialDate: couple.special_date || "",
    tema: couple.tema || "",
    temaCustom: couple.tema_custom || "",
    createdBy: couple.created_by || null,
    pinnedLetter: couple.pinned_letter || "",
    nextMeetDate: couple.next_meet_date || "",
    lastMetDate: couple.last_met_date || "",
    telegramLink: couple.telegram_link || "",
  };
}

async function refreshCouple() {
  const couple = await myCouple();
  state.couple = mapCoupleRow(couple);
  coupleFor = null;
  saveState();
  aplicarTemaAmbiente();
  if (state.couple) await loadCoupleData();
  render();
}

// Entra no ambiente do casal (troca de "mundo", aplica o tema compartilhado).
function enterCoupleSpace() {
  state.space = "couple";
  coupleSection = "inicio";
  saveState();
  aplicarTemaAmbiente();
  render();
  // Busca a versão mais recente do casal (pega tema que a outra pessoa mudou).
  if (cloudOn()) refreshCouple().catch(() => {});
}

// Volta pro app normal (restaura o tema pessoal). Não desfaz o vínculo.
function leaveCoupleSpace() {
  state.space = "solo";
  saveState();
  aplicarTemaAmbiente();
  render();
}

function setCoupleSection(sec) {
  coupleSection = sec;
  saveState();
  petReacao = "";
  coupleMemoryDraft = null;
  if (sec === "inicio") recadoIndex = Math.floor(Math.random() * 1000); // recadinho muda sempre
  if (sec === "sobre") aboutPerguntaIdx = Math.floor(Math.random() * 1000); // pergunta em destaque muda
  render();
}

async function handleCreateCouple(event) {
  event.preventDefault();
  if (!cloudOn()) return;
  const title = String(new FormData(event.currentTarget).get("title") || "").trim();
  try {
    await createCouple(title);
    state.couple = mapCoupleRow(await myCouple()); // re-busca a linha completa (com código)
    if (!state.couple) throw new Error("Criado, mas não consegui carregar. Recarregue.");
    state.space = "couple"; // já entra no cantinho recém-criado (o "segundo app")
    coupleSection = "inicio";
    saveState();
    aplicarTemaAmbiente();
    toast("Espaço do casal criado. Envie o código para a sua pessoa. 💕");
    await loadCoupleData();
  } catch (error) {
    toast(error?.message || "Não consegui criar o espaço do casal.");
  }
}

async function handleJoinCouple(event) {
  event.preventDefault();
  const code = String(new FormData(event.currentTarget).get("code") || "").trim().toUpperCase();
  if (!code) return;
  const ok = await confirmar("Entrar neste espaço de casal?", {
    sub: `Confira se o código veio da sua pessoa: ${code}`,
    ok: "Sim, entrar",
  });
  if (!ok) return;
  try {
    await joinCouple(code);
    state.couple = mapCoupleRow(await myCouple()); // re-busca a linha completa (com código)
    if (!state.couple) throw new Error("Entrei, mas não consegui carregar. Recarregue.");
    state.space = "couple"; // entra direto no cantinho de vocês
    coupleSection = "inicio";
    saveState();
    aplicarTemaAmbiente();
    toast("Você entrou no espaço do casal. 💕");
    await loadCoupleData();
  } catch (error) {
    toast(error?.message || "Não consegui entrar neste casal.");
  }
}

async function handleCoupleCapa(event) {
  event.preventDefault();
  if (!state.couple) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await updateCoupleCapa(state.couple.id, data);
    await refreshCouple();
    toast("Capa do casal salva.");
  } catch {
    toast("Não consegui salvar a capa.");
  }
}

async function handleTelegramSave(event) {
  event.preventDefault();
  if (!state.couple) return;
  const contato = String(new FormData(event.currentTarget).get("telegram") || "").trim();
  try {
    await saveCoupleTelegram(state.couple.id, authUser.id, contato || null);
    couplePrefs = await loadCouplePrefs(state.couple.id);
    render();
    toast(contato ? "Seu Telegram salvo 💌" : "Telegram removido.");
  } catch { toast("Não consegui salvar."); }
}
async function handleMeetDate(event) {
  event.preventDefault();
  if (!state.couple) return;
  const meet = String(new FormData(event.currentTarget).get("meet") || "");
  try {
    await updateCoupleMeetDate(state.couple.id, meet || null);
    state.couple.nextMeetDate = meet || "";
    saveState();
    render();
    toast(meet ? "Contagem marcada! 💕" : "Contagem removida.");
  } catch {
    toast("Não consegui salvar.");
  }
}

async function handleAddDate(event) {
  event.preventDefault();
  if (!state.couple) return;
  const d = Object.fromEntries(new FormData(event.currentTarget));
  if (!String(d.title || "").trim()) return;
  try {
    await addCoupleDate(state.couple.id, authUser.id, { title: d.title, kind: d.kind, whenAt: d.whenAt });
    coupleDates = await loadCoupleDates(state.couple.id);
    render();
    toast("Agendado 💕");
  } catch { toast("Não consegui agendar."); }
}
async function handleDateDone(raw) {
  const [id, v] = String(raw).split(":");
  try { await setDateDone(id, v === "1"); coupleDates = await loadCoupleDates(state.couple.id); render(); } catch { toast("Não consegui atualizar."); }
}
async function handleDeleteDate(id) {
  try { await deleteCoupleDate(id); coupleDates = coupleDates.filter((x) => x.id !== id); render(); } catch { toast("Não consegui apagar."); }
}
async function handleAddWish(event) {
  event.preventDefault();
  if (!state.couple) return;
  const d = Object.fromEntries(new FormData(event.currentTarget));
  if (!String(d.title || "").trim()) return;
  try {
    await addCoupleWishlist(state.couple.id, authUser.id, { title: d.title, kind: d.kind });
    coupleWishlist = await loadCoupleWishlist(state.couple.id);
    render();
    toast("Na wishlist 🎁");
  } catch { toast("Não consegui adicionar."); }
}
async function handleWishDone(raw) {
  const [id, v] = String(raw).split(":");
  try { await setWishlistDone(id, v === "1"); coupleWishlist = await loadCoupleWishlist(state.couple.id); render(); } catch { toast("Não consegui atualizar."); }
}
async function handleDeleteWish(id) {
  try { await deleteWishlist(id); coupleWishlist = coupleWishlist.filter((x) => x.id !== id); render(); } catch { toast("Não consegui apagar."); }
}

// ---- Modo saudade (Fase 5) ----
async function handleLastMet(event) {
  event.preventDefault();
  if (!state.couple) return;
  const v = String(new FormData(event.currentTarget).get("lastmet") || "");
  try {
    await updateCoupleLastMet(state.couple.id, v || null);
    state.couple.lastMetDate = v || "";
    saveState();
    render();
    toast(v ? "Marcado 💗" : "Removido.");
  } catch { toast("Não consegui salvar."); }
}
async function handleSaudade(event) {
  event.preventDefault();
  if (!state.couple) return;
  const note = String(new FormData(event.currentTarget).get("note") || "").trim();
  try {
    await addSaudade(state.couple.id, authUser.id, note);
    coupleSaudade = await loadSaudade(state.couple.id);
    event.target.reset();
    render();
    toast("Saudade enviada 💌");
  } catch { toast("Não consegui enviar."); }
}
async function handleSaudadeDel(id) {
  try { await deleteSaudade(id); coupleSaudade = coupleSaudade.filter((x) => x.id !== id); render(); } catch { toast("Não consegui apagar."); }
}
async function handleReunionAdd(event) {
  event.preventDefault();
  if (!state.couple) return;
  const text = String(new FormData(event.currentTarget).get("text") || "").trim();
  if (!text) return;
  try {
    await addReunionItem(state.couple.id, authUser.id, text);
    coupleReunion = await loadReunionList(state.couple.id);
    event.target.reset();
    render();
    toast("Anotado 📝");
  } catch { toast("Não consegui adicionar."); }
}
async function handleReunionDone(raw) {
  const [id, v] = String(raw).split(":");
  try { await setReunionDone(id, v === "1"); coupleReunion = await loadReunionList(state.couple.id); render(); } catch { toast("Não consegui atualizar."); }
}
async function handleReunionDel(id) {
  try { await deleteReunionItem(id); coupleReunion = coupleReunion.filter((x) => x.id !== id); render(); } catch { toast("Não consegui apagar."); }
}

async function handleCouplePinned(event) {
  event.preventDefault();
  if (!state.couple) return;
  const texto = String(new FormData(event.currentTarget).get("pinned") || "").trim();
  try {
    await saveCouplePinnedLetter(state.couple.id, texto);
    state.couple.pinnedLetter = texto;
    saveState();
    render();
    toast("Cartinha fixa salva. 💌");
  } catch {
    toast("Não consegui salvar a cartinha.");
  }
}

async function handleSavePet(event) {
  event.preventDefault();
  if (!state.couple) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const novo = !couplePet;
  const pet = { name: String(data.name || "").trim(), species: data.species || "🐶", color: couplePet?.color || "" };
  try {
    await saveCouplePet(state.couple.id, pet);
    couplePet = { couple_id: state.couple.id, ...pet };
    petReacao = novo ? `${pet.species} Oi! Eu sou ${pet.name || "seu pet"} 🐾` : "";
    render();
    toast(novo ? "Pet adotado! 🐾" : "Pet atualizado.");
  } catch {
    toast("Não consegui salvar o pet (rodou a migração 16?).");
  }
}

const PET_REACOES = {
  carinho: ["fez festinha e abanou o rabo! 🥰", "deitou de barriga pra cima ❤️", "encostou a cabecinha em vocês 🫶"],
  petisco: ["devorou o petisco num segundo! 🦴", "pediu mais um, carinha de pidão 🥺", "ficou super feliz com o agrado 😋"],
  banho: ["ficou cheiroso e fofo 🛁", "sacudiu a água em todo mundo kkk 💦", "brilhando de limpinho ✨"],
  passear: ["amou o passeio dorameiro! 🐾", "correu atrás de uma folha 🍃", "voltou cansado e feliz 😴"],
  surpresa: ["trouxe uma cartinha na boca 💌", "deixou um coração de presente 💞", "fez uma surpresa fofa pra vocês 🎁"],
};

function handlePetCare(tipo) {
  if (!couplePet) return;
  const nome = couplePet.name || "Seu pet";
  const lista = PET_REACOES[tipo] || PET_REACOES.carinho;
  petReacao = `${nome} ${lista[Math.floor(Math.random() * lista.length)]}`;
  // Fora da seção do pet (ex.: no painel) o balão não aparece — dá feedback no toast.
  if (coupleSection !== "diversao") toast(petReacao);
  render();
}

// Certificado de dorama finalizado juntos (card-imagem pra compartilhar).
async function compartilharCertificadoCasal(id) {
  const d = coupleDramas.find((x) => x.id === id);
  if (!d) return;
  toast("Gerando certificado…");
  // Notas dele/dela: pega do diário desse dorama, se houver.
  const mem = coupleDiary.find((e) => (d.tmdb_id && e.tmdb_id === d.tmdb_id) || (e.drama_title && e.drama_title === d.title));
  const coupleName = state.couple?.title || coupleMembers.map((m) => m.name || m.nickname).filter(Boolean).join(" & ") || "Nós dois";
  // Horas estimadas deste dorama (busca a duração se ainda não tiver no cache).
  if (d.tmdb_id && runtimeCache[d.tmdb_id] === undefined && tmdbReady()) {
    try { runtimeCache[d.tmdb_id] = await getEpisodeRuntime(d.tmdb_id); } catch { /* ignore */ }
  }
  const rt = runtimeCache[d.tmdb_id] || 60;
  const horas = Math.round((Number(d.current_episode || d.episodes || 0) * rt) / 60);
  const dramaShape = { tmdbId: d.tmdb_id, cover: d.cover, title: d.title, episodes: d.episodes, currentEpisode: d.current_episode };
  try {
    const blob = await gerarCardMeuDia(dramaShape, {
      casal: true,
      coupleName,
      horas: horas || 0,
      noteHim: mem?.note_him || "",
      noteHer: mem?.note_her || "",
      frase: fraseFim(),
    });
    await compartilharImagem(blob, `Finalizamos ${d.title} juntos! 💕 ${inviteLink()}`);
  } catch {
    toast("Não consegui gerar o certificado.");
  }
}

// Compartilha um certificado de marco/conquista do casal (sem pôster).
async function compartilharCertificadoMarco(i) {
  const cert = coupleCertificados()[Number(i)];
  if (!cert || !cert.earned) return;
  toast("Gerando certificado…");
  const coupleName = state.couple?.title || coupleMembers.map((m) => m.name || m.nickname).filter(Boolean).join(" & ") || "Nós dois";
  try {
    const blob = await gerarCardMeuDia(
      { title: `${cert.emoji} ${cert.nome}` },
      { casal: true, header: "🎓 Certificado do casal", coupleName, frase: cert.desc },
    );
    await compartilharImagem(blob, `${cert.nome} — desbloqueamos no Dorama Club! 💕 ${inviteLink()}`);
  } catch {
    toast("Não consegui gerar o certificado.");
  }
}

// Categoria do casal -> status na lista pessoal.
const CAT_CASAL_PARA_PESSOAL = { watching: "watching", wishlist: "wishlist", watched: "finished", favorite: "finished" };

function coupleAddCat() {
  return document.querySelector("#couple-add-cat")?.value || coupleAddCatSel || "watching";
}

// Já existe esse dorama no casal? (por tmdb_id, ou título quando não tem id)
function coupleDramaExistente(tmdbId, title) {
  return coupleDramas.find((d) =>
    (tmdbId && d.tmdb_id && Number(d.tmdb_id) === Number(tmdbId)) ||
    (!tmdbId && title && (d.title || "").trim().toLowerCase() === String(title).trim().toLowerCase()),
  );
}

async function handleCoupleAddDrama(event) {
  event.preventDefault();
  const dramaId = new FormData(event.currentTarget).get("dramaId");
  const drama = state.dramas.find((d) => d.id === dramaId);
  if (!drama) { toast("Escolha um dorama da sua lista."); return; }
  if (!state.couple) return;
  if (coupleDramaExistente(drama.tmdbId, drama.title)) { toast(`${drama.title} já está no casal de vocês.`); return; }
  try {
    await addCoupleDrama(state.couple.id, authUser.id, { ...drama, status: coupleAddCat() });
    coupleDramas = await loadCoupleDramas(state.couple.id);
    render();
    toast(`${drama.title} entrou no cantinho de vocês.`);
  } catch {
    toast("Não consegui adicionar esse dorama ao casal.");
  }
}

async function runCoupleSearch(event) {
  event.preventDefault();
  const q = String(new FormData(event.currentTarget).get("q") || "").trim();
  if (!q) return;
  if (!tmdbReady()) { toast("Busca indisponível (TMDB sem token)."); return; }
  coupleAddSearch = { query: q, loading: true, results: [] };
  render();
  try {
    coupleAddSearch = { query: q, loading: false, results: await searchDramas(q) };
  } catch {
    coupleAddSearch = { query: q, loading: false, results: [] };
    toast("Não consegui buscar agora.");
  }
  render();
}

// Adiciona um resultado da busca ao casal E espelha na lista pessoal (se faltar).
async function handleCoupleAddTmdb(tmdbId, mediaType) {
  const brief = coupleAddSearch.results.find((d) => d.tmdbId === Number(tmdbId));
  if (!brief || !state.couple) return;
  // Não duplica no casal.
  if (coupleDramaExistente(brief.tmdbId, brief.title)) {
    coupleAddSearch = { query: "", loading: false, results: [] };
    render();
    toast(`${brief.title} já está no casal de vocês.`);
    return;
  }
  const status = coupleAddCat();
  toast("Adicionando…");
  let details;
  try {
    details = await getDramaDetails(Number(tmdbId), mediaType || brief.mediaType);
  } catch {
    details = brief;
  }
  const dados = { ...brief, ...details };
  // Espelha na lista pessoal (regra: o que entra no casal entra no pessoal),
  // sem duplicar: confere por tmdbId e, se não tiver, por título.
  const jaNoPessoal = state.dramas.some((d) =>
    (dados.tmdbId && d.tmdbId && d.tmdbId === dados.tmdbId) ||
    (!dados.tmdbId && (d.title || "").trim().toLowerCase() === (dados.title || "").trim().toLowerCase()),
  );
  if (!jaNoPessoal) {
    const personal = normalizeDrama({
      ...dados,
      id: createId(),
      status: CAT_CASAL_PARA_PESSOAL[status] || "wishlist",
      favorite: status === "favorite",
    });
    state.dramas = [personal, ...state.dramas];
    saveState();
    syncDrama(personal);
  }
  try {
    await addCoupleDrama(state.couple.id, authUser.id, { ...dados, status });
    coupleDramas = await loadCoupleDramas(state.couple.id);
    coupleAddSearch = { query: "", loading: false, results: [] };
    render();
    toast(`${dados.title} entrou no casal${jaNoPessoal ? "" : " e na sua lista"}. 💕`);
  } catch {
    toast("Não consegui adicionar ao casal.");
  }
}

// Mover da fila ("Queremos ver") para "Assistindo juntos".
async function handleCoupleMove(id) {
  try {
    await updateCoupleDrama(id, { status: "watching" });
    coupleDramas = await loadCoupleDramas(state.couple.id);
    render();
    toast("Bora assistir! ▶️");
  } catch {
    toast("Não consegui mover.");
  }
}

// Mover um dorama do casal para qualquer categoria (select de cada card).
async function handleCoupleMoveTo(id, status) {
  const d = coupleDramas.find((x) => x.id === id);
  if (!d || d.status === status) return;
  try {
    await updateCoupleDrama(id, { status });
    coupleDramas = await loadCoupleDramas(state.couple.id);
    render();
    toast(`Movido para ${coupleStatusLabel[status] || status}.`);
  } catch {
    toast("Não consegui mover.");
  }
}

// Sortear o próximo da fila do casal.
async function handleCoupleSortearFila() {
  const fila = coupleDramas.filter((d) => d.status === "wishlist");
  if (!fila.length) return;
  const escolhido = fila[Math.floor(Math.random() * fila.length)];
  const ok = await confirmar(`Que tal “${escolhido.title}”?`, { sub: "Sorteado da fila de vocês.", ok: "Começar a ver ▶️", cancel: "Fechar" });
  if (ok) handleCoupleMove(escolhido.id);
}

// Monta o patch de episódio; se completou todos, já manda pros finalizados.
function patchEpisodioCasal(drama, novoEp) {
  const total = Number(drama.episodes || 0);
  const ep = Math.max(0, Number(novoEp) || 0);
  const patch = { currentEpisode: ep };
  if (total > 0 && ep >= total && drama.status === "watching") patch.status = "watched";
  return patch;
}

async function handleCoupleEpisode(id) {
  const drama = coupleDramas.find((d) => d.id === id);
  if (!drama) return;
  const valor = await perguntar(`Episódio atual de ${drama.title}`, String(drama.current_episode || 0), { inputType: "number", ok: "Salvar" });
  if (valor == null) return;
  const patch = patchEpisodioCasal(drama, valor);
  try {
    await updateCoupleDrama(id, patch);
    coupleDramas = await loadCoupleDramas(state.couple.id);
    render();
    toast(patch.status === "watched" ? "Completaram! Foi pros finalizados 🎉" : "Episódio do casal atualizado.");
  } catch {
    toast("Não consegui atualizar.");
  }
}

// "Registrar memória": vai pro Diário com o dorama já pré-selecionado.
function handleCoupleMemory(id) {
  coupleMemoryDraft = id;
  coupleSection = "diario";
  render();
  const ta = document.querySelector("#couple-diary-form textarea");
  ta?.focus();
}

async function handleCouplePlusEp(id) {
  const drama = coupleDramas.find((d) => d.id === id);
  if (!drama) return;
  const novoEp = Number(drama.current_episode || 0) + 1;
  const patch = patchEpisodioCasal(drama, novoEp);
  try {
    await updateCoupleDrama(id, patch);
    await ganharPontos(PONTOS.ep, "episódio junto", "ep", `${id}:${novoEp}`);
    coupleDramas = await loadCoupleDramas(state.couple.id);
    render();
    if (patch.status === "watched") toast("Completaram! Foi pros finalizados 🎉");
  } catch {
    toast("Não consegui atualizar.");
  }
}

async function handleCoupleFinish(id) {
  const drama = coupleDramas.find((d) => d.id === id);
  if (!drama) return;
  const ok = await confirmar(`Finalizar “${drama.title}” juntos?`, { sub: "Vai pra estante de finalizados e libera o certificado. 🎉", ok: "Finalizamos!" });
  if (!ok) return;
  try {
    await updateCoupleDrama(id, { status: "watched" });
    coupleDramas = await loadCoupleDramas(state.couple.id);
    render();
    toast("Mais um finalizado juntos! 🎉");
  } catch {
    toast("Não consegui finalizar.");
  }
}

async function handleCoupleDiary(event) {
  event.preventDefault();
  if (!state.couple) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const drama = coupleDramas.find((d) => d.id === data.dramaId);
  // Tipos sem dorama usam um título livre; com dorama, usa o título dele.
  const titulo = drama?.title || String(data.titleLivre || "").trim();
  // Exige ao menos algum conteúdo (título, texto ou foto).
  if (!titulo && !String(data.comment || "").trim() && !String(data.favMoment || "").trim() && !coupleDiaryFoto) {
    toast("Escreva algo ou anexe uma foto pra guardar essa página. 💕");
    return;
  }
  try {
    const memId = await addCoupleDiary(state.couple.id, authUser.id, {
      kind: data.kind || "episodio",
      tmdbId: drama?.tmdb_id,
      dramaTitle: titulo || "",
      episode: data.episode,
      watchedOn: data.watchedOn,
      place: data.place,
      snack: data.snack,
      mood: data.mood,
      chosenBy: data.chosenBy,
      favMoment: data.favMoment,
      insideJoke: data.insideJoke,
      noteHim: data.noteHim,
      noteHer: data.noteHer,
      whoCried: data.whoCried,
      whoRaged: data.whoRaged,
      comment: data.comment,
      photo: coupleDiaryFoto,
    });
    if (memId) await ganharPontos(PONTOS.memoria, "memória no diário", "memory", memId);
    coupleMemoryDraft = null;
    coupleDiaryFoto = null;
    coupleDiary = await loadCoupleDiary(state.couple.id);
    render();
    toast("Página guardada no álbum. 💕");
  } catch {
    toast("Não consegui guardar essa memória.");
  }
}

// Abre a foto em tela cheia (toca pra fechar).
function abrirFotoZoom(src) {
  if (!src) return;
  const ov = document.createElement("div");
  ov.className = "foto-zoom-overlay";
  const img = document.createElement("img");
  img.src = src;
  ov.appendChild(img);
  ov.addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
}

// Carrega a foto; se o navegador não decodificar (ex.: HEIC), tenta converter pra JPEG.
async function carregarFoto(file) {
  try {
    return await resizeImage(file, 720);
  } catch (e) {
    try {
      const mod = await import("https://esm.sh/heic2any@0.0.4");
      const heic2any = mod.default || mod;
      const jpg = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.82 });
      return await resizeImage(Array.isArray(jpg) ? jpg[0] : jpg, 720);
    } catch {
      throw e;
    }
  }
}

function fotoErroMsg(f) {
  const t = (f?.type || "").toLowerCase();
  const nome = (f?.name || "").toLowerCase();
  if (t.includes("heic") || t.includes("heif") || /\.hei[cf]$/.test(nome)) {
    return "Essa foto é HEIC (modo alta eficiência). Na câmera, mude o formato pra JPG — ou mande um print da foto.";
  }
  return `Não consegui abrir essa foto${t ? ` (${t})` : ""}. Tenta uma em JPG ou PNG.`;
}

// Anexar foto ao diário / cartinha (data URL, sem re-render pra não perder o texto digitado).
async function handleDiaryFoto(input) {
  const f = input.files?.[0];
  if (!f) return;
  try { coupleDiaryFoto = await carregarFoto(f); } catch (e) { console.error("foto diário:", f?.type, f?.size, e); toast(fotoErroMsg(f)); return; }
  const wrap = document.querySelector("#diary-foto-wrap");
  if (wrap) {
    wrap.innerHTML = `<div class="foto-preview"><img src="${coupleDiaryFoto}" alt="" /><button type="button" class="foto-remove">✕ tirar foto</button></div>`;
    const b = wrap.querySelector(".foto-remove");
    if (b) b.onclick = () => { coupleDiaryFoto = null; wrap.innerHTML = ""; };
  }
}
async function handleCommentFoto(input) {
  const f = input.files?.[0];
  if (!f) return;
  try { clubCommentFoto = await carregarFoto(f); } catch (e) { console.error("foto surto:", f?.type, f?.size, e); toast(fotoErroMsg(f)); return; }
  const wrap = document.querySelector("#comment-foto-wrap");
  if (wrap) {
    wrap.innerHTML = `<div class="foto-preview"><img src="${clubCommentFoto}" alt="" /><button type="button" class="foto-remove">✕ tirar foto</button></div>`;
    const b = wrap.querySelector(".foto-remove");
    if (b) b.onclick = () => { clubCommentFoto = null; wrap.innerHTML = ""; };
  }
}
async function handleLetterFoto(input) {
  const f = input.files?.[0];
  if (!f) return;
  try { coupleLetterFoto = await carregarFoto(f); } catch (e) { console.error("foto cartinha:", f?.type, f?.size, e); toast(fotoErroMsg(f)); return; }
  const wrap = document.querySelector("#letter-foto-wrap");
  if (wrap) {
    wrap.innerHTML = `<div class="foto-preview"><img src="${coupleLetterFoto}" alt="" /><button type="button" class="foto-remove">✕ tirar foto</button></div>`;
    const b = wrap.querySelector(".foto-remove");
    if (b) b.onclick = () => { coupleLetterFoto = null; wrap.innerHTML = ""; };
  }
}

// Define a data de início do namoro (destaque do "Sobre nós").
async function handleNamoroInicio(value) {
  if (!state.couple) return;
  const val = String(value || "").slice(0, 10);
  try {
    await saveCoupleAbout(state.couple.id, authUser.id, "namoro_inicio", val);
    coupleAbout.namoro_inicio = val;
    render();
    toast(val ? "Data guardada 💕" : "Data removida.");
  } catch {
    toast("Não consegui salvar a data.");
  }
}

// Toca num card de "Sobre nós" -> responde/edita ali mesmo (estilo Daylio).
async function handleAboutPick(key) {
  if (!state.couple) return;
  const label = (aboutLabels.find(([k]) => k === key) || [])[1] || "Sobre nós";
  const atual = coupleAbout[key] || "";
  const v = await perguntar(label, atual, { ok: "Guardar", placeholder: "Nossa resposta…" });
  if (v == null) return;
  const val = String(v).trim();
  try {
    await saveCoupleAbout(state.couple.id, authUser.id, key, val);
    coupleAbout[key] = val;
    aboutPerguntaIdx += 1; // próxima pergunta em destaque
    render();
    toast(val ? "Guardado 💛" : "Resposta limpa.");
  } catch {
    toast("Não consegui salvar.");
  }
}

async function handleCoupleLetter(event) {
  event.preventDefault();
  const form = event.currentTarget; // guarda antes do await (currentTarget vira null depois)
  const data = Object.fromEntries(new FormData(form));
  const body = String(data.body || "").trim();
  if (!state.couple || (!body && !coupleLetterFoto)) return;
  try {
    const lid = await addCoupleLetter(state.couple.id, authUser.id, { kind: data.kind, body, photo: coupleLetterFoto });
    if (lid) await ganharPontos(PONTOS.cartinha, "cartinha", "letter", lid);
    coupleLetterFoto = null;
    form.reset();
    coupleLetters = await loadCoupleLetters(state.couple.id);
    render();
    toast("Cartinha guardada. 💌");
  } catch (error) {
    console.error("cartinha:", error);
    toast(error?.message || "Não consegui guardar a cartinha.");
  }
}

// Deixar um recadinho rápido (do painel) — vira mais uma cartinha do casal.
async function handleCoupleRecado() {
  if (!state.couple) return;
  const texto = await perguntar("Deixe um recadinho 💌", "", { ok: "Guardar", placeholder: "Uma coisa que eu amei hoje…" });
  if (texto == null) return;
  const body = String(texto).trim();
  if (!body) return;
  try {
    const lid = await addCoupleLetter(state.couple.id, authUser.id, { kind: "recado", body });
    if (lid) await ganharPontos(PONTOS.cartinha, "recadinho", "letter", lid);
    coupleLetters = await loadCoupleLetters(state.couple.id);
    recadoIndex = 0; // recém-criado fica em primeiro (lista vem do mais novo)
    render();
    toast("Recadinho guardado. 💌");
  } catch {
    toast("Não consegui guardar o recadinho.");
  }
}

function handleRecadoShuffle() {
  recadoIndex = recadoIndex + 1;
  render();
}

function handleDateRoulette() {
  const drama = (coupleDramas.length ? coupleDramas : state.dramas)[Math.floor(Math.random() * Math.max(1, (coupleDramas.length ? coupleDramas : state.dramas).length))];
  const snacks = ["pipoca doce", "brigadeiro", "chocolate", "salgadinho", "café gelado", "pedido surpresa"];
  const missoes = ["cada um escolhe uma frase icônica", "pausar no maior surto", "dar nota no final", "tirar print da cena favorita", "escrever uma cartinha depois"];
  const snack = snacks[Math.floor(Math.random() * snacks.length)];
  const missao = missoes[Math.floor(Math.random() * missoes.length)];
  uiModal = {
    type: "confirm",
    message: "Date dorameiro sorteado",
    sub: `${drama ? drama.title : "Escolham um dorama novo"} + ${snack}. Missão: ${missao}.`,
    ok: "Amei",
    cancel: "Fechar",
    resolve: () => {},
  };
  render();
}

async function copyCoupleCode() {
  if (!state.couple?.code) return;
  await navigator.clipboard?.writeText(state.couple.code).catch(() => {});
  toast("Código do casal copiado.");
}

async function handleLeaveCouple() {
  if (!state.couple) return;
  const ok = await confirmar("Sair deste espaço de casal?", {
    sub: "Você deixa de ver o diário e as memórias. A outra pessoa continua com o espaço se ainda estiver nele.",
    ok: "Sair",
    cancel: "Ficar",
    danger: true,
  });
  if (!ok) return;
  try {
    await leaveCouple(state.couple.id);
    state.couple = null;
    coupleFor = null;
    coupleMembers = [];
    coupleDramas = [];
    coupleDiary = [];
    coupleAbout = {};
    coupleLetters = [];
    couplePet = null;
    coupleQuiz = [];
    coupleQuizFor = null;
    nosRewards = []; nosClaims = []; couplePrefs = []; coupleChallenges = []; coupleLedger = []; coupleCheckins = []; nosFor = null; nosUnlocked = false;
    try { localStorage.removeItem(NOS_UNLOCK_KEY); } catch { /* ignore */ }
    coupleWishlist = []; coupleDates = []; planosFor = null;
    state.space = "solo"; // volta pro app normal
    saveState();
    aplicarTemaAmbiente(); // restaura o tema pessoal
    render();
    toast("Você saiu do espaço do casal.");
  } catch {
    toast("Não consegui sair agora.");
  }
}

async function handleDeleteCoupleDrama(id) {
  const ok = await confirmar("Tirar este dorama do casal?", { ok: "Tirar", danger: true });
  if (!ok) return;
  try {
    await deleteCoupleDrama(id);
    coupleDramas = coupleDramas.filter((d) => d.id !== id);
    render();
    toast("Dorama removido do casal.");
  } catch {
    toast("Não consegui remover.");
  }
}

async function handleDeleteCoupleDiary(id) {
  const ok = await confirmar("Apagar esta memória?", { ok: "Apagar", danger: true });
  if (!ok) return;
  try {
    await deleteCoupleDiary(id);
    await estornarPontos(-PONTOS.memoria, "memória apagada", "memory_refund", id);
    coupleDiary = coupleDiary.filter((d) => d.id !== id);
    render();
    toast("Memória apagada.");
  } catch {
    toast("Não consegui apagar.");
  }
}

async function handleDeleteCoupleLetter(id) {
  const ok = await confirmar("Apagar esta cartinha?", { ok: "Apagar", danger: true });
  if (!ok) return;
  try {
    await deleteCoupleLetter(id);
    await estornarPontos(-PONTOS.cartinha, "cartinha apagada", "letter_refund", id);
    coupleLetters = coupleLetters.filter((l) => l.id !== id);
    render();
    toast("Cartinha apagada.");
  } catch {
    toast("Só quem escreveu consegue apagar essa cartinha.");
  }
}

// Registra uma atividade no feed do clube (silencioso; só se logado e num clube).
function registrarAtividade(text) {
  if (!cloudOn() || !state.club) return Promise.resolve();
  return logActivity(authUser.id, state.club.id, text).catch(() => {});
}

async function handlePickMonth(dramaId) {
  const drama = state.dramas.find((d) => d.id === dramaId);
  if (!drama || !state.club) return;
  try {
    await pickMonth(authUser.id, state.club.id, drama);
    clubSocial.picks = await clubPicksTally(state.club.id);
    render();
    toast(`Você votou em ${drama.title} 🗳️`);
  } catch {
    toast("Não consegui registrar seu voto.");
  }
}

async function handleToggleReaction(commentId, emoji) {
  try {
    await toggleReaction(commentId, emoji);
    clubSocial.reactions = await clubReactions(state.club.id);
    render();
  } catch {
    toast("Não consegui reagir.");
  }
}

async function legacyHandleListAdd(dramaId) {
  const drama = state.dramas.find((d) => d.id === dramaId);
  if (!drama || !state.club) return;
  try {
    await clubListAdd(state.club.id, drama);
    clubSocial.list = await clubListFeed(state.club.id);
    render();
    toast(`${drama.title} entrou na lista do clube 💜`);
  } catch {
    toast("Não consegui adicionar à lista.");
  }
}

async function handleListAdd(dramaId, manualTitle = "") {
  const drama = dramaId ? state.dramas.find((d) => d.id === dramaId) : null;
  const title = String(manualTitle || "").trim();
  const payload = drama || (title ? { title, tmdbId: null, cover: null } : null);
  if (!payload || !state.club) {
    toast("Escolha um dorama ou escreva um titulo.");
    return;
  }
  try {
    await clubListAdd(state.club.id, payload);
    clubSocial.list = await clubListFeed(state.club.id);
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    render();
    toast(`${payload.title} foi sugerido 💡`);
  } catch (e) {
    console.error("clubListAdd", e);
    toast(e?.message?.includes("2 doramas") ? "Você já sugeriu 2 doramas. Apague um pra trocar." : "Não consegui adicionar agora.");
  }
}

async function runClubSearch(event) {
  event.preventDefault();
  const q = String(new FormData(event.currentTarget).get("q") || "").trim();
  if (!q) return;
  if (!tmdbReady()) { toast("Busca indisponível (TMDB sem token)."); return; }
  clubAddSearch = { query: q, loading: true, results: [] };
  render();
  try {
    clubAddSearch = { query: q, loading: false, results: await searchDramas(q) };
  } catch {
    clubAddSearch = { query: q, loading: false, results: [] };
    toast("Não consegui buscar agora.");
  }
  render();
}
// Adiciona um resultado do TMDB (com capa) direto na sala de escolha do clube.
async function handleClubAddTmdb(tmdbId) {
  const brief = clubAddSearch.results.find((d) => d.tmdbId === Number(tmdbId));
  if (!brief || !state.club) return;
  if ((clubSocial.list || []).some((it) => (brief.tmdbId && it.tmdb_id && Number(it.tmdb_id) === brief.tmdbId) || (it.title || "").toLowerCase() === brief.title.toLowerCase())) {
    toast(`${brief.title} já está na sala de escolha.`);
    return;
  }
  toast("Adicionando…");
  try {
    await clubListAdd(state.club.id, { title: brief.title, tmdbId: brief.tmdbId, cover: brief.cover || null });
    clubSocial.list = await clubListFeed(state.club.id);
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    clubAddSearch = { query: "", loading: false, results: [] };
    render();
    toast(`${brief.title} foi sugerido 💡`);
  } catch (e) {
    console.error("clubListAdd", e);
    toast(e?.message?.includes("2 doramas") ? "Você já sugeriu 2 doramas. Apague um pra trocar." : "Não consegui adicionar agora.");
  }
}

async function handleSetClubFeaturedFromList(listId) {
  const item = (clubSocial.list || []).find((entry) => entry.id === listId);
  if (!item || !state.club) return;
  try {
    await setClubFeaturedDrama(
      state.club.id,
      { title: item.title, tmdbId: item.tmdb_id ?? null, cover: item.cover || null },
      "week",
    );
    // O dorama aceito sai dos sugeridos.
    await clubListRemove(listId).catch(() => {});
    clubSocial.featured = await clubCurrentFeaturedDrama(state.club.id);
    clubSocial.list = await clubListFeed(state.club.id).catch(() => (clubSocial.list || []).filter((i) => i.id !== listId));
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    await registrarAtividade(`🎬 ${state.profile?.name || "Alguém"} fixou ${item.title} como dorama do clube`);
    clubSocial.activities = await clubActivities(state.club.id).catch(() => clubSocial.activities);
    clubTab = "doramas";
    render();
    toast(`${item.title} virou o dorama do clube.`);
  } catch (error) {
    toast(error?.message?.includes("permissao") ? "So dono ou moderador pode fixar." : "Nao consegui fixar esse dorama.");
  }
}

function handleDebateClubList(listId) {
  const item = (clubSocial.list || []).find((entry) => entry.id === listId);
  if (!item) return;
  clubDebateDraft = { title: item.title, tmdbId: item.tmdb_id ?? null };
  commentDraft = null;
  clubTab = "feed";
  render();
  setTimeout(() => document.querySelector("#commentBody")?.focus(), 0);
}

async function handleListVote(listId, vote) {
  try {
    await clubListVote(listId, vote);
    clubSocial.list = await clubListFeed(state.club.id);
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    render();
  } catch {
    toast("Não consegui votar.");
  }
}

async function handleListRemove(listId) {
  if (!(await confirmar("Tirar este dorama da lista do clube?", { ok: "Tirar", danger: true }))) return;
  try {
    await clubListRemove(listId);
    clubSocial.list = clubSocial.list.filter((i) => i.id !== listId);
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    render();
    toast("Removido da lista.");
  } catch {
    toast("Não consegui remover.");
  }
}

async function handleSetClubFeatured(dramaId, periodType) {
  const drama = state.dramas.find((d) => d.id === dramaId);
  if (!drama || !state.club) return;
  try {
    await setClubFeaturedDrama(state.club.id, drama, periodType || "week");
    clubSocial.featured = await clubCurrentFeaturedDrama(state.club.id);
    render();
    toast(`${drama.title} virou o dorama do clube.`);
  } catch (error) {
    toast(error?.message?.includes("permissao") ? "So dono ou moderador pode fixar o dorama do clube." : "Nao consegui fixar esse dorama.");
  }
}

async function handleClubFeaturedCheckin(episode, status, opts = {}) {
  if (!clubSocial.featured?.id) return false;
  try {
    await saveClubDramaCheckin(clubSocial.featured.id, episode, status);
    clubSocial.featured = await clubCurrentFeaturedDrama(state.club.id);
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    clubSocial.points = await clubPointsRanking(state.club.id).catch(() => clubSocial.points || []);
    clubSocial.myPoints = await clubMyPointsLedger(state.club.id, authUser?.id).catch(() => clubSocial.myPoints || []);
    render();
    if (!opts.silent) toast(`Episódio ${Number(episode) || 0} salvo 🎬`);
    return true;
  } catch {
    toast("Não consegui salvar seu check-in.");
    return false;
  }
}
// Modo Episódio: marcar/desmarcar um episódio como visto (usa o check-in sequencial).
// Pede confirmação pra não mudar seu progresso sem querer (mexe no "todos terminaram" e nos pontos).
async function handleEpToggle(n, seen) {
  const num = Number(n) || 0;
  const meuEp = Number(clubSocial.featured?.my_episode || 0);
  const novoEp = seen ? Math.max(0, num - 1) : num;
  const sub = seen
    ? `Seu progresso volta pro ep. ${novoEp}. Isso conta pro "todos terminaram" e pros pontos.`
    : (num > meuEp + 1 ? `Marca os episódios ${meuEp + 1} a ${num} como vistos.` : `Confirma que você assistiu o ep. ${num}.`);
  const ok = await confirmar(
    seen ? `Desmarcar o ep. ${num}?` : `Você já assistiu o ep. ${num}?`,
    { sub, ok: seen ? "Desmarcar" : "Sim, assisti 👍", cancel: "Cancelar", danger: seen },
  );
  if (!ok) return;
  const okSave = await handleClubFeaturedCheckin(novoEp, "watching", { silent: true });
  if (okSave) toast(seen ? `Ep. ${num} desmarcado` : `Ep. ${num} visto 👁`);
}

// Modo Episódio: dar/limpar nota (toca na mesma estrela pra limpar).
async function handleRateEpisode(n, stars) {
  if (!clubSocial.featured?.id) return;
  const num = Number(n) || 0;
  const r = (clubSocial.epRatings || []).find((x) => Number(x.episode_number) === num);
  const atual = Number(r?.my_stars || 0);
  const nova = atual === Number(stars) ? 0 : Number(stars);
  try {
    await rateClubEpisode(clubSocial.featured.id, num, nova);
    clubSocial.epRatings = await clubEpisodeRatings(clubSocial.featured.id).catch(() => clubSocial.epRatings || []);
    render();
    if (nova) toast(`Ep. ${num}: ${nova}★`);
  } catch {
    toast("Não consegui salvar sua nota.");
  }
}

// Modo Episódio: abrir/fechar o painel de discussão de um episódio.
function toggleEpisodioDetalhe(n) {
  const num = Number(n) || 0;
  epDetailOpen = epDetailOpen === num ? null : num;
  render();
}

// Modo Episódio: publicar um surto amarrado a um episódio (usa o mural + trava de spoiler no ep N).
async function handlePostEpisodeComment(n, body) {
  const texto = String(body || "").trim();
  const featured = clubSocial.featured;
  if (!texto || !state.club || !featured) return;
  try {
    await postComment(authUser.id, state.club.id, {
      body: texto,
      tmdbId: featured.tmdb_id ?? null,
      dramaTitle: featured.title || null,
      spoilerEpisode: Number(n) || 0,
    });
    clubFeedFor = null;
    await loadClubFeed(); // recarrega o mural (e o contador por episódio) + re-render
    toast(`Surto no ep. ${n} publicado 💬`);
  } catch {
    toast("Não consegui publicar agora.");
  }
}

// "Terminei" (ou reabrir) — marca o check-in como finished mantendo o ep. atual.
async function handleClubFinish(v) {
  const titulo = clubSocial.featured?.title || "o dorama do clube";
  if (v === "1") {
    const ok = await confirmar(`Você terminou ${titulo} inteiro?`, {
      sub: "Isso marca que VOCÊ assistiu até o fim. O clube só troca de dorama quando TODOS terminarem — então só marque se realmente acabou. 🏁",
      ok: "Sim, terminei 🏁",
      cancel: "Ainda não",
    });
    if (!ok) return;
  }
  const ep = Number(clubSocial.featured?.my_episode || 0);
  const saved = await handleClubFeaturedCheckin(ep, v === "1" ? "finished" : "watching", { silent: true });
  if (!saved) return;
  if (v === "1") {
    await registrarAtividade(`🏁 ${state.profile?.name || "Alguém"} terminou ${titulo}`);
    clubSocial.activities = await clubActivities(state.club.id).catch(() => clubSocial.activities);
    render();
    const membros = Math.max(1, Number(clubSocial.cycle?.members_count || clubMembers.length || 1));
    const terminaram = Number(clubSocial.cycle?.finished_count || 0);
    if (membros >= 2 && terminaram >= membros) {
      toast("Todo mundo terminou! Agora o clube pode escolher o próximo dorama.");
    } else {
      toast(`Seu finalizado foi registrado. O clube só troca quando todo mundo terminar (${terminaram}/${membros}).`);
    }
  } else {
    toast("Pronto, você voltou para assistindo.");
  }
}
async function handleClubOpenVoting() {
  if (!state.club) return;
  try {
    await clubOpenVoting(state.club.id);
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    render();
    toast("Votação aberta 🗳️");
  } catch (e) { console.error(e); toast("Só dono/moderador pode abrir a votação."); }
}
async function handleClubCloseVoting() {
  if (!state.club) return;
  const membros = Math.max(1, Number(clubSocial.cycle?.members_count || clubMembers.length || 1));
  const terminaram = Number(clubSocial.cycle?.finished_count || 0);
  if (membros < 2 || terminaram < membros) {
    toast(`Ainda não dá pra trocar: ${terminaram}/${membros} terminaram.`);
    return;
  }
  const ok = await confirmar("Escolher o próximo dorama agora?", { sub: "Como todo mundo marcou que terminou, o candidato mais votado vira o novo dorama do clube.", ok: "Escolher próximo" });
  if (!ok) return;
  try {
    await clubCloseVoting(state.club.id);
    clubSocial.cycle = await clubCycle(state.club.id).catch(() => clubSocial.cycle);
    clubSocial.featured = await clubCurrentFeaturedDrama(state.club.id).catch(() => clubSocial.featured);
    clubSocial.list = await clubListFeed(state.club.id).catch(() => clubSocial.list);
    if (clubSocial.featured?.title) await registrarAtividade(`🏆 Novo dorama do clube: ${clubSocial.featured.title}`);
    clubSocial.activities = await clubActivities(state.club.id).catch(() => clubSocial.activities);
    render();
    toast("Novo dorama do clube definido! 🎬");
  } catch (e) { console.error(e); toast("Só dono/moderador pode fechar a votação."); }
}

async function handleCreateClubPoll(event) {
  event.preventDefault();
  if (!state.club) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const question = String(data.question || "").trim();
  const options = String(data.options || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!question || options.length < 2) {
    toast("Crie uma pergunta com pelo menos duas opcoes.");
    return;
  }
  try {
    await createClubPoll(state.club.id, question, options);
    await registrarAtividade(`🗳️ ${state.profile?.name || "Alguém"} abriu a enquete: ${question}`);
    clubSocial.polls = await clubPollsFeed(state.club.id);
    clubSocial.activities = await clubActivities(state.club.id).catch(() => clubSocial.activities);
    clubSocial.points = await clubPointsRanking(state.club.id).catch(() => clubSocial.points || []);
    form.reset();
    render();
    toast("Enquete criada no clube.");
  } catch (error) {
    toast(error?.message || "Nao consegui criar a enquete.");
  }
}

async function handleVoteClubPoll(pollId, optionId) {
  try {
    await voteClubPoll(pollId, optionId);
    clubSocial.polls = await clubPollsFeed(state.club.id);
    clubSocial.points = await clubPointsRanking(state.club.id).catch(() => clubSocial.points || []);
    render();
  } catch {
    toast("Nao consegui registrar seu voto.");
  }
}

async function handleCloseClubPoll(pollId) {
  if (!(await confirmar("Encerrar esta enquete?", { ok: "Encerrar" }))) return;
  try {
    await closeClubPoll(pollId);
    clubSocial.polls = await clubPollsFeed(state.club.id);
    render();
    toast("Enquete encerrada.");
  } catch (error) {
    toast(error?.message?.includes("permissao") ? "So dono ou moderador pode encerrar." : "Nao consegui encerrar.");
  }
}

async function handleCreateClubEvent(event) {
  event.preventDefault();
  if (!state.club) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  let tmdbId = null;
  let dramaTitle = "";
  if (String(data.dramaId || "").startsWith("featured:")) {
    const parts = String(data.dramaId).split(":");
    tmdbId = Number(parts[1]) || null;
    dramaTitle = clubSocial.featured?.title || "";
  } else if (data.dramaId) {
    const drama = state.dramas.find((d) => d.id === data.dramaId);
    if (drama) {
      tmdbId = drama.tmdbId ?? null;
      dramaTitle = drama.title;
    }
  }
  const title = String(data.title || "").trim();
  const startsAt = data.startsAt ? new Date(String(data.startsAt)).toISOString() : "";
  if (!title || !startsAt) {
    toast("Preencha titulo e data do evento.");
    return;
  }
  try {
    await createClubEvent(state.club.id, {
      type: data.type,
      title,
      description: String(data.description || "").trim(),
      tmdbId,
      dramaTitle,
      startsAt,
    });
    await registrarAtividade(`📅 ${state.profile?.name || "Alguém"} marcou: ${title}`);
    clubSocial.events = await clubEventsFeed(state.club.id);
    clubSocial.activities = await clubActivities(state.club.id).catch(() => clubSocial.activities);
    clubSocial.points = await clubPointsRanking(state.club.id).catch(() => clubSocial.points || []);
    form.reset();
    render();
    toast("Evento criado no clube.");
  } catch (error) {
    toast(error?.message || "Nao consegui criar o evento.");
  }
}

async function handleClubEventRsvp(eventId, status) {
  try {
    await setClubEventRsvp(eventId, status);
    clubSocial.events = await clubEventsFeed(state.club.id);
    clubSocial.points = await clubPointsRanking(state.club.id).catch(() => clubSocial.points || []);
    render();
  } catch {
    toast("Nao consegui salvar sua presenca.");
  }
}

async function handleCancelClubEvent(eventId) {
  if (!(await confirmar("Cancelar este evento?", { ok: "Cancelar", danger: true }))) return;
  try {
    await cancelClubEvent(eventId);
    clubSocial.events = await clubEventsFeed(state.club.id);
    render();
    toast("Evento cancelado.");
  } catch (error) {
    toast(error?.message?.includes("permissao") ? "So dono ou moderador pode cancelar." : "Nao consegui cancelar.");
  }
}

async function refreshClubPointsAndChallenges() {
  if (!state.club) return;
  const [points, challenges] = await Promise.all([
    clubPointsRanking(state.club.id).catch(() => []),
    clubChallengesFeed(state.club.id).catch(() => []),
  ]);
  clubSocial.points = points;
  clubSocial.challenges = challenges;
}

async function handleCreateClubChallenge(event) {
  event.preventDefault();
  if (!state.club) return;
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  const title = String(data.title || "").trim();
  if (!title) return;
  const endsAt = data.endsAt ? new Date(String(data.endsAt)).toISOString() : null;
  try {
    await createClubChallenge(state.club.id, {
      title,
      description: String(data.description || "").trim(),
      points: Number(data.points) || 10,
      endsAt,
    });
    await registrarAtividade(`🎯 ${state.profile?.name || "Alguém"} criou a missão: ${title}`);
    await refreshClubPointsAndChallenges();
    clubSocial.activities = await clubActivities(state.club.id).catch(() => clubSocial.activities);
    form.reset();
    render();
    toast("Desafio criado no clube.");
  } catch (error) {
    toast(error?.message || "Nao consegui criar o desafio.");
  }
}

async function handleCompleteClubChallenge(event) {
  event.preventDefault();
  const challengeId = event.currentTarget.dataset.challengeComplete;
  const proof = String(new FormData(event.currentTarget).get("proof") || "").trim();
  try {
    await completeClubChallenge(challengeId, proof);
    await refreshClubPointsAndChallenges();
    render();
    toast("Desafio concluido. Pontos registrados.");
  } catch {
    toast("Nao consegui concluir o desafio.");
  }
}

async function handleCloseClubChallenge(challengeId) {
  if (!(await confirmar("Encerrar este desafio?", { ok: "Encerrar" }))) return;
  try {
    await closeClubChallenge(challengeId);
    await refreshClubPointsAndChallenges();
    render();
    toast("Desafio encerrado.");
  } catch (error) {
    toast(error?.message?.includes("permissao") ? "So dono ou moderador pode encerrar." : "Nao consegui encerrar.");
  }
}

async function handleCreateClubChatMessage(event) {
  event.preventDefault();
  if (!state.club) return;
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const body = String(data.body || "").trim();
  if (!body) return;
  const spoiler = Boolean(data.hasSpoiler);
  chatDraft = "";
  clubChatSpoilerOn = false;
  try {
    await createClubChatMessage(state.club.id, { body, hasSpoiler: spoiler, episodeNumber: 0 });
    // Recarrega como fallback (o Realtime já adiciona ao vivo; dedup por id evita repetir).
    const [chat, points] = await Promise.all([
      clubChatFeed(state.club.id).catch(() => clubSocial.chat || []),
      clubPointsRanking(state.club.id).catch(() => clubSocial.points || []),
    ]);
    clubSocial.chat = chat;
    clubSocial.points = points;
    render();
  } catch (error) {
    toast(error?.message || "Não consegui enviar a mensagem.");
  }
}

async function handleDeleteClubChatMessage(messageId) {
  if (!(await confirmar("Apagar esta mensagem?", { ok: "Apagar", danger: true }))) return;
  try {
    await deleteClubChatMessage(messageId);
    clubSocial.chat = await clubChatFeed(state.club.id).catch(() => clubSocial.chat || []);
    render();
    toast("Mensagem apagada.");
  } catch (error) {
    toast(error?.message?.includes("permissao") ? "Voce nao pode apagar essa mensagem." : "Nao consegui apagar.");
  }
}

async function handleToggleChatReaction(messageId, emoji) {
  if (!state.club || !messageId || !emoji) return;
  chatReactPicker = null;
  try {
    await toggleClubChatReaction(messageId, emoji);
    clubSocial.chatReactions = await clubChatReactions(state.club.id).catch(() => clubSocial.chatReactions || []);
    render();
  } catch {
    toast("Não consegui reagir agora.");
  }
}

async function handlePostComment(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const body = String(data.body || "").trim();
  if ((!body && !clubCommentFoto) || !state.club) return;
  let tmdbId = null;
  let dramaTitle = null;
  let spoilerEpisode = 0;
  if (data.dramaId === "__club_draft" && clubDebateDraft) {
    tmdbId = clubDebateDraft.tmdbId ?? null;
    dramaTitle = clubDebateDraft.title;
    spoilerEpisode = Number(data.spoiler) || 0;
  } else if (String(data.dramaId || "").startsWith("tmdb:")) {
    // valor = "tmdb:<id>:<título>" (dorama DO CLUBE)
    const partes = String(data.dramaId).split(":");
    tmdbId = Number(partes[1]) || null;
    dramaTitle = partes.slice(2).join(":") || null;
    spoilerEpisode = Number(data.spoiler) || 0;
  }
  const kind = ["geral", "teoria", "meme"].includes(String(data.kind)) ? String(data.kind) : "geral";
  try {
    await postComment(authUser.id, state.club.id, { body, tmdbId, dramaTitle, spoilerEpisode, kind, photo: clubCommentFoto });
    commentDraft = null;
    clubDebateDraft = null;
    clubCommentFoto = null;
    clubFeedFor = null;
    // Manda pra aba do que acabou de postar (episódio > teoria/meme > geral).
    clubMuralTab = spoilerEpisode >= 1 ? "episodios" : (kind === "teoria" ? "teorias" : kind === "meme" ? "memes" : "geral");
    loadClubFeed();
    toast("Publicado no mural! 💜");
  } catch {
    toast("Não consegui publicar agora.");
  }
}

async function handleDeleteComment(id) {
  if (!(await confirmar("Apagar este comentário?", { ok: "Apagar", danger: true }))) return;
  try {
    await deleteOwnComment(id);
    clubFeedItems = clubFeedItems.filter((item) => item.id !== id);
    toast("Comentário apagado.");
    render();
  } catch {
    toast("Não consegui apagar.");
  }
}

async function handleCreateClub(event) {
  event.preventDefault();
  const name = String(new FormData(event.currentTarget).get("name") || "").trim();
  try {
    const club = await createClub(name);
    const c = mapClubRow(club);
    state.clubs = [...(state.clubs || []), c];
    trocarClubeAtivo(c);
    setState({ club: c });
    loadClubMembers();
    toast(`Clube criado! Código: ${club.code}`);
  } catch (error) {
    toast(error?.message || "Não consegui criar o clube.");
  }
}

async function handleJoinClub(event) {
  event.preventDefault();
  const code = String(new FormData(event.currentTarget).get("code") || "").trim();
  try {
    const club = await joinClub(code);
    const c = mapClubRow(club);
    state.clubs = [...(state.clubs || []).filter((x) => x.id !== c.id), c];
    trocarClubeAtivo(c);
    setState({ club: c });
    loadClubMembers();
    toast(`Você entrou em ${club.name}.`);
  } catch (error) {
    toast(error?.message?.includes("não encontrado") ? "Código não encontrado." : "Não consegui entrar no clube.");
  }
}

async function handleLeaveClub() {
  if (!state.club) return;
  const souDono = state.club.owner_id === authUser?.id;
  const sub = souDono ? "Como você é o dono, o membro mais antigo vira o novo dono. Se não sobrar ninguém, o clube é apagado." : "Você deixa de ver este clube.";
  if (!(await confirmar(`Sair de “${state.club.name}”?`, { sub, ok: "Sair", danger: true }))) return;
  const saindoId = state.club.id;
  try {
    await leaveClub(saindoId);
    state.clubs = (state.clubs || []).filter((c) => c.id !== saindoId);
    const proximo = state.clubs[0] || null;
    if (proximo) trocarClubeAtivo(proximo);
    else {
      trocarClubeAtivo(null);
    }
    setState({ club: proximo });
    if (proximo) loadClubMembers();
    toast("Você saiu do clube.");
  } catch {
    toast("Não consegui sair do clube agora.");
  }
}

async function handleDeleteClub() {
  if (!state.club) return;
  if (state.club.owner_id !== authUser?.id) { toast("Só o dono pode excluir o clube."); return; }
  const nome = state.club.name;
  const ok1 = await confirmar(`Excluir “${nome}” pra sempre?`, {
    sub: "Apaga o clube pra TODOS os membros: mural, chat, doramas, ranking, tudo. Não dá pra desfazer.",
    ok: "Quero excluir", cancel: "Cancelar", danger: true,
  });
  if (!ok1) return;
  const ok2 = await confirmar("Tem certeza absoluta?", { sub: "É permanente e afeta todo mundo do clube.", ok: "Sim, excluir", cancel: "Cancelar", danger: true });
  if (!ok2) return;
  const delId = state.club.id;
  try {
    await deleteClub(delId);
    state.clubs = (state.clubs || []).filter((c) => c.id !== delId);
    const proximo = state.clubs[0] || null;
    trocarClubeAtivo(proximo);
    setState({ club: proximo });
    if (proximo) loadClubMembers();
    toast("Clube excluído.");
  } catch (e) {
    console.error(e);
    toast("Só o dono pode excluir o clube.");
  }
}

async function handleRenameClub() {
  const novo = await perguntar("Novo nome do clube:", state.club?.name || "", { ok: "Salvar" });
  if (!novo || !novo.trim() || !state.club) return;
  try {
    await renameClub(state.club.id, novo.trim());
    state.club = { ...state.club, name: novo.trim() };
    setState({ club: state.club });
    toast("Nome do clube atualizado.");
  } catch (error) {
    toast(error?.message?.includes("criou") ? "Só quem criou o clube pode renomear." : "Não consegui renomear.");
  }
}

async function handleEditClubAbout() {
  if (!state.club) return;
  const description = await perguntar("Descricao curta do clube:", state.club.description || "", { ok: "Salvar" });
  if (description === null || description === undefined) return;
  const rules = await perguntar("Regras do clube:", state.club.rules || "", { ok: "Salvar" });
  if (rules === null || rules === undefined) return;
  try {
    await updateClubDetails(state.club.id, { description: description.trim(), rules: rules.trim() });
    state.club = { ...state.club, description: description.trim(), rules: rules.trim() };
    state.clubs = (state.clubs || []).map((club) => (club.id === state.club.id ? state.club : club));
    setState({ club: state.club, clubs: state.clubs });
    toast("Sobre do clube atualizado.");
  } catch (error) {
    toast(error?.message?.includes("permissao") ? "So o dono do clube pode editar isso." : "Nao consegui salvar o sobre do clube.");
  }
}

function handleComentarSurto(id) {
  if (!state.club) {
    toast("Crie ou entre num clube pra comentar com as doramigas.");
    setState({ view: "club" });
    return;
  }
  commentDraft = id;
  setState({ view: "club" });
}

function shareClub() {
  if (!state.club) return;
  const link = inviteLink();
  const text =
    `Vem pro meu clube de doramas, o ${state.club.name}! 💜\n\n` +
    `1) Abre o app: ${link}\n` +
    `2) Cria sua conta\n` +
    `3) Vai em Doramigas → Entrar com código e usa: ${state.club.code}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

// ---------- Descobrir ----------
async function loadDiscover(force = false) {
  if (discover.loading) return;
  if (discover.loaded && !force) return;
  discover = { ...discover, loading: true, error: "" };
  render();
  try {
    const [semana, alta, top, novos] = await Promise.all([
      trendingWeek(),
      discoverDramas("popular"),
      discoverDramas("top"),
      discoverDramas("novos"),
    ]);
    discover = {
      loaded: true,
      loading: false,
      error: "",
      semana: Array.isArray(semana) ? semana : [],
      alta: Array.isArray(alta) ? alta : [],
      top: Array.isArray(top) ? top : [],
      novos: Array.isArray(novos) ? novos : [],
    };
  } catch {
    // loaded:true mesmo no erro, pra NÃO re-disparar em loop.
    discover = { ...discover, loaded: true, loading: false, error: "Não consegui carregar agora. Confira a conexão." };
  }
  render();
}

// Abre um dorama do Descobrir já no fluxo de adicionar (puxa detalhes do TMDB).
async function addFromDiscover(tmdbId) {
  setState({ view: "add" });
  search = { query: "", loading: true, results: [], selected: null, error: "" };
  render();
  try {
    const details = await getDramaDetails(Number(tmdbId));
    search = { ...search, loading: false, selected: details };
  } catch {
    search = { ...search, loading: false, error: "Não consegui abrir esse dorama." };
  }
  render();
}

// ---------- Admin ----------
async function loadAdmin(force = false) {
  if (admin.loading) return;
  if (admin.loaded && !force) return;
  admin = { ...admin, loading: true, error: "" };
  render();
  try {
    const [overview, users, clubs] = await Promise.all([
      adminOverview(),
      adminUsers(),
      adminClubs(),
    ]);
    admin = { loaded: true, loading: false, error: "", overview, users, clubs, comments: [] };
  } catch (error) {
    // loaded:true mesmo no erro, pra NÃO re-disparar em loop (era a causa do crash).
    admin = { ...admin, loaded: true, loading: false, error: error?.message || "Não consegui carregar o painel. Toque em Atualizar." };
  }
  render();
}

async function handleAdminDeleteUser(id, nome) {
  if (!(await confirmar(`Excluir “${nome}”?`, { sub: "Apaga a conta e TODOS os dados dessa pessoa. Não tem volta.", ok: "Excluir", danger: true }))) return;
  try {
    await adminDeleteUser(id);
    admin.users = admin.users.filter((u) => u.id !== id);
    if (admin.overview) admin.overview.users = Math.max(0, (admin.overview.users || 1) - 1);
    toast("Pessoa excluída.");
    render();
  } catch (error) {
    toast(error?.message || "Não consegui excluir essa pessoa.");
  }
}

async function handleAdminDeleteClub(id, nome) {
  if (!(await confirmar(`Excluir clube fantasma “${nome}”?`, { sub: "Este clube está sem membros. Some de vez.", ok: "Excluir", danger: true }))) return;
  try {
    await adminDeleteClub(id);
    admin.clubs = admin.clubs.filter((c) => c.id !== id);
    if (admin.overview) admin.overview.clubs = Math.max(0, (admin.overview.clubs || 1) - 1);
    toast("Clube fantasma excluído.");
    render();
  } catch (error) {
    toast(error?.message || "Não consegui excluir esse clube.");
  }
}

function shareWhatsApp(event) {
  const drama = state.dramas.find((item) => item.id === event.currentTarget.dataset.whatsapp);
  const frase = drama.status === "finished"
    ? `Finalizei ${drama.title} e dei ${drama.personalRating || "10"}/10. Sofri, surtei e recomendo.`
    : `Estou assistindo ${drama.title} no Dorama Club. Já estou no episódio ${drama.currentEpisode || 0}!`;
  const text = `${frase}\n\nO app é esse: ${location.origin} 💜`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

function toast(message) {
  clearTimeout(toastTimer);
  const root = document.querySelector("#toast-root") || document.body;
  root.innerHTML = `<div class="toast">${message}</div>`;
  toastTimer = setTimeout(() => {
    const currentRoot = document.querySelector("#toast-root");
    if (currentRoot) currentRoot.innerHTML = "";
  }, 2600);
}

async function hydrateFromCloud() {
  const [profile, dramas] = await Promise.all([
    loadProfile(authUser.id),
    loadDramas(authUser.id),
  ]);
  state.profile = profile;
  state.dramas = dramas;
  // Tema segue a conta: aplica o que está salvo no perfil.
  if (profile?.tema) {
    try {
      if (profile.tema === "custom" && profile.temaCustom) localStorage.setItem(TEMA_CUSTOM_KEY, profile.temaCustom);
      localStorage.setItem(TEMA_KEY, profile.tema);
      aplicarTema(profile.tema);
    } catch {
      /* ignore */
    }
  }
  // Clube (Fase B): se as migrações ainda não rodaram, falha em silêncio.
  clubMembers = [];
  try {
    const clubs = await myClubs();
    state.clubs = clubs.map(mapClubRow).filter(Boolean);
    const ativoId = state.club?.id;
    state.club = state.clubs.find((c) => c.id === ativoId) || state.clubs[0] || null;
  } catch {
    state.clubs = [];
    state.club = null;
  }
  try {
    const couple = await myCouple();
    state.couple = mapCoupleRow(couple);
  } catch {
    state.couple = null;
  }
  if (!state.couple && state.space === "couple") state.space = "solo"; // perdi o vínculo? volta pro app
  saveState();
  aplicarTemaAmbiente();
  resolveInvite();
  checarNovidadesClube().then(render);
}

async function init() {
  if (initStarted) return;
  initStarted = true;
  aplicarTema(temaAtual());
  if (supabaseReady()) {
    try {
      authUser = await getCurrentUser();
      if (authUser) await hydrateFromCloud();
    } catch {
      // Sem conexão: cai no estado local até reconectar.
    }
    unsubscribeAuth?.();
    unsubscribeAuth = onAuthChange(async (user, event) => {
      if (event === "PASSWORD_RECOVERY") {
        authUser = user;
        recovery = true;
        render();
        return;
      }
      const previousId = authUser?.id;
      authUser = user;
      authBusy = false;
      if (user && user.id !== previousId) {
        try {
          await hydrateFromCloud();
        } catch {
          // mantém estado local
        }
      }
      if (!user) state.profile = null;
      render();
    });
  }
  render();
}

init();

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

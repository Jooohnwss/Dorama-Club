import { searchDramas, getDramaDetails, getWatchProviders, getBackdrop, trendingWeek, discoverDramas, tmdbReady } from "./tmdb.js";
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
  saveTheme,
  loadDramas,
  upsertDrama,
  deleteDramaRemote,
  createClub,
  joinClub,
  myClubs,
  clubMembersList,
  leaveClub,
  clubFeed,
  clubLatestComment,
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
  clubDramas,
  clubListFeed,
  clubListAdd,
  clubListVote,
  clubListRemove,
  loadFavoritos,
  addFavorito,
  deleteFavorito,
  clubCompatibility,
  isAdminEmail,
  adminOverview,
  adminUsers,
  adminClubs,
  adminComments,
  adminDeleteComment,
  adminDeleteUser,
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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
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
let clubTab = "mural"; // aba interna da tela Doramigas
let commentDraft = null; // id do dorama pré-selecionado ao "comentar surto"
let listSort = "recente"; // ordenação da Minhas listas
let listView = "lista"; // "lista" | "grade"
let addingClub = false; // mostrar formulários de criar/entrar mesmo já tendo clube

// ---------- Tutorial / onboarding ----------
const TUTORIAL_KEY = "dorama-club-tutorial-visto";
let tutorial = null; // { step } quando aberto
let tutorialChecked = false; // garante auto-abrir só 1x por sessão (e evita loop de render)

// Passos do tutorial (slides curtos). emoji + título + corpo.
const TUTORIAL_STEPS = [
  { emoji: "💜", title: "Bem-vinda ao Dorama Club", body: "Seu cantinho pra organizar doramas, marcar seus surtos e dividir tudo com as doramigas. Vou te mostrar o básico em alguns toques — leva menos de um minuto." },
  { emoji: "➕", title: "Adicionar doramas", body: "Toque em <strong>Descobrir</strong> ou use a busca pra achar um dorama. Ao adicionar, ele entra nas suas <strong>Listas</strong> (quero ver, assistindo, terminei…)." },
  { emoji: "▶️", title: "Atualizar episódios", body: "Na sua lista, toque no número do episódio pra dizer onde parou. Dá pra somar de um em um ou colocar o número exato — sem ficar apertando o + mil vezes." },
  { emoji: "😭", title: "Registrar surtos", body: "Abrindo um dorama você marca se <strong>chorou</strong>, <strong>surtou</strong> ou <strong>passou raiva</strong>, dá sua nota e guarda o momento favorito. Tudo vira sua linha do tempo dorameira." },
  { emoji: "👯", title: "Doramigas e clube", body: "Na aba <strong>Doramigas</strong> você cria ou entra num clube pelo código, surta no mural (com trava de spoiler!), vê o dorama do mês e o quanto combinam." },
  { emoji: "🌈", title: "Humor do dia", body: "Na <strong>Início</strong>, diz como tá se sentindo e o app sugere um dorama pra esse humor. Bom dia de chorar, dia de rir, dia de raiva — tem pra tudo." },
  { emoji: "🎨", title: "Temas", body: "No <strong>Perfil</strong> você troca o tema do app. Dá até pra montar um tema com as cores do seu dorama favorito. O símbolo lá em cima muda de cor junto. 💅" },
  { emoji: "💕", title: "Em breve: Nós dois", body: "Vem aí um cantinho só do casal — diário de doramas vistos juntos, memórias e dates. Fica de olho. 😉" },
];

function tutorialVisto() {
  try { return localStorage.getItem(TUTORIAL_KEY) === "1"; } catch { return false; }
}
function marcarTutorialVisto() {
  try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch { /* ignore */ }
}
function abrirTutorial(step = 0) {
  tutorial = { step };
  render();
}
function fecharTutorial(marcar) {
  if (marcar) marcarTutorialVisto();
  tutorial = null;
  render();
}
function passoTutorial(delta) {
  if (!tutorial) return;
  const novo = tutorial.step + delta;
  if (novo < 0) return;
  if (novo >= TUTORIAL_STEPS.length) { fecharTutorial(true); return; }
  tutorial = { step: novo };
  render();
}

function tutorialTemplate() {
  if (!tutorial) return "";
  const i = Math.min(tutorial.step, TUTORIAL_STEPS.length - 1);
  const s = TUTORIAL_STEPS[i];
  const ultimo = i === TUTORIAL_STEPS.length - 1;
  return `
    <div class="modal tutorial-overlay">
      <section class="tutorial-card">
        <button class="tutorial-skip" type="button" data-tut-skip>Pular</button>
        <div class="tutorial-emoji">${s.emoji}</div>
        <h2>${s.title}</h2>
        <p>${s.body}</p>
        <div class="tutorial-dots">
          ${TUTORIAL_STEPS.map((_, n) => `<span class="${n === i ? "on" : ""}"></span>`).join("")}
        </div>
        <div class="tutorial-actions">
          ${i > 0 ? `<button class="btn ghost" type="button" data-tut-prev>Voltar</button>` : `<button class="btn ghost" type="button" data-tut-later>Ver depois</button>`}
          <button class="btn" type="button" data-tut-next>${ultimo ? "Começar 💜" : "Próximo"}</button>
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

// Troca o clube ativo (recarrega membros/feed/social do novo).
function trocarClubeAtivo(club) {
  state.club = club;
  clubMembers = [];
  clubMembersFor = null;
  clubFeedItems = [];
  clubFeedFor = null;
  clubSocial = { for: null, activities: [], picks: [], ranking: [], shared: [], reactions: [], commonDramas: [], list: [], compat: [] };
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
    const ultimo = await clubLatestComment(state.club.id);
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
let clubSocial = { for: null, activities: [], picks: [], ranking: [], shared: [], reactions: [], commonDramas: [], list: [], compat: [] };
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

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
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

function aplicarTema(id) {
  const tema = id === "custom" ? temaCorrente() : acharTema(id);
  const root = document.documentElement;
  root.dataset.tema = tema.id || id;
  for (const [chave, valor] of Object.entries(tema.variaveis)) {
    root.style.setProperty(chave, valor);
  }
  const veu = "color-mix(in srgb, var(--cor-fundo) 78%, transparent)";
  root.style.setProperty(
    "--bg-cena",
    tema.backdrop ? `linear-gradient(${veu}, ${veu}), url("${tema.backdrop}")` : "none",
  );
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

async function usarDoramaComoTema(drama) {
  toast("Montando o tema…");
  const cor = clarear(await extrairCor(drama.cover || drama.backdrop));
  const [r, g, b] = cor;
  const lum = (r * 299 + g * 587 + b * 114) / 1000;
  const corTexto = lum > 150 ? "#15101f" : "#ffffff";
  const tema = {
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
    return merged;
  } catch {
    return cloneDefaults();
  }
}

function saveState() {
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

  // Abre o tutorial automaticamente na primeira vez (só uma vez por sessão).
  if (!tutorialChecked) {
    tutorialChecked = true;
    if (!tutorialVisto()) tutorial = { step: 0 };
  }

  app().innerHTML = `
    <div class="app shell">
      ${sidebarTemplate()}
      <main class="main">
        ${viewTemplate()}
      </main>
      ${modal ? modalTemplate() : ""}
      ${uiModalTemplate()}
      ${tutorialTemplate()}
      <div id="toast-root"></div>
    </div>
  `;
  bindShell();
  if (modal) bindModal();
  bindUiModal();
  bindTutorial();
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

function adminTemplate() {
  if (admin.loading && !admin.loaded) return `<div class="section-title"><h2>Admin</h2></div><div class="empty">Carregando painel…</div>`;
  if (admin.error) return `<div class="section-title"><h2>Admin</h2></div><div class="empty">${esc(admin.error)}</div>`;

  const o = admin.overview || {};
  const overviewStats = [
    ["Usuárias", o.users ?? 0],
    ["Doramas", o.dramas ?? 0],
    ["Clubes", o.clubs ?? 0],
    ["Comentários", o.comments ?? 0],
  ];

  return `
    <div class="section-title">
      <h2>Administradores</h2>
      <button class="btn ghost" data-admin-refresh>Atualizar</button>
    </div>
    <section class="grid stats">
      ${overviewStats.map(([label, value]) => `<div class="stat"><span class="muted">${label}</span><strong>${value}</strong></div>`).join("")}
    </section>

    <div class="section-title"><h2>Usuárias (${admin.users.length})</h2></div>
    <section class="grid cards">
      ${admin.users.length
        ? admin.users.map((u) => `<div class="card"><strong>${esc(u.name || "(sem nome)")}</strong><p class="muted">${esc(u.email || "")}</p><div class="chips">${u.nickname ? `<span class="chip">${esc(u.nickname)}</span>` : ""}<span class="chip">${u.dramas || 0} doramas</span>${u.invited_by_name ? `<span class="chip">👋 por ${esc(u.invited_by_name)}</span>` : ""}${u.invites ? `<span class="chip">convidou ${u.invites}</span>` : ""}</div><div class="mini-actions"><button data-admin-del-user="${u.id}" data-admin-user-name="${esc(u.name || u.email || "")}">${icon("trash")} Excluir</button></div></div>`).join("")
        : `<div class="empty">Nenhuma usuária ainda.</div>`}
    </section>

    <div class="section-title"><h2>Clubes (${admin.clubs.length})</h2></div>
    <section class="grid cards">
      ${admin.clubs.length
        ? admin.clubs.map((c) => `<div class="card"><strong>${esc(c.name)}</strong><p class="muted">${esc(c.code)}</p><div class="chips"><span class="chip">${c.members || 0} membros</span></div></div>`).join("")
        : `<div class="empty">Nenhum clube criado ainda.</div>`}
    </section>

    <div class="section-title"><h2>Comentários (${admin.comments.length})</h2></div>
    <section class="grid">
      ${admin.comments.length
        ? admin.comments.map((c) => `<div class="card"><strong>${esc(c.author || "")}</strong><p class="muted">${esc(c.club || "")}${c.spoiler_episode ? ` · spoiler ep. ${c.spoiler_episode}` : ""}</p><p>${esc(c.body)}</p><div class="mini-actions"><button data-admin-del-comment="${c.id}">Apagar</button></div></div>`).join("")
        : `<div class="empty">Nenhum comentário ainda.</div>`}
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
  ctx.fillText(opts.certificado ? "🎓 Certificado de conclusão" : "💜 Dorama Club", W / 2, 100);

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
  ctx.fillText(opts.certificado ? "Finalizei com sucesso" : drama ? "Continuo assistindo" : "Minha vida dorameira", W / 2, y);

  y += 64;
  ctx.fillStyle = "#ffffff";
  ctx.font = '800 56px Inter, system-ui, sans-serif';
  const linhas = drama ? wrapText(ctx, drama.title, W / 2, y, W - 140, 62) : 0;
  y += (linhas ? (linhas - 1) * 62 : 0) + 56;

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

  if (opts.certificado) {
    ctx.fillStyle = "#ffffff";
    ctx.font = '800 34px Inter, system-ui, sans-serif';
    wrapText(ctx, opts.frase || "Mais um trauma concluído com sucesso. 🎓", W / 2, y + 16, W - 140, 42);
  }

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = '700 30px Inter, system-ui, sans-serif';
  ctx.fillText(`— ${state.profile?.name || "dorameira"}`, W / 2, H - 60);

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
  if (!m || !state.club) return;
  registrarAtividade(`${state.profile?.name || "Alguém"} está no clima de "${m.label}" hoje ${m.emoji}`);
  toast("Contado pras doramigas! 💜");
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
  const mood = moods.find((item) => item.tag === tag);
  if (mood && state.club) registrarAtividade(`${state.profile?.name || "Alguém"} está no clima: ${mood.emoji} ${mood.label}`);
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
      <h2>Qual dorama você quer adicionar?</h2>
    </div>
    <section class="form-card">
      <form id="search-form" class="search-bar">
        <input id="search" name="search" placeholder="Rainha das Lágrimas" value="${esc(search.query)}" autocomplete="off" required />
        <button class="btn" type="submit">Buscar</button>
      </form>
      ${search.loading ? `<p class="muted">Buscando no TMDB…</p>` : ""}
      ${search.error ? `<p class="muted">${esc(search.error)}</p>` : ""}
      ${searchResultsTemplate()}
    </section>
    ${search.selected ? placeFormTemplate(search.selected) : ""}
  `;
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
            <small>${drama.year || "—"}${drama.rating ? ` · nota ${drama.rating}` : ""}</small>
          </span>
        </button>`,
        )
        .join("")}
    </div>
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
          <p class="muted">${drama.year || "—"} · ${drama.episodes || "?"} episódios${drama.rating ? ` · nota ${drama.rating}` : ""}</p>
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

function clubTemplate() {
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

function doramasEmComumTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando…</div>`;
  const total = clubMembers.length || 1;
  const dados = clubSocial.commonDramas;
  if (!dados.length) return `<div class="empty">Quando as doramigas adicionarem doramas, eles aparecem aqui agrupados.</div>`;
  const grupos = {
    "Todo mundo já viu": dados.filter((d) => Number(d.finished) >= total && total > 1),
    "Todo mundo quer ver": dados.filter((d) => Number(d.wishlist) >= total && total > 1),
    "Melhor pra ver juntas": dados.filter((d) => Number(d.wishlist) >= 2 && Number(d.finished) === 0),
    "Só uma viu": dados.filter((d) => Number(d.membros) === 1 && Number(d.finished) >= 1),
  };
  const blocos = Object.entries(grupos)
    .filter(([, lista]) => lista.length)
    .map(
      ([titulo, lista]) =>
        `<div class="card"><span class="muted">${titulo}</span>${lista.map((d) => `<strong style="font-weight:600">${esc(d.title)}</strong>`).join("")}</div>`,
    )
    .join("");
  return blocos ? `<section class="grid cards">${blocos}</section>` : `<div class="empty">Ainda sem doramas em comum o bastante. Adicionem mais! ✨</div>`;
}

const LISTA_VOTOS = ["Quero muito", "Tanto faz", "Já vi, mas vejo de novo", "Não tenho psicológico", "Não me chama pra sofrer"];

function listaCompartilhadaTemplate() {
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
  if (!clubSocial.activities.length) return `<div class="empty">Sem novidades ainda. Adicione ou termine um dorama pra movimentar o clube! ✨</div>`;
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

function diarioCompartilhadoTemplate() {
  if (clubSocial.for !== state.club.id) return `<div class="empty">Carregando…</div>`;
  if (!clubSocial.shared.length) return `<div class="empty">Nenhum surto compartilhado ainda. No diário de um dorama, marque "compartilhar com doramigas". 💜</div>`;
  return `<section class="grid">${clubSocial.shared
    .map((s) => {
      const item = { spoiler_episode: s.episode, tmdb_id: s.tmdb_id, user_id: s.user_id };
      const liberado = podeVerComentario(item);
      const corpo = liberado
        ? `<p>${esc(s.body)}</p>`
        : `<p class="muted spoiler-lock">🔒 Spoiler! Chegue no ep. ${s.episode}${s.drama_title ? ` de ${esc(s.drama_title)}` : ""} pra ver.</p>`;
      return `<div class="card comment-card"><div class="comment-head"><strong>${esc(s.author)}</strong><span class="muted">${timeAgo(s.created_at)}</span></div>${s.drama_title ? `<span class="chip">${esc(s.drama_title)} · ep. ${s.episode}</span>` : ""}${corpo}</div>`;
    })
    .join("")}</section>`;
}

function commentFormTemplate() {
  const meusDramas = state.dramas.filter((d) => d.tmdbId);
  return `
    <section class="form-card">
      <form id="comment-form" class="form-grid">
        <div class="field full">
          <label for="commentBody">Conta o surto pras doramigas</label>
          <textarea id="commentBody" name="body" placeholder="Gente, o episódio de hoje…" required></textarea>
          <div class="frases">${FRASES_DORAMEIRA.map((f) => `<button type="button" class="frase" data-frase="${esc(f)}">${esc(f)}</button>`).join("")}</div>
        </div>
        <div class="field">
          <label for="commentDrama">Sobre qual dorama?</label>
          <select id="commentDrama" name="dramaId">
            <option value="">Geral (sem dorama)</option>
            ${meusDramas.map((d) => `<option value="${d.id}" ${commentDraft === d.id ? "selected" : ""}>${esc(d.title)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="commentSpoiler">Spoiler até o episódio</label>
          <input id="commentSpoiler" name="spoiler" type="number" min="0" value="0" />
          <span class="muted" style="font-size:.74rem">0 = sem spoiler</span>
        </div>
        <div class="actions field full">
          <button class="btn" type="submit">Publicar no mural</button>
        </div>
      </form>
    </section>
  `;
}

// Decide se quem está lendo pode ver o comentário (trava de spoiler).
function podeVerComentario(item) {
  if (!item.spoiler_episode) return true;
  if (authUser && item.user_id === authUser.id) return true;
  const meu = state.dramas.find((d) => d.tmdbId && item.tmdb_id && d.tmdbId === item.tmdb_id);
  return Boolean(meu && Number(meu.currentEpisode || 0) >= item.spoiler_episode);
}

function clubFeedTemplate() {
  if (clubFeedFor !== state.club.id) return `<div class="empty">Carregando o mural…</div>`;
  if (!clubFeedItems.length) return `<div class="empty">Ninguém surtou ainda. Seja a primeira! 💜</div>`;
  return `
    <section class="grid">
      ${clubFeedItems
        .map((item) => {
          const liberado = podeVerComentario(item);
          const podeApagar = authUser && (item.user_id === authUser.id || isAdmin());
          const corpo = liberado
            ? `<p>${esc(item.body)}</p>`
            : `<p class="muted spoiler-lock">🔒 Cuidado, spoiler! Você precisa chegar no episódio ${item.spoiler_episode}${item.drama_title ? ` de ${esc(item.drama_title)}` : ""} pra ver esse surto.</p>`;
          return `
        <div class="card comment-card">
          <div class="comment-head">
            <strong>${esc(item.author || "(sem nome)")}</strong>
            <span class="muted">${timeAgo(item.created_at)}</span>
          </div>
          ${item.drama_title ? `<span class="chip">${esc(item.drama_title)}${item.spoiler_episode ? ` · spoiler ep. ${item.spoiler_episode}` : ""}</span>` : ""}
          ${corpo}
          ${barraReacoes(item.id)}
          ${podeApagar ? `<div class="mini-actions"><button data-del-comment="${item.id}">${icon("trash")} Apagar</button></div>` : ""}
        </div>`;
        })
        .join("")}
    </section>
  `;
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
    <div class="section-title"><h2>🔗 Convidar amigas</h2></div>
    <section class="form-card">
      <p class="muted" style="margin:0 0 10px">Seu código de convite: <strong style="color:var(--cor-texto)">${esc(profile.inviteCode || "—")}</strong>. Cada amiga que entrar pelo seu link fica registrada como convidada por você.</p>
      <div class="actions" style="margin:0">
        <button class="btn" type="button" data-invite-share>${icon("share")} Convidar no WhatsApp</button>
        <button class="btn ghost" type="button" data-invite-copy>Copiar link</button>
      </div>
    </section>
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
      <label for="since">Dorameira desde</label>
      <input id="since" name="since" type="number" min="1950" max="2026" value="${profile.since || "2018"}" />
    </div>
    <div class="field full">
      <label for="type">Tipo de dorameira</label>
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
  await signOut();
  authUser = null;
  state.profile = null;
  state.dramas = [];
  state.club = null;
  state.clubs = [];
  state.view = "home";
  addingClub = false;
  moodResult = null;
  clubMembers = [];
  clubMembersFor = null;
  clubFeedItems = [];
  clubFeedFor = null;
  clubSocial = { for: null, activities: [], picks: [], ranking: [], shared: [], reactions: [], commonDramas: [], list: [], compat: [] };
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

  document.querySelectorAll("[data-admin-del-comment]").forEach((button) => {
    listen(button, "click", () => handleAdminDeleteComment(button.dataset.adminDelComment));
  });

  document.querySelectorAll("[data-admin-del-user]").forEach((button) => {
    listen(button, "click", () => handleAdminDeleteUser(button.dataset.adminDelUser, button.dataset.adminUserName));
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
  listen(document.querySelector("[data-invite-share]"), "click", shareInvite);
  listen(document.querySelector("[data-invite-copy]"), "click", copyInvite);
  listen(document.querySelector("[data-admin-refresh]"), "click", () => loadAdmin(true));
  listen(document.querySelector("#search-form"), "submit", runSearch);
  listen(document.querySelector("#add-form"), "submit", addDrama);
  listen(document.querySelector("#profile-form"), "submit", saveProfile);
  listen(document.querySelector("#create-club-form"), "submit", handleCreateClub);
  listen(document.querySelector("#join-club-form"), "submit", handleJoinClub);
  listen(document.querySelector("#comment-form"), "submit", handlePostComment);
  document.querySelectorAll("[data-del-comment]").forEach((button) => {
    listen(button, "click", () => handleDeleteComment(button.dataset.delComment));
  });
  document.querySelectorAll("[data-react]").forEach((button) => {
    listen(button, "click", () => handleToggleReaction(button.dataset.react, button.dataset.emoji));
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
    const id = new FormData(e.currentTarget).get("dramaId");
    if (id) handleListAdd(id);
  });
  document.querySelectorAll("[data-list-vote]").forEach((button) => {
    listen(button, "click", () => handleListVote(button.dataset.listVote, button.dataset.vote));
  });
  document.querySelectorAll("[data-list-remove]").forEach((button) => {
    listen(button, "click", () => handleListRemove(button.dataset.listRemove));
  });
  listen(document.querySelector("#pick-form"), "submit", (e) => {
    e.preventDefault();
    const dramaId = new FormData(e.currentTarget).get("dramaId");
    if (dramaId) handlePickMonth(dramaId);
  });
  listen(document.querySelector("#casal-form"), "submit", handleAddCasal);
  document.querySelectorAll("[data-del-casal]").forEach((button) => {
    listen(button, "click", () => handleDeleteCasal(button.dataset.delCasal));
  });
  listen(document.querySelector("#favorito-form"), "submit", handleAddFavorito);
  document.querySelectorAll("[data-del-favorito]").forEach((button) => {
    listen(button, "click", () => handleDeleteFavorito(button.dataset.delFavorito));
  });
  listen(document.querySelector("#change-pass-form"), "submit", handleChangePassword);
  listen(document.querySelector("[data-open-tutorial]"), "click", () => abrirTutorial(0));
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
  search = { ...search, query, loading: true, error: "", results: [], selected: null };
  render();
  try {
    const results = await searchDramas(query);
    search = { ...search, loading: false, results, error: results.length ? "" : "Nada encontrado. Tente outro nome." };
  } catch {
    search = { ...search, loading: false, error: "Não consegui buscar agora. Confira a conexão e tente de novo." };
  }
  render();
}

async function pickResult(tmdbId) {
  const brief = search.results.find((drama) => drama.tmdbId === tmdbId);
  search = { ...search, selected: brief };
  render();
  try {
    const details = await getDramaDetails(tmdbId);
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
  toast(`Bem-vinda, ${data.name}.`);
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
  syncDrama(drama);
  registrarAtividade(`${state.profile?.name || "Alguém"} ${drama.status === "watching" ? "começou" : "adicionou"} ${drama.title}${drama.status === "watching" ? "" : ` em ${statusLabel(drama.status)}`}.`);
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
    registrarAtividade(`${state.profile?.name || "Alguém"} terminou ${updated.title} — ${fraseFim()}`);
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
  if (novo === "finished") registrarAtividade(`${state.profile?.name || "Alguém"} terminou ${updated.title} — ${fraseFim()}`);
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
  clubSocial = { ...clubSocial, for: state.club.id };
  const empty = { for: state.club.id, activities: [], picks: [], ranking: [], shared: [], reactions: [], commonDramas: [], list: [], compat: [] };
  try {
    const [activities, picks, ranking, shared, reactions, commonDramas, list, compat] = await Promise.all([
      clubActivities(state.club.id),
      clubPicksTally(state.club.id),
      clubRanking(state.club.id),
      clubSharedSurtos(state.club.id),
      clubReactions(state.club.id),
      clubDramas(state.club.id),
      clubListFeed(state.club.id),
      clubCompatibility(state.club.id),
    ]);
    clubSocial = { for: state.club.id, activities, picks, ranking, shared, reactions, commonDramas, list, compat };
  } catch {
    clubSocial = empty;
  }
  render();
}

// Registra uma atividade no feed do clube (silencioso; só se logado e num clube).
function registrarAtividade(text) {
  if (!cloudOn() || !state.club) return;
  logActivity(authUser.id, state.club.id, text).catch(() => {});
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

async function handleListAdd(dramaId) {
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

async function handleListVote(listId, vote) {
  try {
    await clubListVote(listId, vote);
    clubSocial.list = await clubListFeed(state.club.id);
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
    render();
    toast("Removido da lista.");
  } catch {
    toast("Não consegui remover.");
  }
}

async function handlePostComment(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const body = String(data.body || "").trim();
  if (!body || !state.club) return;
  let tmdbId = null;
  let dramaTitle = null;
  let spoilerEpisode = 0;
  if (data.dramaId) {
    const drama = state.dramas.find((d) => d.id === data.dramaId);
    if (drama) {
      tmdbId = drama.tmdbId ?? null;
      dramaTitle = drama.title;
      spoilerEpisode = Number(data.spoiler) || 0;
    }
  }
  try {
    await postComment(authUser.id, state.club.id, { body, tmdbId, dramaTitle, spoilerEpisode });
    commentDraft = null;
    clubFeedFor = null;
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
    const c = { id: club.id, name: club.name, code: club.code };
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
    const c = { id: club.id, name: club.name, code: club.code };
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
  if (!(await confirmar(`Sair de “${state.club.name}”?`, { ok: "Sair", danger: true }))) return;
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
    const [overview, users, clubs, comments] = await Promise.all([
      adminOverview(),
      adminUsers(),
      adminClubs(),
      adminComments(),
    ]);
    admin = { loaded: true, loading: false, error: "", overview, users, clubs, comments };
  } catch (error) {
    // loaded:true mesmo no erro, pra NÃO re-disparar em loop (era a causa do crash).
    admin = { ...admin, loaded: true, loading: false, error: error?.message || "Não consegui carregar o painel. Toque em Atualizar." };
  }
  render();
}

async function handleAdminDeleteComment(id) {
  try {
    await adminDeleteComment(id);
    admin.comments = admin.comments.filter((comment) => comment.id !== id);
    toast("Comentário apagado.");
    render();
  } catch {
    toast("Não consegui apagar o comentário.");
  }
}

async function handleAdminDeleteUser(id, nome) {
  if (!(await confirmar(`Excluir “${nome}”?`, { sub: "Apaga a conta e TODOS os dados dela. Não tem volta.", ok: "Excluir", danger: true }))) return;
  try {
    await adminDeleteUser(id);
    admin.users = admin.users.filter((u) => u.id !== id);
    if (admin.overview) admin.overview.users = Math.max(0, (admin.overview.users || 1) - 1);
    toast("Usuária excluída.");
    render();
  } catch (error) {
    toast(error?.message || "Não consegui excluir essa usuária.");
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
    state.clubs = clubs.map((c) => ({ id: c.id, name: c.name, code: c.code }));
    const ativoId = state.club?.id;
    state.club = state.clubs.find((c) => c.id === ativoId) || state.clubs[0] || null;
  } catch {
    state.clubs = [];
    state.club = null;
  }
  saveState();
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

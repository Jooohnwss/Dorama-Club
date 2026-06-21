import { searchDramas, getDramaDetails, getWatchProviders, trendingWeek, discoverDramas, tmdbReady } from "./tmdb.js";
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
  loadDramas,
  upsertDrama,
  deleteDramaRemote,
  createClub,
  joinClub,
  myClubs,
  clubMembersList,
  leaveClub,
  clubFeed,
  postComment,
  deleteOwnComment,
  loadSurtos,
  addSurto,
  deleteSurto,
  loadCasais,
  addCasal,
  deleteCasal,
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
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='120' height='180' fill='%23ffe2ef'/><text x='60' y='95' font-size='40' text-anchor='middle' fill='%23df4f94'>DC</text></svg>`,
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
};

let state = loadState();
let modal = null;
let toastTimer = null;
// Estado transitório da busca (não persiste no localStorage).
let search = { query: "", loading: false, results: [], selected: null, error: "" };
// Auth (preenchido em tempo de execução quando o Supabase está configurado).
let authUser = null;
let authMode = "signin"; // "signin" | "signup"
let authBusy = false;
let renderEvents = null;
let initStarted = false;
let unsubscribeAuth = null;
// Membros do clube atual (carregados sob demanda).
let clubMembers = [];
let clubMembersFor = null; // id do clube cujos membros já buscamos (evita loop)
let clubFeedItems = [];
let clubFeedFor = null; // id do clube cujo feed já buscamos (evita loop)
// "Onde assistir" do dorama aberto no modal: null = carregando, [] = nada.
let detailProviders = null;
// Diário de surtos do dorama aberto no modal: null = carregando, [] = vazio.
let detailSurtos = null;
// Casais (aba Perfil), carregados sob demanda.
let casais = [];
let casaisFor = null;
const casalCategorias = [
  "Casal favorito",
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

// ---------- Temas ----------
const TEMA_KEY = "dorama-club-tema";

function aplicarTema(id) {
  const tema = acharTema(id);
  const root = document.documentElement;
  root.dataset.tema = tema.id;
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

  app().innerHTML = `
    <div class="app shell">
      ${sidebarTemplate()}
      <main class="main">
        ${viewTemplate()}
      </main>
      ${modal ? modalTemplate() : ""}
      <div id="toast-root"></div>
    </div>
  `;
  bindShell();
  if (modal) bindModal();
}

function authTemplate() {
  const signup = authMode === "signup";
  return `
    <main class="welcome">
      <section class="welcome-card">
        <div class="logo">DC</div>
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
          <div class="actions field full">
            <button class="btn" type="submit" ${authBusy ? "disabled" : ""}>${authBusy ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}</button>
          </div>
        </form>
      </section>
    </main>
  `;
}

function profileSetupTemplate() {
  return `
    <main class="welcome">
      <section class="welcome-card">
        <div class="logo">DC</div>
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
        <div class="logo">DC</div>
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
        <div class="logo">DC</div>
        <div>
          <h1>Dorama Club</h1>
          <p>watchlist, surtos e doramigas</p>
        </div>
      </div>
      <nav class="nav">
        ${items.map(([key, label, ic]) => `<button class="${state.view === key ? "active" : ""}" data-view="${key}">${icon(ic)}<span class="nav-label">${label}</span></button>`).join("")}
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
        ? admin.users.map((u) => `<div class="card"><strong>${esc(u.name || "(sem nome)")}</strong><p class="muted">${esc(u.email || "")}</p><div class="chips">${u.nickname ? `<span class="chip">${esc(u.nickname)}</span>` : ""}<span class="chip">${u.dramas || 0} doramas</span>${u.since ? `<span class="chip">desde ${u.since}</span>` : ""}</div><div class="mini-actions"><button data-admin-del-user="${u.id}" data-admin-user-name="${esc(u.name || u.email || "")}">${icon("trash")} Excluir</button></div></div>`).join("")
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

function homeTemplate() {
  const profile = state.profile;
  const stats = [
    ["Assistindo", byStatus("watching").length],
    ["Watchlist", byStatus("wishlist").length],
    ["Finalizados", byStatus("finished").length],
    ["Favoritos", byStatus("favorites").length],
    ["Desde", profile.since || "Hoje"],
  ];

  const statusIcons = { watching: "play", wishlist: "add", finished: "heart", paused: "detail", dropped: "trash", favorites: "heart", comfort: "heart" };

  return `
    <section class="hero">
      <div class="hero-top">
        <img class="hero-avatar" src="${esc(avatarUrl(profile))}" alt="" />
        <p class="kicker">Oi, ${esc(profile.name)} ${acharTema(temaAtual()).marca.emoji}</p>
      </div>
      <h2>Qual vai ser o surto de hoje?</h2>
      <div class="actions">
        <button class="btn secondary" data-view="add">${icon("add")} Adicionar dorama</button>
        <button class="btn secondary" data-random>${icon("dice")} Sortear próximo</button>
      </div>
    </section>
    <section class="grid stats">
      ${stats.map(([label, value]) => `<div class="stat"><span class="muted">${label}</span><strong>${value}</strong></div>`).join("")}
    </section>
    <div class="section-title">
      <h2>Meu humor hoje</h2>
    </div>
    <div class="mood-row">
      ${moods.map((mood) => `<button data-mood="${esc(mood.tag)}">${mood.emoji} ${esc(mood.label)}</button>`).join("")}
    </div>
    <div class="section-title">
      <h2>Atalhos</h2>
    </div>
    <section class="grid cards">
      ${statuses
        .slice(0, 6)
        .map((status) => `<button class="card" data-list="${status.key}"><span class="card-ico">${icon(statusIcons[status.key] || "lists")}</span><strong>${status.label}</strong><span class="muted">${byStatus(status.key).length} doramas</span></button>`)
        .join("")}
      <button class="card" data-view="club"><span class="card-ico">${icon("club")}</span><strong>${state.club ? esc(state.club.name) : "Clube das Doramigas"}</strong><span class="muted">${state.club ? esc(state.club.code) : "Criar ou entrar"}</span></button>
      <button class="card" data-view="add"><span class="card-ico">${icon("add")}</span><strong>Adicionar dorama</strong><span class="muted">Buscar no TMDB</span></button>
    </section>
    <div class="section-title">
      <h2>${icon("play")} Assistindo agora</h2>
    </div>
    ${dramaGrid(byStatus("watching"))}
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
  toast(`Hoje combina com: ${escolha.title} 💜`);
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

function listsTemplate() {
  return `
    <div class="section-title">
      <h2>Minhas listas</h2>
      <button class="btn ghost" data-view="add">+ Adicionar</button>
    </div>
    <div class="tabs">
      ${statuses.map((status) => `<button class="${state.activeList === status.key ? "active" : ""}" data-active-list="${status.key}">${status.label}</button>`).join("")}
    </div>
    ${dramaGrid(byStatus(state.activeList))}
  `;
}

function clubTemplate() {
  if (!state.club) {
    return `
      <div class="section-title"><h2>Clube das Doramigas</h2></div>
      <section class="form-card">
        <p class="muted">Você ainda não está em um clube. Crie o seu e convide suas doramigas pelo código — ou entre em um clube com o código que te passaram.</p>
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

  return `
    <div class="section-title">
      <h2>${esc(state.club.name)}</h2>
      <button class="btn ghost" data-copy-code>Copiar código</button>
    </div>
    <section class="grid cards">
      <div class="card"><span class="muted">Código do clube</span><strong>${esc(state.club.code)}</strong></div>
      <div class="card"><span class="muted">Membros</span><strong>${clubMembers.length || "…"}</strong></div>
    </section>
    <div class="section-title"><h2>Doramigas no clube</h2></div>
    <section class="grid cards">
      ${clubMembers.length
        ? clubMembers.map((member) => `<div class="card"><strong>${esc(member.name || "(sem nome)")}</strong>${member.nickname ? `<p class="muted">${esc(member.nickname)}</p>` : ""}</div>`).join("")
        : `<div class="empty">Carregando membros…</div>`}
    </section>
    <div class="section-title"><h2>Convidar e gerenciar</h2></div>
    <section class="grid cards">
      <button class="card" data-share-club><strong>Chamar doramiga no WhatsApp</strong><p class="muted">Envia o código ${esc(state.club.code)}</p></button>
      <button class="card" data-leave-club><strong>Sair do clube</strong><p class="muted">Você deixa de ver este clube</p></button>
    </section>
    <div class="section-title"><h2>Mural das doramigas</h2></div>
    ${commentFormTemplate()}
    ${clubFeedTemplate()}
  `;
}

function commentFormTemplate() {
  const meusDramas = state.dramas.filter((d) => d.tmdbId);
  return `
    <section class="form-card">
      <form id="comment-form" class="form-grid">
        <div class="field full">
          <label for="commentBody">Conta o surto pras doramigas</label>
          <textarea id="commentBody" name="body" placeholder="Gente, o episódio de hoje…" required></textarea>
        </div>
        <div class="field">
          <label for="commentDrama">Sobre qual dorama?</label>
          <select id="commentDrama" name="dramaId">
            <option value="">Geral (sem dorama)</option>
            ${meusDramas.map((d) => `<option value="${d.id}">${esc(d.title)}</option>`).join("")}
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
      </div>
    </div>
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
    <div class="section-title"><h2>💞 Casais que eu shippo</h2></div>
    ${casaisTemplate()}
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

function funnyStats() {
  const episodes = state.dramas.reduce((sum, d) => sum + Number(d.currentEpisode || 0), 0);
  const choros = state.dramas.filter((d) => Number(d.cry) > 0).length;
  const drops = byStatus("dropped").length;
  const since = state.profile?.since;
  const linhas = [
    `Você já assistiu <strong>${episodes}</strong> episódios.`,
    `Você chorou oficialmente em <strong>${choros}</strong> ${choros === 1 ? "dorama" : "doramas"}.`,
    `Seu gênero mais assistido é <strong>${favoriteGenre()}</strong>.`,
  ];
  if (drops) linhas.push(`Você dropou <strong>${drops}</strong> ${drops === 1 ? "dorama" : "doramas"} sem dó.`);
  if (since) linhas.push(`Sua vida dorameira começou em <strong>${esc(since)}</strong>.`);
  return linhas;
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
  return categorias
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
    .join("");
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
  render();
  const drama = state.dramas.find((item) => item.id === id);

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
  const meta = drama.status === "wishlist"
    ? `${drama.year || "—"} · ${esc(drama.priority || "Quero assistir")}`
    : `${drama.year || "—"} · ${statusLabel(drama.status)} · Ep. ${ep}/${total || "?"}`;

  const moodChips = [
    Number(drama.cry) > 0 ? `<span class="chip choro">😭 ${drama.cry}</span>` : "",
    Number(drama.hype) > 0 ? `<span class="chip surto">🔥 ${drama.hype}</span>` : "",
    Number(drama.rage) > 0 ? `<span class="chip raiva">😡 ${drama.rage}</span>` : "",
    drama.personalRating ? `<span class="chip">⭐ ${esc(drama.personalRating)}</span>` : "",
  ].join("");

  return `
    <article class="drama-card">
      <img class="poster" src="${esc(drama.cover || POSTER_PLACEHOLDER)}" alt="Capa de ${esc(drama.title)}" loading="lazy" decoding="async" />
      <div>
        <h3>${esc(drama.title)}</h3>
        <p class="meta">${meta}</p>
        ${showProgress ? `<div class="progress"><span style="width:${pct}%"></span></div>` : ""}
        <div class="chips">
          ${(drama.genres || []).slice(0, 2).map((genre) => `<span class="chip">${esc(genre)}</span>`).join("")}
          ${drama.favorite ? `<span class="chip fav">${icon("heart")} Favorito</span>` : ""}
          ${drama.comfort ? `<span class="chip">🧸 Conforto</span>` : ""}
          ${drama.semaforo ? `<span class="chip">${semaforoEmoji(drama.semaforo)}</span>` : ""}
          ${drama.status === "paused" && drama.pauseReason ? `<span class="chip">⏸️ ${esc(drama.pauseReason)}</span>` : ""}
          ${drama.status === "dropped" && drama.dropReason ? `<span class="chip">🚫 ${esc(drama.dropReason)}</span>` : ""}
          ${moodChips}
        </div>
        <div class="mini-actions">
          ${drama.status === "watching" ? `<button data-plus-one="${drama.id}">${icon("add")} +1 ep</button>` : ""}
          <button data-detail="${drama.id}">${icon("detail")} Detalhes</button>
          <button data-toggle-favorite="${drama.id}">${icon("heart")} ${drama.favorite ? "Tirar" : "Favoritar"}</button>
        </div>
      </div>
    </article>
  `;
}

function modalTemplate() {
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
              <button class="btn secondary" type="button" data-whatsapp="${drama.id}">Compartilhar no WhatsApp</button>
              <button class="btn danger" type="button" data-remove="${drama.id}">${icon("trash")} Remover</button>
            </div>
          </form>
        </div>
        ${diaryTemplate(drama)}
      </section>
    </div>
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
  state.view = "home";
  clubMembers = [];
  clubMembersFor = null;
  clubFeedItems = [];
  clubFeedFor = null;
  casais = [];
  casaisFor = null;
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

function removeDrama(id) {
  const drama = state.dramas.find((item) => item.id === id);
  if (!drama) return;
  if (!window.confirm(`Remover “${drama.title}” das suas listas?`)) return;
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

  document.querySelectorAll("[data-plus-one]").forEach((button) => {
    listen(button, "click", () => incrementEpisode(button.dataset.plusOne));
  });

  document.querySelectorAll("[data-detail]").forEach((button) => {
    listen(button, "click", () => openDetail(button.dataset.detail));
  });

  document.querySelectorAll("[data-toggle-favorite]").forEach((button) => {
    listen(button, "click", () => toggleField(button.dataset.toggleFavorite, "favorite"));
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

  document.querySelectorAll("[data-discover]").forEach((button) => {
    listen(button, "click", () => addFromDiscover(button.dataset.discover));
  });
  listen(document.querySelector("[data-discover-refresh]"), "click", () => loadDiscover(true));

  document.querySelectorAll("[data-tema]").forEach((button) => {
    listen(button, "click", () => salvarTema(button.dataset.tema));
  });

  listen(document.querySelector("[data-random]"), "click", randomDrama);
  listen(document.querySelector("[data-copy-code]"), "click", copyClubCode);
  listen(document.querySelector("[data-logout]"), "click", handleLogout);
  listen(document.querySelector("[data-share-club]"), "click", shareClub);
  listen(document.querySelector("[data-leave-club]"), "click", handleLeaveClub);
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
  listen(document.querySelector("#casal-form"), "submit", handleAddCasal);
  document.querySelectorAll("[data-del-casal]").forEach((button) => {
    listen(button, "click", () => handleDeleteCasal(button.dataset.delCasal));
  });
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
  if (state.view === "club" && state.club && clubMembersFor !== state.club.id) loadClubMembers();
  if (state.view === "club" && state.club && clubFeedFor !== state.club.id) loadClubFeed();
  if (state.view === "profile" && casaisFor !== (authUser?.id || "_")) loadCasaisData();
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
  listen(document.querySelector("[data-whatsapp]"), "click", shareWhatsApp);
  listen(document.querySelector("[data-remove]"), "click", () => removeDrama(modal.id));
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
    } catch {
      toast("Não consegui salvar o perfil na nuvem. Tente de novo.");
      return;
    }
  }
  modal = null;
  setState({ profile: data, view: "home" });
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

function incrementEpisode(id) {
  let justFinished = false;
  let updated = null;
  const dramas = state.dramas.map((drama) => {
    if (drama.id !== id) return drama;
    const currentEpisode = Math.min(Number(drama.currentEpisode || 0) + 1, drama.episodes);
    const reachedEnd = currentEpisode >= drama.episodes && drama.status !== "finished";
    if (reachedEnd) justFinished = true;
    updated = { ...drama, currentEpisode, status: reachedEnd ? "finished" : drama.status };
    return updated;
  });
  state.dramas = dramas;
  saveState();
  if (updated) syncDrama(updated);
  if (justFinished) {
    // Spec seção 7: ao terminar, abrir avaliação (nota, choro, surto, raiva, recomenda).
    modal = { type: "detail", id };
    render();
    toast("Terminou! Conta como foi: nota, choro, surto e raiva.");
  } else {
    render();
    toast("+1 episódio registrado.");
  }
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
    clubFeedFor = null;
    loadClubFeed();
    toast("Publicado no mural! 💜");
  } catch {
    toast("Não consegui publicar agora.");
  }
}

async function handleDeleteComment(id) {
  if (!window.confirm("Apagar este comentário?")) return;
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
    state.club = { id: club.id, name: club.name, code: club.code };
    clubMembers = [];
    setState({ club: state.club });
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
    state.club = { id: club.id, name: club.name, code: club.code };
    clubMembers = [];
    setState({ club: state.club });
    loadClubMembers();
    toast(`Você entrou em ${club.name}.`);
  } catch (error) {
    toast(error?.message?.includes("não encontrado") ? "Código não encontrado." : "Não consegui entrar no clube.");
  }
}

async function handleLeaveClub() {
  if (!state.club) return;
  try {
    await leaveClub(state.club.id);
    clubMembers = [];
    clubFeedItems = [];
    clubFeedFor = null;
    setState({ club: null });
    toast("Você saiu do clube.");
  } catch {
    toast("Não consegui sair do clube agora.");
  }
}

function shareClub() {
  if (!state.club) return;
  const text = `Entra no meu ${state.club.name} no Dorama Club. Código: ${state.club.code}`;
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
  if (!window.confirm(`Excluir a usuária “${nome}” e TODOS os dados dela? Isso não tem volta.`)) return;
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
  const text = drama.status === "finished"
    ? `Finalizei ${drama.title} e dei ${drama.personalRating || "10"}/10. Sofri, surtei e recomendo.`
    : `Estou assistindo ${drama.title} no Dorama Club. Já estou no episódio ${drama.currentEpisode || 0}!`;
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
  // Clube (Fase B): se as migrações ainda não rodaram, falha em silêncio.
  clubMembers = [];
  try {
    const clubs = await myClubs();
    state.club = clubs.length ? { id: clubs[0].id, name: clubs[0].name, code: clubs[0].code } : null;
  } catch {
    state.club = null;
  }
  saveState();
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
    unsubscribeAuth = onAuthChange(async (user) => {
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

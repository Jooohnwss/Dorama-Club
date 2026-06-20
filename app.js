import { searchDramas, getDramaDetails, tmdbReady } from "./tmdb.js";
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
  isAdminEmail,
  adminOverview,
  adminUsers,
  adminClubs,
  adminComments,
  adminDeleteComment,
} from "./supabase.js";

const STORAGE_KEY = "dorama-club-state-v1";

const POSTER_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='180'><rect width='120' height='180' fill='%23ffe2ef'/><text x='60' y='95' font-size='40' text-anchor='middle' fill='%23df4f94'>DC</text></svg>`,
  );

const statuses = [
  { key: "watching", label: "Assistindo" },
  { key: "wishlist", label: "Quero assistir" },
  { key: "finished", label: "Já assisti" },
  { key: "paused", label: "Pausados" },
  { key: "dropped", label: "Dropei" },
  { key: "favorites", label: "Favoritos" },
  { key: "comfort", label: "Dorama conforto" },
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
// Membros do clube atual (carregados sob demanda).
let clubMembers = [];
// Dados da área de administradores (carregados sob demanda).
let admin = { loaded: false, loading: false, error: "", overview: null, users: [], clubs: [], comments: [] };

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
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
      document.querySelector("#profile-form")?.addEventListener("submit", saveProfile);
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
    ["home", "Início"],
    ["add", "Adicionar"],
    ["lists", "Minhas listas"],
    ["club", "Doramigas"],
    ["profile", "Perfil"],
  ];
  if (isAdmin()) items.push(["admin", "Admin"]);

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
        ${items.map(([key, label]) => `<button class="${state.view === key ? "active" : ""}" data-view="${key}">${label}</button>`).join("")}
      </nav>
      ${supabaseReady() ? `<button class="logout" data-logout>Sair</button>` : ""}
    </aside>
  `;
}

function viewTemplate() {
  const views = {
    home: homeTemplate,
    add: addTemplate,
    lists: listsTemplate,
    club: clubTemplate,
    profile: profileTemplate,
    admin: adminTemplate,
  };
  if (state.view === "admin" && !isAdmin()) return homeTemplate();
  return (views[state.view] || homeTemplate)();
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
        ? admin.users.map((u) => `<div class="card"><strong>${esc(u.name || "(sem nome)")}</strong><p class="muted">${esc(u.email || "")}</p><div class="chips">${u.nickname ? `<span class="chip">${esc(u.nickname)}</span>` : ""}<span class="chip">${u.dramas || 0} doramas</span>${u.since ? `<span class="chip">desde ${u.since}</span>` : ""}</div></div>`).join("")
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

  return `
    <section class="hero">
      <p>Oi, ${profile.name}. Qual vai ser o surto de hoje?</p>
      <h2>Dorama Club</h2>
      <div class="actions">
        <button class="btn secondary" data-view="add">+ Adicionar dorama</button>
        <button class="btn secondary" data-random>Sortear próximo</button>
      </div>
    </section>
    <section class="grid stats">
      ${stats.map(([label, value]) => `<div class="stat"><span class="muted">${label}</span><strong>${value}</strong></div>`).join("")}
    </section>
    <div class="section-title">
      <h2>Celular</h2>
    </div>
    <section class="grid cards">
      <div class="card"><strong>Instalar como app</strong><p class="muted">No Chrome do celular, use Adicionar à tela inicial para abrir como PWA.</p></div>
      <div class="card"><strong>Compartilhar no WhatsApp</strong><p class="muted">Nos detalhes do dorama, o botão monta a mensagem de progresso ou finalização.</p></div>
      <div class="card"><strong>Notificações</strong><p class="muted">No MVP ficam dentro do app; push notification entra numa fase futura.</p></div>
    </section>
    <div class="section-title">
      <h2>Atalhos</h2>
    </div>
    <section class="grid cards">
      ${statuses
        .slice(0, 6)
        .map((status) => `<button class="card" data-list="${status.key}"><strong>${status.label}</strong><p class="muted">${byStatus(status.key).length} doramas</p></button>`)
        .join("")}
      <button class="card" data-view="club"><strong>${state.club ? esc(state.club.name) : "Clube das Doramigas"}</strong><p class="muted">${state.club ? esc(state.club.code) : "Criar ou entrar com código"}</p></button>
      <button class="card" data-view="add"><strong>Adicionar dorama</strong><p class="muted">Buscar e colocar em uma lista</p></button>
    </section>
    <div class="section-title">
      <h2>Assistindo agora</h2>
    </div>
    ${dramaGrid(byStatus("watching"))}
  `;
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
            ${["Indicação de doramiga", "Vi no TikTok", "Gosto do ator/atriz", "Parece sofrer gostoso", "Romance fofo", "Está todo mundo falando", "Quero ver depois", "Quero ver com as doramigas"].map((item) => `<option>${item}</option>`).join("")}
          </select>
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
    <div class="section-title"><h2>Feed e comentários</h2></div>
    <div class="empty">Em breve: feed das doramigas e comentários com trava de spoiler.</div>
  `;
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
    <div class="section-title">
      <h2>Perfil da usuária</h2>
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
  `;
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
      <label for="photo">Foto de perfil</label>
      <input id="photo" name="photo" value="${profile.photo || ""}" placeholder="URL da foto" />
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

function dramaCard(drama) {
  const progress = drama.status === "wishlist" ? drama.priority : `Ep. ${drama.currentEpisode || 0}/${drama.episodes}`;
  return `
    <article class="drama-card">
      <img class="poster" src="${drama.cover}" alt="Capa de ${drama.title}" />
      <div>
        <h3>${drama.title}</h3>
        <p>${drama.year} · ${statusLabel(drama.status)} · ${progress || ""}</p>
        <p>${drama.synopsis}</p>
        <div class="chips">
          ${drama.genres.map((genre) => `<span class="chip">${genre}</span>`).join("")}
          ${drama.favorite ? `<span class="chip">Favorito</span>` : ""}
          ${drama.comfort ? `<span class="chip">Conforto</span>` : ""}
        </div>
        <div class="mini-actions">
          ${drama.status === "watching" ? `<button data-plus-one="${drama.id}">+1 episódio</button>` : ""}
          <button data-detail="${drama.id}">Ver detalhes</button>
          <button data-toggle-favorite="${drama.id}">${drama.favorite ? "Desfavoritar" : "Favoritar"}</button>
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
              <p>${drama.synopsis}</p>
              <div class="chips">${drama.genres.map((genre) => `<span class="chip">${genre}</span>`).join("")}</div>
            </div>
            <div class="field">
              <label for="status">Status pessoal</label>
              <select id="status" name="status">${statuses.slice(0, 5).map((status) => `<option value="${status.key}" ${drama.status === status.key ? "selected" : ""}>${status.label}</option>`).join("")}</select>
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
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
}

function bindWelcome() {
  document.querySelectorAll("[data-start]").forEach((button) => {
    button.addEventListener("click", () => {
      modal = { type: "profile" };
      render();
    });
  });
}

function bindAuth() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      authMode = button.dataset.authMode;
      render();
    });
  });
  document.querySelector("#auth-form")?.addEventListener("submit", handleAuthSubmit);
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
  admin = { loaded: false, loading: false, error: "", overview: null, users: [], clubs: [], comments: [] };
  saveState();
  render();
}

function bindShell() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setState({ view: button.dataset.view }));
  });

  document.querySelectorAll("[data-list]").forEach((button) => {
    button.addEventListener("click", () => setState({ view: "lists", activeList: button.dataset.list }));
  });

  document.querySelectorAll("[data-active-list]").forEach((button) => {
    button.addEventListener("click", () => setState({ activeList: button.dataset.activeList }));
  });

  document.querySelectorAll("[data-plus-one]").forEach((button) => {
    button.addEventListener("click", () => incrementEpisode(button.dataset.plusOne));
  });

  document.querySelectorAll("[data-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      modal = { type: "detail", id: button.dataset.detail };
      render();
    });
  });

  document.querySelectorAll("[data-toggle-favorite]").forEach((button) => {
    button.addEventListener("click", () => toggleField(button.dataset.toggleFavorite, "favorite"));
  });

  document.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => pickResult(Number(button.dataset.pick)));
  });

  document.querySelectorAll("[data-admin-del-comment]").forEach((button) => {
    button.addEventListener("click", () => handleAdminDeleteComment(button.dataset.adminDelComment));
  });

  document.querySelector("[data-random]")?.addEventListener("click", randomDrama);
  document.querySelector("[data-copy-code]")?.addEventListener("click", copyClubCode);
  document.querySelector("[data-logout]")?.addEventListener("click", handleLogout);
  document.querySelector("[data-share-club]")?.addEventListener("click", shareClub);
  document.querySelector("[data-leave-club]")?.addEventListener("click", handleLeaveClub);
  document.querySelector("[data-admin-refresh]")?.addEventListener("click", () => loadAdmin(true));
  document.querySelector("#search-form")?.addEventListener("submit", runSearch);
  document.querySelector("#add-form")?.addEventListener("submit", addDrama);
  document.querySelector("#profile-form")?.addEventListener("submit", saveProfile);
  document.querySelector("#create-club-form")?.addEventListener("submit", handleCreateClub);
  document.querySelector("#join-club-form")?.addEventListener("submit", handleJoinClub);

  // Carrega dados sob demanda ao abrir as telas.
  if (state.view === "admin" && isAdmin() && !admin.loaded && !admin.loading) loadAdmin();
  if (state.view === "club" && state.club && !clubMembers.length) loadClubMembers();
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
  document.querySelector("[data-close]")?.addEventListener("click", () => {
    modal = null;
    render();
  });
  document.querySelector("#profile-form")?.addEventListener("submit", saveProfile);
  document.querySelector("#drama-form")?.addEventListener("submit", saveDramaDetails);
  document.querySelector("[data-whatsapp]")?.addEventListener("click", shareWhatsApp);
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
  const drama = normalizeDrama({
    ...search.selected,
    id: createId(),
    status: data.status,
    currentEpisode: Number(data.currentEpisode || 0),
    reason: data.reason,
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
  try {
    clubMembers = await clubMembersList(state.club.id);
    render();
  } catch {
    // silencioso; mostra "carregando" até reconectar
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
    admin = { ...admin, loading: false, error: error?.message || "Não consegui carregar o painel. Rode as migrações 01, 02 e 03 no Supabase." };
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
  if (supabaseReady()) {
    try {
      authUser = await getCurrentUser();
      if (authUser) await hydrateFromCloud();
    } catch {
      // Sem conexão: cai no estado local até reconectar.
    }
    onAuthChange(async (user) => {
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

// Cliente TMDB (busca de doramas / séries asiáticas).
// Usa o token de leitura v4 via header Authorization: Bearer.
import { TMDB_BEARER } from "./config.js";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";
const IMG_BACKDROP = "https://image.tmdb.org/t/p/w780";

export function tmdbReady() {
  return Boolean(TMDB_BEARER) && !TMDB_BEARER.startsWith("COLE_AQUI");
}

async function tmdb(path, params = {}) {
  if (!tmdbReady()) throw new Error("TMDB sem token");
  const url = new URL(BASE + path);
  url.searchParams.set("language", "pt-BR");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_BEARER}`, accept: "application/json" },
  });
  if (!response.ok) throw new Error(`TMDB ${response.status}`);
  return response.json();
}

function posterUrl(path) {
  return path ? IMG + path : "";
}

// País/origem amigável a partir do resultado do TMDB (pra etiqueta na busca).
const PAIS_POR_CODIGO = {
  KR: "Coreia", TH: "Tailândia", JP: "Japão", CN: "China", TW: "Taiwan",
  HK: "Hong Kong", US: "EUA", BR: "Brasil", GB: "Reino Unido", IN: "Índia",
  PH: "Filipinas", ID: "Indonésia", VN: "Vietnã", FR: "França", ES: "Espanha",
};
const PAIS_POR_IDIOMA = {
  ko: "Coreia", th: "Tailândia", ja: "Japão", zh: "China", en: "EUA",
  pt: "Brasil", hi: "Índia", tl: "Filipinas", id: "Indonésia", vi: "Vietnã",
};
function paisLabel(result) {
  const cc = (result.origin_country && result.origin_country[0]) || "";
  if (PAIS_POR_CODIGO[cc]) return PAIS_POR_CODIGO[cc];
  return PAIS_POR_IDIOMA[result.original_language] || "";
}

// Resultado resumido da busca (sem nº de episódios — vem só nos detalhes).
// Funciona para série (tv) e filme (movie).
function toBrief(result) {
  const isMovie = result.media_type === "movie" || (!result.first_air_date && !result.name && Boolean(result.title));
  const date = result.first_air_date || result.release_date || "";
  return {
    tmdbId: result.id,
    mediaType: isMovie ? "movie" : "tv",
    title: result.name || result.title || result.original_name || result.original_title || "Sem título",
    original: result.original_name || result.original_title || "",
    year: date ? Number(date.slice(0, 4)) : "",
    rating: result.vote_average ? Number(result.vote_average.toFixed(1)) : "",
    cover: posterUrl(result.poster_path),
    backdrop: result.backdrop_path ? IMG_BACKDROP + result.backdrop_path : "",
    synopsis: result.overview || "",
    origem: paisLabel(result),
  };
}

// Busca em SÉRIES + FILMES, em pt-BR e en-US (pega título traduzido e original).
export async function searchDramas(query) {
  const [pt, en] = await Promise.all([
    tmdb("/search/multi", { query, include_adult: "false", page: "1", language: "pt-BR" }),
    tmdb("/search/multi", { query, include_adult: "false", page: "1", language: "en-US" }).catch(() => ({ results: [] })),
  ]);
  const vistos = new Map();
  for (const r of [...(pt.results || []), ...(en.results || [])]) {
    if (r.media_type && r.media_type !== "tv" && r.media_type !== "movie") continue; // ignora "person"
    if (!vistos.has(r.id)) vistos.set(r.id, r);
  }
  return [...vistos.values()]
    .map(toBrief)
    .sort((a, b) => (b.cover ? 1 : 0) - (a.cover ? 1 : 0));
}

// Gêneros que NÃO são dorama: animação, reality, talk show, news, documentário.
const GENEROS_FORA = [16, 10764, 10767, 10763, 99];

// Dorama da semana / em alta: tendências da semana, só séries asiáticas (sem anime/variedade).
export async function trendingWeek() {
  const data = await tmdb("/trending/tv/week");
  const asia = ["ko", "zh", "ja", "th"];
  return (data.results || [])
    .filter((r) => asia.includes(r.original_language) && r.poster_path)
    .filter((r) => !(r.genre_ids || []).some((g) => GENEROS_FORA.includes(g)))
    .map(toBrief);
}

// Descobrir doramas (coreanos) por critério.
// criterio: "popular" | "top" | "novos"
export async function discoverDramas(criterio) {
  const params = {
    with_original_language: "ko",
    without_genres: GENEROS_FORA.join(","),
    include_adult: "false",
    page: "1",
  };
  if (criterio === "top") {
    params.sort_by = "vote_average.desc";
    params["vote_count.gte"] = "200";
  } else if (criterio === "novos") {
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 4);
    params.sort_by = "first_air_date.desc";
    params["first_air_date.gte"] = desde.toISOString().slice(0, 10);
    params["first_air_date.lte"] = new Date().toISOString().slice(0, 10);
    params["vote_count.gte"] = "3";
  } else {
    params.sort_by = "popularity.desc";
  }
  const data = await tmdb("/discover/tv", params);
  return (data.results || []).filter((r) => r.poster_path).map(toBrief);
}

// Backdrop (fundo cinematográfico) de um dorama, pra usar no card de compartilhar.
export async function getBackdrop(tmdbId) {
  try {
    const r = await tmdb(`/tv/${tmdbId}`);
    return r.backdrop_path ? IMG_BACKDROP + r.backdrop_path : "";
  } catch {
    return "";
  }
}

// Onde assistir (streaming) no Brasil. Retorna [{ name, logo }].
export async function getWatchProviders(tmdbId) {
  try {
    const data = await tmdb(`/tv/${tmdbId}/watch/providers`);
    const br = data.results?.BR || {};
    const lista = [...(br.flatrate || []), ...(br.free || []), ...(br.ads || [])];
    const vistos = new Set();
    return lista
      .filter((p) => (vistos.has(p.provider_id) ? false : vistos.add(p.provider_id)))
      .map((p) => ({ name: p.provider_name, logo: p.logo_path ? "https://image.tmdb.org/t/p/w45" + p.logo_path : "" }));
  } catch {
    return [];
  }
}

// Detalhes completos (nº de episódios, gêneros). Chamado ao selecionar um resultado.
// mediaType: "tv" (padrão) ou "movie".
export async function getDramaDetails(tmdbId, mediaType = "tv") {
  if (mediaType === "movie") {
    const result = await tmdb(`/movie/${tmdbId}`);
    return {
      tmdbId: result.id,
      mediaType: "movie",
      title: result.title || result.original_title || "Sem título",
      year: result.release_date ? Number(result.release_date.slice(0, 4)) : "",
      episodes: 1, // filme = 1 "episódio"
      runtime: result.runtime || 0,
      genres: (result.genres || []).map((genre) => genre.name),
      rating: result.vote_average ? Number(result.vote_average.toFixed(1)) : "",
      cover: posterUrl(result.poster_path),
      synopsis: result.overview || "",
    };
  }
  const result = await tmdb(`/tv/${tmdbId}`);
  return {
    tmdbId: result.id,
    mediaType: "tv",
    title: result.name || result.original_name || "Sem título",
    year: result.first_air_date ? Number(result.first_air_date.slice(0, 4)) : "",
    episodes: result.number_of_episodes || 16,
    runtime: (result.episode_run_time && result.episode_run_time[0]) || 0,
    genres: (result.genres || []).map((genre) => genre.name),
    rating: result.vote_average ? Number(result.vote_average.toFixed(1)) : "",
    cover: posterUrl(result.poster_path),
    synopsis: result.overview || "",
  };
}

// Duração média de um episódio (minutos). 0 quando o TMDB não informa.
export async function getEpisodeRuntime(tmdbId) {
  try {
    const r = await tmdb(`/tv/${tmdbId}`);
    return (r.episode_run_time && r.episode_run_time[0]) || 0;
  } catch {
    return 0;
  }
}

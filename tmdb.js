// Cliente TMDB (busca de doramas / séries asiáticas).
// Usa o token de leitura v4 via header Authorization: Bearer.
import { TMDB_BEARER } from "./config.js";

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w342";

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

// Resultado resumido da busca (sem nº de episódios — vem só nos detalhes).
function toBrief(result) {
  return {
    tmdbId: result.id,
    title: result.name || result.original_name || "Sem título",
    year: result.first_air_date ? Number(result.first_air_date.slice(0, 4)) : "",
    rating: result.vote_average ? Number(result.vote_average.toFixed(1)) : "",
    cover: posterUrl(result.poster_path),
    synopsis: result.overview || "",
  };
}

// Busca séries (doramas são TV). Ordena pelas mais populares com pôster primeiro.
export async function searchDramas(query) {
  const data = await tmdb("/search/tv", { query, include_adult: "false", page: "1" });
  return (data.results || [])
    .map(toBrief)
    .sort((a, b) => (b.cover ? 1 : 0) - (a.cover ? 1 : 0));
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
export async function getDramaDetails(tmdbId) {
  const result = await tmdb(`/tv/${tmdbId}`);
  return {
    tmdbId: result.id,
    title: result.name || result.original_name || "Sem título",
    year: result.first_air_date ? Number(result.first_air_date.slice(0, 4)) : "",
    episodes: result.number_of_episodes || 16,
    genres: (result.genres || []).map((genre) => genre.name),
    rating: result.vote_average ? Number(result.vote_average.toFixed(1)) : "",
    cover: posterUrl(result.poster_path),
    synopsis: result.overview || "",
  };
}

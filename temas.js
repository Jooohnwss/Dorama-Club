// Temas base (cores lisas, sem fundo de dorama). São o padrão e as opções
// "limpas". Para temas com a cara de um dorama, o app monta na hora a partir
// de qualquer série do TMDB (ver usarDoramaComoTema em app.js).
//
// Contrato de variáveis (as mesmas usadas em styles.css):
//   --cor-fundo, --cor-superficie, --cor-superficie-2, --cor-texto,
//   --cor-texto-suave, --cor-primaria, --cor-primaria-texto, --cor-secundaria,
//   --cor-borda, --fonte-base

export const temas = [
  {
    id: "rosa-fofo",
    nome: "Rosa Fofo",
    categoria: "Cores",
    descricao: "Claro, rosa e lilás, bem fofo",
    amostra: { fundo: "#fff6fb", destaque: "#df4f94" },
    marca: { emoji: "💕", tagline: "Sua watchlist, seus surtos e suas doramigas." },
    variaveis: {
      "--cor-fundo": "#fff6fb",
      "--cor-superficie": "#ffffff",
      "--cor-superficie-2": "#fff0f7",
      "--cor-texto": "#2f1632",
      "--cor-texto-suave": "#7d647f",
      "--cor-primaria": "#df4f94",
      "--cor-primaria-texto": "#ffffff",
      "--cor-secundaria": "#8a5cf6",
      "--cor-borda": "#efd7e8",
      "--fonte-base": 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    },
  },
  {
    id: "roxo-cinema",
    nome: "Roxo Cinema",
    categoria: "Cores",
    descricao: "Escuro, clima streaming",
    amostra: { fundo: "#140f1f", destaque: "#c084fc" },
    marca: { emoji: "🌙", tagline: "Modo maratona ativado." },
    variaveis: {
      "--cor-fundo": "#140f1f",
      "--cor-superficie": "#1d1730",
      "--cor-superficie-2": "#251d3d",
      "--cor-texto": "#f3eeff",
      "--cor-texto-suave": "#b3a6cf",
      "--cor-primaria": "#c084fc",
      "--cor-primaria-texto": "#1a1030",
      "--cor-secundaria": "#f472b6",
      "--cor-borda": "#322a4d",
      "--fonte-base": 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    },
  },
  {
    id: "pastel-doce",
    nome: "Pastel Doce",
    categoria: "Cores",
    descricao: "Calmo, claro e amigável",
    amostra: { fundo: "#fdf4ff", destaque: "#fb7185" },
    marca: { emoji: "🍮", tagline: "Romance fofo sem susto." },
    variaveis: {
      "--cor-fundo": "#fdf4ff",
      "--cor-superficie": "#ffffff",
      "--cor-superficie-2": "#faf0ff",
      "--cor-texto": "#3b2a4a",
      "--cor-texto-suave": "#8b7a96",
      "--cor-primaria": "#fb7185",
      "--cor-primaria-texto": "#ffffff",
      "--cor-secundaria": "#a78bfa",
      "--cor-borda": "#f0e2f7",
      "--fonte-base": '"Trebuchet MS", Inter, system-ui, sans-serif',
    },
  },
];

export const temaPadrao = temas[0];

export function acharTema(id) {
  return temas.find((t) => t.id === id) || temaPadrao;
}

export const categorias = [...new Set(temas.map((t) => t.categoria))];

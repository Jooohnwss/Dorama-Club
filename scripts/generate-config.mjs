// Gera config.js a partir de variáveis de ambiente (usado no build do Vercel).
// Localmente você mantém o config.js próprio (que está no .gitignore).
import { writeFileSync } from "node:fs";

const {
  TMDB_BEARER = "",
  SUPABASE_URL = "",
  SUPABASE_ANON_KEY = "",
  GIPHY_KEY = "4XwLH4zQ4uvcW05H188R5gEolCsLtOgy",
} = process.env;

// A chave VAPID pública não é segredo e precisa ser exatamente a mesma
// em todos os deploys. Não aceita override de env antigo, que quebraria o par.
const VAPID_PUBLIC_KEY = "BDqoVq7j7Cl5f2-a_khfb5XMYTTLqGaL9FwQEgT72BqvlkrDQ45l2BfctEw3gZtPWjkS0tsHLY44YYayNwYYgGU";

const missing = [];
if (!TMDB_BEARER) missing.push("TMDB_BEARER");
if (!SUPABASE_URL) missing.push("SUPABASE_URL");
if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
if (missing.length) {
  console.warn(`[generate-config] AVISO: variáveis faltando: ${missing.join(", ")}`);
}

const content = `// Gerado automaticamente no build a partir das variáveis de ambiente.
export const TMDB_BEARER = ${JSON.stringify(TMDB_BEARER)};
export const SUPABASE_URL = ${JSON.stringify(SUPABASE_URL)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(SUPABASE_ANON_KEY)};
export const VAPID_PUBLIC_KEY = ${JSON.stringify(VAPID_PUBLIC_KEY)};
export const GIPHY_KEY = ${JSON.stringify(GIPHY_KEY)};
`;

writeFileSync("config.js", content);
console.log("[generate-config] config.js gerado.");

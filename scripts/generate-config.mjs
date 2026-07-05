// Gera config.js a partir de variáveis de ambiente (usado no build do Vercel).
// Localmente você mantém o config.js próprio (que está no .gitignore).
import { writeFileSync } from "node:fs";

const {
  TMDB_BEARER = "",
  SUPABASE_URL = "",
  SUPABASE_ANON_KEY = "",
  // Chave PÚBLICA VAPID (não é segredo) — default garante push em produção
  // mesmo sem env var. A PRIVADA fica só no segredo da função Edge.
  VAPID_PUBLIC_KEY = "BKf935uAUSYdxVWGszdFsacS7uU7_lta7N8S1zwaSV1k5U9OrKOsKlMzTnbRKTcSrGIxt9Kr_zlNK9xXi7Qs5kM",
} = process.env;

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
`;

writeFileSync("config.js", content);
console.log("[generate-config] config.js gerado.");

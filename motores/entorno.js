import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  if (process.cwd() !== RAIZ) process.chdir(RAIZ);
} catch {}

try {
  process.loadEnvFile(path.join(RAIZ, ".env"));
} catch {}

export const esTermux = /com\.termux/.test(process.env.PREFIX || "") || Boolean(process.env.TERMUX_VERSION);

export function nombreEntorno() {
  const e = process.env;
  if (esTermux) return "Termux";
  if (e.RAILWAY_PUBLIC_DOMAIN || e.RAILWAY_ENVIRONMENT) return "Railway";
  if (e.RENDER || e.RENDER_EXTERNAL_URL) return "Render";
  if (e.KOYEB_PUBLIC_DOMAIN) return "Koyeb";
  if (e.FLY_APP_NAME) return "Fly.io";
  if (e.DYNO || e.HEROKU_APP_NAME) return "Heroku";
  if (e.REPL_ID || e.REPLIT_DEV_DOMAIN) return "Replit";
  if (e.SPACE_HOST) return "Hugging Face";
  if (e.CODESPACES) return "Codespaces";
  if (e.P_SERVER_UUID || e.PTERODACTYL) return "Pterodactyl";
  if (fs.existsSync("/.dockerenv")) return "Docker";
  return "Servidor";
}

export function limiteMemoriaMb() {
  const rutas = ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"];
  for (const ruta of rutas) {
    try {
      const bytes = Number(fs.readFileSync(ruta, "utf8").trim());
      if (Number.isFinite(bytes) && bytes > 0 && bytes < 1024 ** 4) return Math.floor(bytes / 1048576);
    } catch {}
  }
  return null;
}

export const numeroDeVinculacion = () =>
  String(process.env.NUMERO_BOT || process.env.BOT_NUMBER || process.env.WA_NUMBER || "").replace(/\D/g, "");

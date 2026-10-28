import { spawn } from "child_process";
import { ponerUrlTunel } from "./juegos-api.js";

// Si tienes "cloudflared" instalado (en Termux: pkg install cloudflared), abre solo un túnel
// público gratis y los juegos lo usan para guardar los récords sin que hagas nada.
// Desactívalo con JUEGOS_TUNEL=0. Si ya tienes JUEGOS_URL / PUBLIC_URL, no se abre.
let proc = null;
let fallos = 0;
let avisado = false;

export function iniciarTunel(puerto) {
  if (process.env.JUEGOS_TUNEL === "0" || proc) return;
  if (process.env.JUEGOS_URL || process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL) return;
  lanzar(puerto);
}

function lanzar(puerto) {
  let sinBinario = false;
  try {
    proc = spawn("cloudflared", ["tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:" + puerto], { stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    proc = null;
    return;
  }
  const leer = (b) => {
    const m = String(b).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (m) {
      ponerUrlTunel(m[0]);
      fallos = 0;
      console.log("[JUEGOS] Túnel público activo: " + m[0]);
    }
  };
  proc.stdout.on("data", leer);
  proc.stderr.on("data", leer);
  proc.on("error", (e) => {
    sinBinario = e.code === "ENOENT";
    proc = null;
    ponerUrlTunel("");
    if (sinBinario && !avisado) {
      avisado = true;
      console.log("[JUEGOS] Sin túnel automático (cloudflared no instalado). Usa .gurl <tu-url-publica> para el guardado automático.");
    }
  });
  proc.on("exit", () => {
    proc = null;
    ponerUrlTunel("");
    if (sinBinario) return;
    fallos++;
    if (fallos > 6) return;
    setTimeout(() => lanzar(puerto), Math.min(60000, 5000 * fallos));
  });
}

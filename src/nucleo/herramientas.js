// Al arrancar, si falta yt-dlp o ffmpeg (por ejemplo en un teléfono nuevo) los instala solos en segundo plano.
// El bot no espera: arranca normal y, cuando termina la instalación, los comandos de descarga ya funcionan.
import { spawn, spawnSync } from "child_process";
import { fileURLToPath } from "url";

const SCRIPT = fileURLToPath(new URL("../../scripts/instalar-herramientas.mjs", import.meta.url));
const falta = (cmd, args) => spawnSync(cmd, args, { stdio: "ignore" }).status !== 0;

export function asegurarHerramientas() {
  if (process.env.SIN_AUTOINSTALAR === "1") return;
  if (!falta("yt-dlp", ["--version"]) && !falta("ffmpeg", ["-version"])) return;
  console.log("[setup] Falta yt-dlp o ffmpeg: instalando en segundo plano (puede tardar unos minutos)…");
  try {
    spawn(process.execPath, [SCRIPT], { stdio: "inherit" }).on("error", () => {});
  } catch (e) { console.log("[setup] No se pudo lanzar la instalación:", e.message); }
}

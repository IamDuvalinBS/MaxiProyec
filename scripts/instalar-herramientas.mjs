// Instala las herramientas que NO son de npm (yt-dlp y ffmpeg). Se ejecuta solo con `npm install` y a mano con `npm run setup`.
// Nunca hace fallar la instalación: si algo no se puede, avisa y sigue.
import { spawnSync } from "child_process";

const esTermux = /com\.termux/.test(process.env.PREFIX || "") || Boolean(process.env.TERMUX_VERSION);
const corre = (cmd, args) => spawnSync(cmd, args, { stdio: "inherit" }).status === 0;
const existe = (cmd, args = ["--version"]) => spawnSync(cmd, args, { stdio: "ignore" }).status === 0;

function asegurar() {
  const tieneFfmpeg = existe("ffmpeg", ["-version"]);
  const tieneYtdlp = existe("yt-dlp");
  if (tieneFfmpeg && tieneYtdlp) { console.log("[setup] yt-dlp y ffmpeg ya están instalados."); return; }

  if (!existe("python3") && !existe("python")) {
    if (esTermux) corre("pkg", ["install", "-y", "python"]);
    else console.log("[setup] Falta Python. Instálalo (apt install python3 python3-pip) y corre: npm run setup");
  }
  if (!tieneFfmpeg) {
    if (esTermux) {
      if (!corre("pkg", ["install", "-y", "ffmpeg"])) {
        console.log("[setup] ffmpeg falló; actualizando paquetes y reintentando…");
        corre("pkg", ["upgrade", "-y"]);
        corre("pkg", ["install", "-y", "ffmpeg"]);
      }
    } else console.log("[setup] Falta ffmpeg. Instálalo con: apt install ffmpeg");
  }
  if (!tieneYtdlp) {
    const py = existe("python3", ["--version"]) ? "python3" : "python";
    const args = ["-m", "pip", "install", "-U", "--break-system-packages"];
    if (!corre(py, [...args, "yt-dlp[default,curl-cffi]"])) corre(py, [...args, "yt-dlp[default]"]);
  }
  console.log(`[setup] yt-dlp: ${existe("yt-dlp") ? "OK" : "FALTA"} · ffmpeg: ${existe("ffmpeg", ["-version"]) ? "OK" : "FALTA"}`);
}

try { asegurar(); } catch (e) { console.log("[setup] No se pudo completar:", e.message); }
process.exit(0);

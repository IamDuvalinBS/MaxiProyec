import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";
import { DATOS } from "./datos.js";
import { FUENTES } from "./fuentes.js";

const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EXT_LOCALES = /\.(gif|mp4|webp)$/i;

const HEADERS = { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" };

// Descarga directo a un archivo temporal en disco (streaming) en vez de
// juntar todo el gif en un Buffer en RAM antes de guardarlo - con gifs
async function descargarATemporal(url, ext) {
  const tmpPath = path.join(os.tmpdir(), `react-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok || !res.body) throw new Error(`No se pudo descargar el archivo (HTTP ${res.status}).`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmpPath));
  return tmpPath;
}

function convertirAMp4(entrada) {
  return new Promise((resolve) => {
    const salida = entrada.replace(/\.gif$/, ".mp4");
    const args = ["-y", "-i", entrada, "-vf", "scale=400:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "veryfast", "-movflags", "faststart", "-an", salida];
    execFile("ffmpeg", args, { timeout: 20000 }, (error) => {
      if (fs.existsSync(entrada)) fs.unlinkSync(entrada);
      if (error) {
        resolve(null);
        return;
      }
      resolve(salida);
    });
  });
}

// Devuelve la URL de una fuente concreta (o undefined si falla).
async function urlDeFuente([proveedor, categoria]) {
  try {
    if (proveedor === "nekos") {
      const res = await fetch(`https://nekos.best/api/v2/${categoria}`, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return undefined;
      return (await res.json()).results?.[0]?.url;
    }
    if (proveedor === "otaku") {
      const res = await fetch(`https://api.otakugifs.xyz/gif?reaction=${categoria}`, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return undefined;
      return (await res.json()).url;
    }
    if (proveedor === "gifukai") {
      const res = await fetch(`https://api.gifukai.com/v1/${categoria}`, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return undefined;
      return (await res.json()).url;
    }
    if (proveedor === "aflb") {
      // Paquete npm opcional: si no está instalado, simplemente se salta esta fuente.
      const modulo = await import("aflb");
      let lib = modulo.default ?? modulo;
      if (typeof lib === "function") lib = new lib();
      const grupo = lib.sfw ?? lib;
      const fn = grupo[categoria];
      if (typeof fn !== "function") return undefined;
      const r = await fn.call(grupo);
      return typeof r === "string" ? r : r?.url ?? r?.link;
    }
    if (proveedor === "waifu") {
      const res = await fetch(`https://api.waifu.pics/sfw/${categoria}`, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) return undefined;
      return (await res.json()).url;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

// Si existe assets/reacciones/<accion>/ con gifs/mp4, elige uno al azar y lo copia a un temporal.
function copiaLocal(accion) {
  const dir = path.join(RAIZ, "assets", "reacciones", accion);
  if (!fs.existsSync(dir)) return null;
  const archivos = fs.readdirSync(dir).filter((f) => EXT_LOCALES.test(f));
  if (!archivos.length) return null;
  const tmpPath = path.join(os.tmpdir(), `react-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.gif`);
  fs.copyFileSync(path.join(dir, elegir(archivos)), tmpPath);
  return tmpPath;
}

// Prueba local -> fuentes en orden. Devuelve { buffer } o { buffer: null } si no hay fuentes definidas.
async function conseguirMp4(accion) {
  const config = FUENTES[accion];
  const fuentes = config === false ? [] : [...(config ?? [["nekos", accion]])];
  if (config !== false && !fuentes.some(([prov, cat]) => prov === "gifukai" && cat === accion)) fuentes.push(["gifukai", accion]);
  const local = copiaLocal(accion);
  if (local) {
    const mp4 = await convertirAMp4(local);
    if (mp4) {
      const buffer = fs.readFileSync(mp4);
      fs.unlinkSync(mp4);
      return { buffer };
    }
  }
  if (!fuentes.length) return { buffer: null, sinFuentes: true };
  for (const fuente of fuentes) {
    const url = await urlDeFuente(fuente);
    if (!url) continue;
    try {
      const mp4 = await convertirAMp4(await descargarATemporal(url, "gif"));
      if (!mp4) continue;
      const buffer = fs.readFileSync(mp4);
      fs.unlinkSync(mp4);
      return { buffer };
    } catch {
      continue;
    }
  }
  return { buffer: null };
}

export function reactionCommand({ apiAction, fraseConOtro, fraseSolo }) {
  return async ({ sock, from, sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;
    const esASiMismo = target === sender;

    const { buffer, sinFuentes } = await conseguirMp4(apiAction);
    if (!buffer && !sinFuentes) {
      await reply({ text: "❌ No se pudo conseguir la imagen ahora mismo, intentá de nuevo." });
      return;
    }

    const nombreDe = "@" + sender.split("@")[0];
    const nombrePara = "@" + target.split("@")[0];
    const datos = DATOS[apiAction];
    const [conOtro, solo] = datos ? elegir(datos.frases) : [fraseConOtro, fraseSolo];
    const diseno = datos ? " " + elegir(datos.disenos) : "";
    const caption = esASiMismo ? `${nombreDe} ${solo}${diseno}` : `${nombreDe} ${conOtro} ${nombrePara}.${diseno}`;
    const mentions = esASiMismo ? [sender] : [sender, target];

    if (!buffer) {
      await sock.sendMessage(from, { text: caption, mentions }, { quoted: msg });
      return;
    }
    await sock.sendMessage(from, { video: buffer, mimetype: "video/mp4", gifPlayback: true, caption, mentions }, { quoted: msg });
  };
}

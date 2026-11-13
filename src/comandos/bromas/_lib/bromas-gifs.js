import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";

const CARPETA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../gifs");
const EXTENSIONES = /\.(gif|mp4|webp)$/i;
const HEADERS = { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" };
const TIEMPO_MAX_MS = 9000;

export const FUENTES = {
  uwu: [["nekos", "happy"], ["nekos", "blush"]],
  fiel: [["nekos", "pat"]],
  infiel: [["nekos", "smug"]],
  cachudo: [["nekos", "shrug"]],
  toxicidad: [["nekos", "angry"], ["otaku", "mad"]],
  idiota: [["nekos", "facepalm"]],
  emo: [["otaku", "sad"], ["nekos", "cry"]],
  simp: [["nekos", "blush"], ["otaku", "love"]],
  rizz: [["nekos", "wink"], ["nekos", "smug"]],
  aura: [["nekos", "smug"]],
  carisma: [["nekos", "smile"], ["nekos", "happy"]],
  iq: [["nekos", "think"]],
  genio: [["nekos", "think"]],
  suerte: [["otaku", "yay"], ["nekos", "happy"]],
  ligon: [["nekos", "wink"]],
  celoso: [["nekos", "stare"], ["nekos", "pout"]],
  chismoso: [["nekos", "lurk"]],
  mentiroso: [["nekos", "shrug"]],
  dormilon: [["nekos", "sleep"], ["nekos", "yawn"]],
  flojo: [["nekos", "bored"], ["nekos", "sleep"]],
  payaso: [["nekos", "laugh"]],
  troll: [["nekos", "smug"]],
  miedoso: [["otaku", "scared"]],
  valiente: [["nekos", "nod"]],
  comelon: [["nekos", "nom"]],
  grunon: [["nekos", "pout"], ["nekos", "angry"]],
  amargado: [["nekos", "pout"], ["nekos", "angry"]],
  loco: [["nekos", "shocked"]],
  fantasma: [["nekos", "lurk"]],
  guapo: [["nekos", "smile"], ["nekos", "blush"]],
  romantico: [["otaku", "love"], ["nekos", "blush"]],
  tacano: [["nekos", "nope"]],
  intenso: [["nekos", "stare"]],
  tardon: [["nekos", "run"], ["nekos", "bored"]],
  fiestero: [["nekos", "dance"]],
  bromista: [["nekos", "laugh"], ["nekos", "smug"]],
  nerd: [["nekos", "think"]],
  dramatico: [["otaku", "sigh"], ["nekos", "facepalm"]],
  curioso: [["nekos", "think"], ["nekos", "stare"]],
  famoso: [["nekos", "wave"]],
  amistad: [["nekos", "highfive"], ["nekos", "handshake"]],
  rivalidad: [["nekos", "stare"], ["nekos", "punch"]],
  duo: [["nekos", "highfive"]],
  telepatia: [["nekos", "stare"]],
  hermanos: [["nekos", "hug"]],
  complices: [["nekos", "smug"], ["nekos", "wink"]],
  chismeamigos: [["nekos", "lurk"]],
  parejas: [["nekos", "handhold"], ["nekos", "blush"]],
  vs: [["nekos", "punch"]],
  roast: [["nekos", "smug"]],
  halago: [["nekos", "thumbsup"], ["nekos", "happy"]],
  piropo: [["nekos", "wink"]],
  chiste: [["nekos", "laugh"]],
  verdad: [["nekos", "think"]]
};

const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];
const nombreDe = (clave) => String(clave).replace(/^\./, "");

function archivosLocales(clave) {
  const dir = path.join(CARPETA, nombreDe(clave));
  try {
    return fs.readdirSync(dir).filter((f) => EXTENSIONES.test(f)).map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

export const tieneGif = (clave) => Boolean(FUENTES[nombreDe(clave)]) || archivosLocales(clave).length > 0;

function convertirAMp4(entrada) {
  return new Promise((resolve) => {
    const salida = path.join(os.tmpdir(), `broma-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);
    const args = ["-y", "-i", entrada, "-vf", "scale=400:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "veryfast", "-movflags", "faststart", "-an", salida];
    execFile("ffmpeg", args, { timeout: 20000 }, (error) => {
      if (error || !fs.existsSync(salida)) return resolve(null);
      const buffer = fs.readFileSync(salida);
      fs.unlink(salida, () => {});
      resolve(buffer);
    });
  });
}

async function urlDeFuente([proveedor, categoria]) {
  const pedir = async (url) => {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) });
    return res.ok ? res.json() : null;
  };
  try {
    if (proveedor === "nekos") return (await pedir(`https://nekos.best/api/v2/${categoria}`))?.results?.[0]?.url;
    if (proveedor === "otaku") return (await pedir(`https://api.otakugifs.xyz/gif?reaction=${categoria}`))?.url;
    if (proveedor === "waifu") return (await pedir(`https://api.waifu.pics/sfw/${categoria}`))?.url;
  } catch {
    return undefined;
  }
  return undefined;
}

async function descargarATemporal(url) {
  const ruta = path.join(os.tmpdir(), `broma-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.gif`);
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
  if (!res.ok || !res.body) throw new Error("descarga fallida");
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(ruta));
  return ruta;
}

async function desdeLocal(clave) {
  const lista = archivosLocales(clave);
  if (!lista.length) return null;
  const archivo = elegir(lista);
  if (/\.mp4$/i.test(archivo)) return fs.readFileSync(archivo);
  return convertirAMp4(archivo);
}

async function desdeApi(clave) {
  const fuentes = FUENTES[nombreDe(clave)] || [];
  const limite = Date.now() + TIEMPO_MAX_MS;
  for (const fuente of fuentes) {
    if (Date.now() > limite) break;
    const url = await urlDeFuente(fuente);
    if (!url) continue;
    let temporal;
    try {
      temporal = await descargarATemporal(url);
      const buffer = await convertirAMp4(temporal);
      if (buffer) return buffer;
    } catch {
      continue;
    } finally {
      if (temporal) fs.unlink(temporal, () => {});
    }
  }
  return null;
}

export async function conseguirGif(clave) {
  try {
    return (await desdeLocal(clave)) || (await desdeApi(clave));
  } catch {
    return null;
  }
}

import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { descargarATemporal, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "./core.js";
import { prepararVideoEnDisco } from "./video.js";
import { tarjetaAviso, tarjetaError } from "./tarjetas.js";
import { delayAleatorio } from "../../motores/antiban.js";

const execFileAsync = promisify(execFile);

// Un media es { type: "video" | "image", url?, ruta?, caption?, resolver? }:
//  - url: se descarga a disco (nunca a memoria).
//  - ruta: ya está en disco (lo dejó yt-dlp).
//  - resolver: función async que devuelve una lista de medias (se resuelve en el momento de enviarlo).
const DESCARGAS_PARALELAS = 3;
const FALLOS_SEGUIDOS_MAX = 4;

async function descargarHls(url) {
  const salida = path.join(os.tmpdir(), `hls-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`);
  try {
    await execFileAsync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-i", url, "-c", "copy", "-bsf:a", "aac_adtstoasc", salida],
      { timeout: 120000 }
    );
    return salida;
  } catch (e) {
    try { fs.unlinkSync(salida); } catch (err) {}
    throw new Error("No se pudo descargar el video (HLS).");
  }
}

async function obtenerArchivo(media) {
  if (media.ruta) return media.ruta;
  if (/\.m3u8(\?|$)/i.test(media.url)) return descargarHls(media.url);
  return descargarATemporal(media.url, media.type === "video" ? "mp4" : "img");
}

// Deja el media listo para WhatsApp. Devuelve { omitido } si pesa demasiado.
async function prepararMedia(media, limiteMB) {
  let ruta = await obtenerArchivo(media);
  try {
    if (media.type === "video") {
      const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
      if (pesoMB > limiteMB) return { omitido: `pesa ${pesoMB.toFixed(1)} MB` };
      const preparado = await prepararVideoEnDisco(ruta);
      ruta = null; // prepararVideoEnDisco se encarga del archivo original
      return { type: "video", ruta: preparado.ruta, limpiar: preparado.limpiar, caption: media.caption };
    }
    const buffer = await asegurarImagenCompatibleWhatsApp(ruta);
    ruta = null;
    return { type: "image", buffer, caption: media.caption };
  } finally {
    if (ruta && fs.existsSync(ruta)) { try { fs.unlinkSync(ruta); } catch (e) {} }
  }
}

const contenidoMensaje = (p) =>
  p.type === "video"
    ? { video: { url: p.ruta }, mimetype: "video/mp4", ...(p.caption ? { caption: p.caption } : {}) }
    : { image: p.buffer, mimetype: "image/jpeg", ...(p.caption ? { caption: p.caption } : {}) };

const contenidoAlbum = (p) =>
  p.type === "video"
    ? { video: { url: p.ruta }, ...(p.caption ? { caption: p.caption } : {}) }
    : { image: p.buffer, ...(p.caption ? { caption: p.caption } : {}) };

const liberar = (p) => { try { p?.limpiar?.(); } catch (e) {} };

// ───────────────────────── API anterior (se mantiene) ─────────────────────────
export async function enviarMedia(media, reply) {
  const p = await prepararMedia(media, LIMITE_VIDEO_WHATSAPP_MB);
  if (p.omitido) {
    await reply({
      text: tarjetaAviso(
        "ARCHIVO MUY PESADO",
        `El video ${p.omitido} y supera el límite de WhatsApp (${LIMITE_VIDEO_WHATSAPP_MB} MB). Se omitió.`
      )
    });
    return false;
  }
  try {
    return (await reply(contenidoMensaje(p))) || true;
  } finally {
    liberar(p);
  }
}

export async function enviarMedias(medias, reply) {
  let enviados = 0;
  for (const media of medias) {
    try {
      if (await enviarMedia(media, reply)) enviados++;
    } catch (e) {
      await reply({ text: tarjetaError("No se pudo enviar uno de los archivos.", e.message) });
    }
  }
  return enviados;
}

// ───────────────────────── Envío por lotes (búsquedas y carruseles) ─────────────────────────
// Si el socket tiene sendAlbumMessage, manda los archivos como álbum; si no, uno por uno con pausas cortas
// (mandar muchos mensajes seguidos sin pausa es lo que más expone al número a bloqueos).
// opciones: { sock, from, msg, objetivo, limiteMB }
export async function enviarLote(medias, reply, opciones = {}) {
  const { sock, from, msg, objetivo = Infinity, limiteMB = LIMITE_VIDEO_WHATSAPP_MB } = opciones;
  const res = { enviados: 0, omitidos: 0, fallidos: 0, ultimo: null };

  if (medias.some((m) => m.resolver)) {
    await enviarSecuencial(medias, reply, objetivo, limiteMB, res);
  } else {
    await enviarDirectos(medias, reply, { sock, from, msg, objetivo, limiteMB }, res);
  }
  return res;
}

// Todos tienen url o ruta: se descargan de a 3 a la vez y se envían juntos.
async function enviarDirectos(medias, reply, { sock, from, msg, objetivo, limiteMB }, res) {
  const preparados = new Array(medias.length).fill(null);
  let siguiente = 0;
  let exitos = 0;

  const trabajador = async () => {
    while (exitos < objetivo) {
      const i = siguiente++;
      if (i >= medias.length) return;
      try {
        const p = await prepararMedia(medias[i], limiteMB);
        if (p.omitido) { res.omitidos++; continue; }
        preparados[i] = p;
        exitos++;
      } catch (e) {
        res.fallidos++;
        console.log(`[envio] No se pudo preparar un archivo: ${String(e.message).split("\n")[0]}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(DESCARGAS_PARALELAS, medias.length) }, trabajador));

  const listos = preparados.filter(Boolean);
  const aEnviar = listos.slice(0, objetivo);
  for (const sobrante of listos.slice(objetivo)) liberar(sobrante);

  try {
    if (aEnviar.length >= 2 && typeof sock?.sendAlbumMessage === "function") {
      try {
        await sock.sendAlbumMessage(from, aEnviar.map(contenidoAlbum), { quoted: msg });
        res.enviados += aEnviar.length;
        return;
      } catch (e) {
        console.log(`[envio] El álbum falló (${String(e.message).split("\n")[0]}); se envían uno por uno`);
      }
    }

    for (let i = 0; i < aEnviar.length; i++) {
      if (i > 0) await delayAleatorio(500, 1400);
      try {
        res.ultimo = (await reply(contenidoMensaje(aEnviar[i]))) || true;
        res.enviados++;
      } catch (e) {
        res.fallidos++;
        console.log(`[envio] No se pudo enviar un archivo: ${String(e.message).split("\n")[0]}`);
      }
    }
  } finally {
    for (const p of aEnviar) liberar(p);
  }
}

// Hay que resolver cada uno (yt-dlp, uno por uno): se envía cada video apenas está listo, sin esperar a los demás.
async function enviarSecuencial(medias, reply, objetivo, limiteMB, res) {
  let seguidos = 0;

  for (const candidato of medias) {
    if (res.enviados >= objetivo || seguidos >= FALLOS_SEGUIDOS_MAX) break;

    let lista;
    try {
      lista = candidato.resolver ? await candidato.resolver() : [candidato];
    } catch (e) {
      res.fallidos++;
      seguidos++;
      console.log(`[envio] No se pudo resolver un resultado: ${String(e.message).split("\n")[0]}`);
      continue;
    }
    if (!lista?.length) { res.fallidos++; seguidos++; continue; }

    for (const media of lista) {
      if (res.enviados >= objetivo) { // sobrante ya descargado por yt-dlp
        if (media.ruta) { try { fs.unlinkSync(media.ruta); } catch (e) {} }
        continue;
      }
      let p = null;
      try {
        p = await prepararMedia(media, limiteMB);
        if (p.omitido) { res.omitidos++; p = null; continue; }
        if (res.enviados > 0) await delayAleatorio(500, 1400);
        res.ultimo = (await reply(contenidoMensaje(p))) || true;
        res.enviados++;
        seguidos = 0;
      } catch (e) {
        res.fallidos++;
        seguidos++;
        console.log(`[envio] No se pudo enviar un resultado: ${String(e.message).split("\n")[0]}`);
      } finally {
        liberar(p);
      }
    }
  }
}

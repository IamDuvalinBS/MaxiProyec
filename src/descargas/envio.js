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

// Álbum de WhatsApp: un mensaje "álbum" y cada archivo asociado a él (así llegan agrupados, como al mandar varias fotos/videos a mano).
// No depende de sock.sendAlbumMessage; usa las utilidades de Baileys directamente.
async function mandarAlbum(sock, from, contenidos, msg) {
  if (typeof sock?.sendAlbumMessage === "function") return sock.sendAlbumMessage(from, contenidos, { quoted: msg });

  const baileys = await import("@fer2809fl/baileys");
  const crypto = await import("crypto");
  const { generateWAMessageFromContent, generateWAMessage, jidNormalizedUser } = baileys;
  const userJid = jidNormalizedUser(sock.user?.id || sock.authState?.creds?.me?.id || "");

  const album = await generateWAMessageFromContent(from, {
    messageContextInfo: { messageSecret: crypto.randomBytes(32) },
    albumMessage: {
      expectedImageCount: contenidos.filter((a) => "image" in a).length,
      expectedVideoCount: contenidos.filter((a) => "video" in a).length
    }
  }, { quoted: msg, userJid });
  await sock.relayMessage(from, album.message, { messageId: album.key.id });

  for (const item of contenidos) {
    const hijo = await generateWAMessage(from, item, { upload: sock.waUploadToServer, userJid });
    hijo.message.messageContextInfo = {
      messageSecret: crypto.randomBytes(32),
      messageAssociation: { associationType: 1, parentMessageKey: album.key }
    };
    await sock.relayMessage(from, hijo.message, { messageId: hijo.key.id });
  }
  return album;
}

// Envía ya preparados: todos juntos como álbum si son 2 o más; si el álbum falla, uno por uno con pausas cortas.
async function enviarPreparados(aEnviar, reply, { sock, from, msg }, res) {
  try {
    if (aEnviar.length >= 2 && sock && from) {
      try {
        await mandarAlbum(sock, from, aEnviar.map(contenidoAlbum), msg);
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
    await enviarSecuencial(medias, reply, objetivo, limiteMB, res, { sock, from, msg });
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

  await enviarPreparados(aEnviar, reply, { sock, from, msg }, res);
}

// Hay que resolver cada uno (yt-dlp / tikwm, uno por uno): se van preparando y al final se mandan todos juntos.
async function enviarSecuencial(medias, reply, objetivo, limiteMB, res, ctx) {
  let seguidos = 0;
  const listos = [];

  for (const candidato of medias) {
    if (listos.length >= objetivo || seguidos >= FALLOS_SEGUIDOS_MAX) break;

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
      if (listos.length >= objetivo) { // sobrante ya descargado
        if (media.ruta) { try { fs.unlinkSync(media.ruta); } catch (e) {} }
        continue;
      }
      try {
        const p = await prepararMedia(media, limiteMB);
        if (p.omitido) { res.omitidos++; continue; }
        listos.push(p);
        seguidos = 0;
      } catch (e) {
        res.fallidos++;
        seguidos++;
        console.log(`[envio] No se pudo preparar un resultado: ${String(e.message).split("\n")[0]}`);
      }
    }
  }

  await enviarPreparados(listos, reply, ctx, res);
}

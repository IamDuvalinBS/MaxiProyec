import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  descargarATemporal,
  asegurarImagenCompatibleWhatsApp,
  empaquetarEnZip,
  esErrorTransitorio,
  errorAmigable,
  LIMITE_VIDEO_WHATSAPP_MB,
  LIMITE_DOCUMENTO_MB
} from "./core.js";
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
  const urls = (media.urls?.length ? media.urls : [media.url]).filter(Boolean);
  if (!urls.length) throw new Error("El resultado no trae enlace de descarga.");
  if (/\.m3u8(\?|$)/i.test(urls[0])) return descargarHls(urls[0]);
  return descargarATemporal(urls, media.type === "video" ? "mp4" : "img");
}

const borrar = (ruta) => { try { if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta); } catch (e) {} };

// Deja el media listo para WhatsApp.
//  - Video hasta `limiteMB`: se revisa/arregla el formato y va como video normal.
//  - Video más grande: va como .zip (documento), sin preguntar. WhatsApp admite documentos de hasta ~2 GB.
//  - Solo se omite (`omitido`) si ni siquiera como documento cabe.
async function prepararMedia(media, limiteMB) {
  let ruta = await obtenerArchivo(media);
  try {
    if (media.type === "video") {
      const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
      if (pesoMB > LIMITE_DOCUMENTO_MB) return { omitido: `pesa ${pesoMB.toFixed(0)} MB, más de lo que admite WhatsApp como archivo (${LIMITE_DOCUMENTO_MB} MB)` };
      if (pesoMB > limiteMB) {
        console.log(`[envio] Video de ${pesoMB.toFixed(1)} MB (límite de video ${limiteMB} MB): se manda como .zip`);
        const zip = await empaquetarEnZip(ruta, media.titulo || "video");
        return {
          type: "document",
          ruta: zip.ruta,
          nombre: zip.nombre,
          mimetype: "application/zip",
          limpiar: () => borrar(zip.ruta),
          caption: media.caption,
          pesoMB
        };
      }
      const preparado = await prepararVideoEnDisco(ruta);
      ruta = null; // prepararVideoEnDisco se encarga del archivo original
      return { type: "video", ruta: preparado.ruta, limpiar: preparado.limpiar, caption: media.caption, titulo: media.titulo };
    }
    const buffer = await asegurarImagenCompatibleWhatsApp(ruta);
    ruta = null;
    return { type: "image", buffer, caption: media.caption };
  } finally {
    if (ruta) borrar(ruta);
  }
}

const contenidoMensaje = (p) =>
  p.type === "document"
    ? { document: { url: p.ruta }, mimetype: p.mimetype, fileName: p.nombre, ...(p.caption ? { caption: p.caption } : {}) }
    : p.type === "video"
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

// Si WhatsApp tarda en confirmar (408 / "Timed Out") o se corta la conexión mientras sube, se espera y se intenta una vez más.
export async function enviarConReintento(reply, contenido) {
  try {
    return await reply(contenido);
  } catch (e) {
    if (!esErrorTransitorio(e) && !/timed out|time-out|connection closed|rate-overlimit/i.test(String(e?.message))) throw e;
    console.log(`[envio] Falló el envío (${String(e.message).split("\n")[0]}); se reintenta en 5s`);
    await delayAleatorio(4500, 6000);
    return reply(contenido);
  }
}

// Envía un archivo. Si un video no sube (típico en archivos grandes), se prueba como .zip antes de rendirse.
async function enviarUno(p, reply) {
  try {
    return await enviarConReintento(reply, contenidoMensaje(p));
  } catch (e) {
    if (p.type !== "video") throw e;
    console.log(`[envio] El video no subió (${String(e.message).split("\n")[0]}); se prueba como .zip`);
    const zip = await empaquetarEnZip(p.ruta, p.titulo || "video");
    try {
      return await enviarConReintento(reply, contenidoMensaje({ type: "document", ruta: zip.ruta, nombre: zip.nombre, mimetype: "application/zip", caption: p.caption }));
    } catch (e2) {
      throw e;
    } finally {
      borrar(zip.ruta);
    }
  }
}

// Envía ya preparados: fotos/videos juntos como álbum si son 2 o más (si el álbum falla, uno por uno con pausas cortas);
// los documentos (.zip de videos pesados) no pueden ir en álbum: salen aparte, uno por uno.
async function enviarPreparados(aEnviar, reply, { sock, from, msg }, res) {
  const documentos = aEnviar.filter((p) => p.type === "document");
  const visuales = aEnviar.filter((p) => p.type !== "document");
  try {
    let hechosAlbum = false;
    if (visuales.length >= 2 && sock && from) {
      try {
        await mandarAlbum(sock, from, visuales.map(contenidoAlbum), msg);
        res.enviados += visuales.length;
        hechosAlbum = true;
      } catch (e) {
        console.log(`[envio] El álbum falló (${String(e.message).split("\n")[0]}); se envían uno por uno`);
      }
    }
    const individuales = [...(hechosAlbum ? [] : visuales), ...documentos];
    for (let i = 0; i < individuales.length; i++) {
      if (i > 0) await delayAleatorio(500, 1400);
      try {
        res.ultimo = (await enviarUno(individuales[i], reply)) || true;
        res.enviados++;
      } catch (e) {
        res.fallidos++;
        res.ultimoError = errorAmigable(e).message;
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
      text: tarjetaAviso("ARCHIVO MUY PESADO", `El video ${p.omitido}. Se omitió.`)
    });
    return false;
  }
  try {
    return (await enviarUno(p, reply)) || true;
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
  const res = { enviados: 0, omitidos: 0, fallidos: 0, ultimo: null, ultimoError: null };

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

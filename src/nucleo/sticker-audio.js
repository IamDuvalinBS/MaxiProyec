// Stickers con audio (función BETA de WhatsApp) para el comando ".saudio" (también ".s2" y ".s audio").
//
// WhatsApp los manda como Message.audioStickerMessage (campo 134 del protobuf), que es un
// FutureProofMessage con un stickerMessage dentro, y ese stickerMessage lleva el audio en el
// campo 26 (audioMessage). Baileys todavía no conoce esos campos, así que se escriben a mano
// en el protobuf (ver instalarParche) y se manda con relayMessage.
//
// La beta oficial de WhatsApp habla de 10 s (estático) y 5 s (animado), pero en la práctica otros bots
// mandan stickers más largos. Para cambiar el máximo, edita MAX_SEG_AUDIO.
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { conLimite } from "./limitador.js";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import {
  extraerMediaDeMensaje,
  crearSticker,
  contextoMeta,
  esStickerAnimado,
  desenvolverVistaUnica,
  claveMeta
} from "./sticker.js";
import { ERROR_PREMIUM, MENSAJE_PREMIUM } from "./premium.js";

const MAX_SEG_AUDIO = 30; // segundos máximos de audio (y de animación) del sticker
const MAX_BYTES_STICKER = 1000 * 1000; // WhatsApp rechaza stickers animados de más de ~1 MB
const ESPERA_MS = 3 * 60 * 1000;
const MAX_PENDIENTES = 20;
const ALIAS = new Set(["audio", "sonido", "sound"]);

const USO = [
  "🎧 *STICKER CON AUDIO* (función beta de WhatsApp)",
  "",
  `• Responde a un *video* con *.saudio* → sticker animado con el audio del video (máx. ${MAX_SEG_AUDIO} s).`,
  `• Responde a una *imagen o sticker* con *.saudio* y después responde a un *audio o nota de voz* con *.saudio* (máx. ${MAX_SEG_AUDIO} s).`,
  "• O envía la imagen/video con el texto *.saudio* respondiendo a un audio.",
  "",
  "> Solo se escucha en los celulares que ya tienen la función beta de WhatsApp."
].join("\n");

// Imagen/sticker/video que está esperando su audio: `${chat}|${usuario}` → { buffer, ts }
const pendientes = new Map();

function limpiarPendientes() {
  const ahora = Date.now();
  for (const [clave, p] of pendientes) if (ahora - p.ts > ESPERA_MS) pendientes.delete(clave);
  while (pendientes.size > MAX_PENDIENTES) pendientes.delete(pendientes.keys().next().value);
}

export function esSubcomandoAudio(cleanText) {
  const sub = (String(cleanText || "").trim().split(/\s+/)[1] || "").toLowerCase();
  return ALIAS.has(sub);
}

function esVideo(buffer) {
  if (!buffer || buffer.length < 12) return false;
  if (buffer.toString("ascii", 0, 4) === "GIF8") return true;
  if (buffer.toString("ascii", 4, 8) === "ftyp") return true;
  return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
}

// ───────────── ffmpeg ─────────────
function correrFfmpeg(args) {
  return conLimite("ligero", () => new Promise((resolve, reject) => {
    execFile("ffmpeg", args, { timeout: 240000 }, (error, _salida, errores) => {
      if (!error) return resolve();
      if (error.code === "ENOENT") return reject(new Error("ffmpeg no está instalado"));
      reject(new Error(String(errores || error.message).trim().split("\n").slice(-2).join(" ")));
    });
  }));
}

function duracionDe(archivo) {
  return new Promise((resolve) => {
    execFile(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", archivo],
      { timeout: 20000 },
      (error, salida) => resolve(error ? 0 : Number.parseFloat(String(salida)) || 0)
    );
  });
}

async function conTemporal(fn) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "saudio-"));
  try {
    return await fn(dir);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

const FORMATOS_AUDIO = [
  { ext: "ogg", mimetype: "audio/ogg; codecs=opus", args: ["-c:a", "libopus", "-b:a", "48k", "-ar", "48000", "-ac", "1", "-f", "ogg"] },
  { ext: "m4a", mimetype: "audio/mp4", args: ["-c:a", "aac", "-b:a", "64k", "-ar", "44100", "-ac", "1", "-f", "ipod"] }
];

// Saca el audio de cualquier audio/video, lo recorta a `maxSeg` y lo deja en opus (o aac si no hay libopus).
async function prepararAudio(buffer, maxSeg) {
  return conTemporal(async (dir) => {
    const entrada = path.join(dir, "entrada");
    await fs.promises.writeFile(entrada, buffer);
    let ultimoError = null;
    for (const formato of FORMATOS_AUDIO) {
      const salida = path.join(dir, `salida.${formato.ext}`);
      try {
        await correrFfmpeg([
          "-nostdin", "-y", "-v", "error",
          "-i", entrada,
          "-vn",
          "-t", String(maxSeg),
          ...formato.args,
          salida
        ]);
        const datos = await fs.promises.readFile(salida);
        if (!datos.length) throw new Error("audio vacío");
        const real = await duracionDe(salida);
        const seconds = Math.max(1, Math.ceil(Math.min(maxSeg, real || maxSeg)));
        return { buffer: datos, mimetype: formato.mimetype, seconds };
      } catch (e) {
        if (/ffmpeg no está instalado/.test(e.message)) throw e;
        ultimoError = e;
      }
    }
    throw ultimoError;
  });
}

// Convierte el video a WebP animado de `segundos` y va bajando fps/calidad hasta que quepa en ~1 MB
// (los stickers largos pesan más). El sonido va aparte, dentro del sticker.
const AJUSTES_LARGO = [
  { fps: 15, calidad: 50 },
  { fps: 12, calidad: 40 },
  { fps: 10, calidad: 32 },
  { fps: 8, calidad: 25 },
  { fps: 6, calidad: 18 },
  { fps: 5, calidad: 12 },
  { fps: 4, calidad: 8 }
];
const SALTO_PESO = 2 * 1000 * 1000; // si pesa más del doble del límite, salta un escalón
const ENCODERS_WEBP = ["libwebp_anim", "libwebp"];
let encoderWebp = null;

async function videoAWebpLargo(buffer, segundos) {
  return conTemporal(async (dir) => {
    const entrada = path.join(dir, "entrada");
    const salida = path.join(dir, "salida.webp");
    await fs.promises.writeFile(entrada, buffer);
    let resultado = null;
    // Los videos largos casi nunca caben con la calidad alta: se empieza más abajo para no re-codificar de más.
    const inicio = segundos <= 8 ? 0 : segundos <= 15 ? 1 : segundos <= 22 ? 2 : 3;
    for (let i = inicio; i < AJUSTES_LARGO.length; i++) {
      const ajuste = AJUSTES_LARGO[i];
      const filtro = [
        `fps=${ajuste.fps}`,
        "scale=512:512:force_original_aspect_ratio=decrease:flags=bicubic",
        "format=rgba",
        "pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0"
      ].join(",");
      let ok = false;
      let ultimoError = null;
      for (const encoder of encoderWebp ? [encoderWebp] : ENCODERS_WEBP) {
        try {
          await correrFfmpeg([
            "-nostdin", "-y", "-v", "error",
            "-t", String(segundos),
            "-i", entrada,
            "-vf", filtro,
            "-an",
            "-c:v", encoder,
            "-lossless", "0",
            "-q:v", String(ajuste.calidad),
            "-compression_level", "2",
            "-loop", "0",
            salida
          ]);
          encoderWebp = encoder;
          ok = true;
          break;
        } catch (e) {
          ultimoError = e;
        }
      }
      if (!ok) throw ultimoError;
      resultado = await fs.promises.readFile(salida);
      if (resultado.length <= MAX_BYTES_STICKER) return resultado;
      if (resultado.length > SALTO_PESO && i + 2 < AJUSTES_LARGO.length) i++;
    }
    throw new Error("El video es demasiado pesado para un sticker, prueba con uno más corto");
  });
}

// ───────────── Protobuf a mano ─────────────
const CLAVE_CRUDA = "__sonidoSticker";

function varint(n) {
  const bytes = [];
  while (n > 127) {
    bytes.push((n % 128) | 128);
    n = Math.floor(n / 128);
  }
  bytes.push(n);
  return Buffer.from(bytes);
}

// Campo de tipo "bytes/mensaje" (wire type 2) con número `num`.
const campo = (num, datos) => Buffer.concat([varint(num * 8 + 2), varint(datos.length), datos]);

// Hace que proto.Message.encode agregue el campo 134 (audioStickerMessage) cuando el mensaje lo trae.
function instalarParche(proto) {
  const Mensaje = proto?.Message;
  if (!Mensaje || typeof Mensaje.encode !== "function") throw new Error("La librería no expone proto.Message");
  if (Mensaje.__parcheSonidoSticker) return;
  const original = Mensaje.encode;
  Mensaje.encode = function (mensaje, escritor) {
    const w = original.call(this, mensaje, escritor);
    const crudo = mensaje && mensaje[CLAVE_CRUDA];
    if (crudo && crudo.length) w.uint32(134 * 8 + 2).bytes(crudo);
    return w;
  };
  Mensaje.__parcheSonidoSticker = true;
}

let libCache = null;

async function cargarLib() {
  if (libCache) return libCache;
  const mod = await import("@fer2809fl/baileys");
  libCache = mod.default && typeof mod.default === "object" ? { ...mod, ...mod.default } : mod;
  return libCache;
}

async function enviarStickerConAudio({ sock, from, msg, sticker, audio }) {
  const lib = await cargarLib();
  const faltan = ["prepareWAMessageMedia", "generateWAMessageFromContent"].filter((n) => typeof lib?.[n] !== "function");
  if (faltan.length || !lib.proto?.Message?.StickerMessage || !lib.proto?.Message?.AudioMessage) {
    throw new Error("La librería instalada no soporta stickers con audio");
  }
  if (typeof sock.waUploadToServer !== "function") throw new Error("El socket no puede subir archivos");
  instalarParche(lib.proto);

  const subida = { upload: sock.waUploadToServer };

  // El sticker y el audio se suben a la vez (antes uno esperaba al otro).
  const [subidoSticker, subidoAudio] = await Promise.all([
    lib.prepareWAMessageMedia({ sticker }, subida),
    lib.prepareWAMessageMedia({ audio: audio.buffer, mimetype: audio.mimetype, seconds: audio.seconds, ptt: false }, subida)
  ]);
  const stickerMsg = subidoSticker.stickerMessage;
  if (!stickerMsg) throw new Error("No se pudo subir el sticker");
  stickerMsg.isAnimated = esStickerAnimado(sticker);

  const audioMsg = subidoAudio.audioMessage;
  if (!audioMsg) throw new Error("No se pudo subir el audio");

  // Armamos el mensaje normal con sticker (así la librería agrega la respuesta/cita) y luego lo cambiamos.
  const armado = lib.generateWAMessageFromContent(
    from,
    { stickerMessage: stickerMsg },
    { userJid: sock.user?.id || sock.user?.jid, quoted: msg }
  );
  const mensaje = armado.message;
  const stickerConCita = mensaje.stickerMessage || stickerMsg;
  delete mensaje.stickerMessage;

  const stickerBytes = Buffer.concat([
    Buffer.from(lib.proto.Message.StickerMessage.encode(stickerConCita).finish()),
    campo(26, Buffer.from(lib.proto.Message.AudioMessage.encode(audioMsg).finish()))
  ]);
  // Message { stickerMessage = 26 } dentro de FutureProofMessage { message = 1 }
  mensaje[CLAVE_CRUDA] = campo(1, campo(26, stickerBytes));

  await sock.relayMessage(from, mensaje, { messageId: armado.key.id });
}

// ───────────── Comando ─────────────
async function descargarAudioCitado(msg) {
  const m = desenvolverVistaUnica(msg.message) || {};
  const ctx = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || m.videoMessage?.contextInfo;
  const citado = desenvolverVistaUnica(ctx?.quotedMessage);
  if (!citado?.audioMessage) return null;
  const objetivo = {
    key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant },
    message: citado
  };
  return downloadMediaMessage(objetivo, "buffer", {});
}

export async function stickerConAudio({ sock, from, sender, msg, reply }) {
  limpiarPendientes();
  const clave = `${from}|${claveMeta(sender)}`;

  try {
    // El audio y la imagen/video se descargan a la vez; los errores se revisan en el mismo orden de siempre.
    const [resAudio, resMedia] = await Promise.all([
      descargarAudioCitado(msg).then((v) => ({ v }), (e) => ({ e })),
      extraerMediaDeMensaje(msg, sender).then((v) => ({ v }), (e) => ({ e }))
    ]);

    if (resAudio.e) {
      console.log("❌ [s audio] No se pudo descargar el audio: " + resAudio.e.message);
      await reply({ text: "❌ No se pudo descargar ese audio. Intenta enviarlo nuevamente." });
      return;
    }
    const audioCrudo = resAudio.v;

    if (resMedia.e) {
      if (resMedia.e.message === ERROR_PREMIUM) {
        await reply({ text: MENSAJE_PREMIUM });
        return;
      }
      console.log("❌ [s audio] No se pudo descargar la imagen/video: " + resMedia.e.message);
      await reply({ text: "❌ No se pudo descargar el archivo. Intenta enviarlo nuevamente." });
      return;
    }
    let media = resMedia.v;

    // Respondió a un audio sin mandar imagen: usamos la que dejó esperando.
    if (!media && audioCrudo) {
      const espera = pendientes.get(clave);
      if (espera) media = { buffer: espera.buffer };
    }
    if (!media) {
      await reply({ text: audioCrudo ? "🖼️ Primero responde a una imagen, sticker o video con *.saudio* y luego responde al audio.\n\n" + USO : USO });
      return;
    }

    const visual = media.buffer;
    const esVid = esVideo(visual);
    const animado = esVid || esStickerAnimado(visual);
    const maxSeg = MAX_SEG_AUDIO;

    let audio = null;
    if (audioCrudo) {
      audio = await prepararAudio(audioCrudo, maxSeg);
    } else if (esVid) {
      try {
        audio = await prepararAudio(visual, maxSeg);
      } catch (e) {
        if (/ffmpeg no está instalado/.test(e.message)) throw e;
        audio = null; // el video no trae audio
      }
    }

    if (!audio) {
      pendientes.set(clave, { buffer: visual, ts: Date.now() });
      await reply({
        text: esVid
          ? `🔇 Ese video no tiene audio. Guardé el video: ahora responde a un *audio o nota de voz* con *.saudio* (máx. ${MAX_SEG_AUDIO} s). Tienes 3 minutos.`
          : `🎧 Guardé tu ${animado ? "sticker animado" : "imagen o sticker"}. Ahora responde a un *audio o nota de voz* con *.saudio* (máx. ${maxSeg} s). Tienes 3 minutos.`
      });
      return;
    }

    // La animación dura lo mismo que el audio (si es más corta, se repite).
    // El contexto del sticker (nombre, grupo) se prepara mientras se convierte el video.
    const contextoPromesa = contextoMeta({ sock, from, sender, msg });
    contextoPromesa.catch(() => {});
    const visualFinal = esVid ? await videoAWebpLargo(visual, audio.seconds) : visual;
    const contexto = await contextoPromesa;
    const sticker = await crearSticker(visualFinal, sender, contexto);

    try {
      await enviarStickerConAudio({ sock, from, msg, sticker, audio });
      console.log(`✅ [s audio] Sticker con audio enviado (${audio.seconds}s, ${audio.mimetype})`);
    } catch (e) {
      console.log("❌ [s audio] Falló el envío con audio: " + (e.stack || e.message));
      await sock.sendMessage(from, { sticker, isAnimated: esStickerAnimado(sticker) }, { quoted: msg });
      await reply({ text: "⚠️ No se pudo adjuntar el audio (función beta de WhatsApp). Te mandé el sticker sin audio." });
    }
    pendientes.delete(clave);
  } catch (e) {
    console.log("❌ [s audio] Error: " + (e.stack || e.message));
    await reply({ text: `❌ No se pudo crear el sticker con audio. ${e.message || ""}`.trim() });
  }
}

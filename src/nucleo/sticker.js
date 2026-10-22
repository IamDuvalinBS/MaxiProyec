import { createCanvas, loadImage } from "@napi-rs/canvas";
import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import { getStickerMeta, config } from "../../motores/db.js";
import { getProfile } from "../../motores/profile.js";
import { esGrupo, metadatos } from "../grupos/nucleo.js";

const META_PACK = "MaxiBots";
const META_AUTOR_FIJO = "MaxiBot";
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const SANGRIA = "⠀";
const LIMITE_ANIMADO = 500 * 1024;
const LIMITE_MAXIMO = 1024 * 1024;
const EMOJIS_PAQUETE = ["😀", "😂", "😍", "🔥", "👍", "🎉", "😎", "🤩", "💯", "🥳"];

export const MAX_SEGUNDOS_STICKER = 10;

export async function descargarBuffer(url) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar`);
  return Buffer.from(await res.arrayBuffer());
}

const ENVOLTURAS = ["viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "ephemeralMessage"];

export function desenvolverVistaUnica(message) {
  let m = message;
  for (let i = 0; i < 4 && m; i++) {
    const clave = ENVOLTURAS.find((k) => m[k]);
    if (!clave) break;
    m = m[clave].message;
  }
  return m || null;
}

export async function extraerMediaDeMensaje(msg) {
  const m = desenvolverVistaUnica(msg.message) || {};
  const ctx = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo || m.videoMessage?.contextInfo;
  const citado = desenvolverVistaUnica(ctx?.quotedMessage);

  let objetivo = null;
  let contenido = null;
  if (m.imageMessage || m.videoMessage) {
    objetivo = { key: msg.key, message: m };
    contenido = m.imageMessage || m.videoMessage;
  } else if (citado?.imageMessage || citado?.videoMessage || citado?.stickerMessage) {
    objetivo = {
      key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant },
      message: citado
    };
    contenido = citado.imageMessage || citado.videoMessage || citado.stickerMessage;
  }
  if (!objetivo) return null;

  const buffer = await downloadMediaMessage(objetivo, "buffer", {});
  return { buffer, segundos: Number(contenido.seconds) || 0 };
}

export async function extraerImagenDeMensaje(msg) {
  const media = await extraerMediaDeMensaje(msg);
  return media ? media.buffer : null;
}

const recortar = (texto, max) => {
  const limpio = String(texto || "").replace(/\s+/g, " ").trim();
  const letras = [...limpio];
  return letras.length > max ? letras.slice(0, max - 1).join("") + "…" : limpio;
};

export function metaPredeterminada({ nombre = "", grupo = null, miembros = null, bot = "" } = {}) {
  const sg = (n) => SANGRIA.repeat(n);
  const pack = [
    "📡 𝗕𝘆 𝗠𝗮𝗺𝗯𝗼 P𝗿𝗼𝘆𝗲𝗰.",
    `${sg(2)}⤷  🐋 𝗨𝘀𝗲𝗿:@${nombre}`
  ].join("\n");
  const autor = [
    "✨ IᑎᖴO ᘜᖇᑌᑭO ✨:",
    "",
    `⭈⚡ ᑎᥲmᥱ: ${grupo || "Chat privado"}`,
    `${sg(3)}⤷ 🧸 ᑌsᥱrs: ${miembros ?? 2}`,
    `${sg(6)}⤷ 📌 ᗷ᥆𝗍 ᑭrіᥒᥴі⍴ᥲᥣ: ${bot || config.botNameShort}`,
    "",
    "❤マンボ ❤"
  ].join("\n");
  return { pack, autor };
}

export async function contextoMeta({ sock, from, sender, msg }) {
  const perfil = getProfile(sender);
  const contexto = {
    nombre: recortar(perfil.name || msg?.pushName, 24) || claveMeta(sender),
    bot: recortar(config.botNameShort, 24),
    grupo: null,
    miembros: null
  };

  if (esGrupo(from)) {
    try {
      const meta = await metadatos(sock, from);
      if (meta) {
        contexto.grupo = recortar(meta.asunto, 28) || null;
        contexto.miembros = meta.participantes.length;
      }
    } catch (e) {}
  }
  return contexto;
}

function esWebp(buffer) {
  return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
}

function esWebpAnimado(buffer) {
  if (!esWebp(buffer)) return false;
  let o = 12;
  while (o + 8 <= buffer.length) {
    const tipo = buffer.toString("ascii", o, o + 4);
    const tam = buffer.readUInt32LE(o + 4);
    if (tipo === "VP8X" && buffer[o + 8] & 0x02) return true;
    if (tipo === "ANIM" || tipo === "ANMF") return true;
    o += 8 + tam + (tam % 2);
  }
  return false;
}

export const esStickerAnimado = esWebpAnimado;

function tipoDeMedia(buffer) {
  if (buffer.length < 12) return "imagen";
  if (esWebp(buffer)) return esWebpAnimado(buffer) ? "webp-animado" : "imagen";
  if (buffer.toString("ascii", 0, 4) === "GIF8") return "gif";
  const esMp4 = buffer.toString("ascii", 4, 8) === "ftyp";
  const esWebm = buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  return esMp4 || esWebm ? "video" : "imagen";
}

function exifSticker(pack, autor) {
  const json = Buffer.from(
    JSON.stringify({
      "sticker-pack-id": crypto.randomBytes(16).toString("hex"),
      "sticker-pack-name": pack,
      "sticker-pack-publisher": autor,
      emojis: ["🌱"]
    }),
    "utf8"
  );
  const cabecera = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ]);
  const exif = Buffer.concat([cabecera, json]);
  exif.writeUInt32LE(json.length, 14);
  return exif;
}

function chunk(tipo, datos) {
  const cab = Buffer.alloc(8);
  cab.write(tipo, 0, "ascii");
  cab.writeUInt32LE(datos.length, 4);
  return Buffer.concat([cab, datos, datos.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
}

function sinMetadatos(cuerpo) {
  const partes = [];
  let o = 0;
  while (o + 8 <= cuerpo.length) {
    const tipo = cuerpo.toString("ascii", o, o + 4);
    const tam = cuerpo.readUInt32LE(o + 4);
    const fin = Math.min(o + 8 + tam + (tam % 2), cuerpo.length);
    if (tipo !== "EXIF" && tipo !== "XMP ") partes.push(cuerpo.subarray(o, fin));
    o = fin;
  }
  return Buffer.concat(partes);
}

function conExif(webp, pack, autor) {
  if (!esWebp(webp)) {
    throw new Error("El resultado no es un WebP valido");
  }
  let cuerpo = sinMetadatos(webp.subarray(12));
  if (cuerpo.toString("ascii", 0, 4) === "VP8X") {
    cuerpo[8] |= 0x08;
    cuerpo[8] &= ~0x04;
  } else {

    const vp8x = Buffer.alloc(10);
    vp8x[0] = 0x18;
    vp8x.writeUIntLE(511, 4, 3);
    vp8x.writeUIntLE(511, 7, 3);
    cuerpo = Buffer.concat([chunk("VP8X", vp8x), cuerpo]);
  }
  const todo = Buffer.concat([cuerpo, chunk("EXIF", exifSticker(pack, autor))]);
  const cab = Buffer.alloc(12);
  cab.write("RIFF", 0, "ascii");
  cab.writeUInt32LE(todo.length + 4, 4);
  cab.write("WEBP", 8, "ascii");
  return Buffer.concat([cab, todo]);
}

async function aWebp512(buffer) {
  const img = await loadImage(buffer);
  const lienzo = createCanvas(512, 512);
  const ctx = lienzo.getContext("2d");
  const escala = Math.min(512 / img.width, 512 / img.height);
  const w = Math.max(1, Math.round(img.width * escala));
  const h = Math.max(1, Math.round(img.height * escala));
  ctx.drawImage(img, Math.round((512 - w) / 2), Math.round((512 - h) / 2), w, h);
  return Buffer.from(await lienzo.encode("webp", 80));
}

const AJUSTES_ANIMADO = [
  { fps: 15, calidad: 60, segundos: 8 },
  { fps: 12, calidad: 45, segundos: 8 },
  { fps: 10, calidad: 35, segundos: 6 },
  { fps: 8, calidad: 25, segundos: 5 }
];
const ENCODERS_WEBP = ["libwebp_anim", "libwebp"];
let encoderWebp = null;

function correrFfmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", args, { timeout: 90000 }, (error, _salida, errores) => {
      if (!error) return resolve();
      if (error.code === "ENOENT") return reject(new Error("ffmpeg no está instalado"));
      const detalle = String(errores || error.message).trim().split("\n").slice(-2).join(" ");
      reject(new Error(detalle));
    });
  });
}

function convertirAnimado(entrada, salida, ajuste, encoder) {
  const filtro = [
    `fps=${ajuste.fps}`,
    "scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos",
    "format=rgba",
    "pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0"
  ].join(",");
  return correrFfmpeg([
    "-nostdin", "-y", "-v", "error",
    "-t", String(ajuste.segundos),
    "-i", entrada,
    "-vf", filtro,
    "-an",
    "-c:v", encoder,
    "-lossless", "0",
    "-q:v", String(ajuste.calidad),
    "-compression_level", "4",
    "-loop", "0",
    salida
  ]);
}

async function aWebpAnimado(buffer) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "sticker-"));
  const entrada = path.join(dir, "entrada");
  const salida = path.join(dir, "salida.webp");
  try {
    await fs.promises.writeFile(entrada, buffer);

    let resultado = null;
    for (const ajuste of AJUSTES_ANIMADO) {
      let convertido = false;
      let ultimoError = null;
      for (const encoder of encoderWebp ? [encoderWebp] : ENCODERS_WEBP) {
        try {
          await convertirAnimado(entrada, salida, ajuste, encoder);
          encoderWebp = encoder;
          convertido = true;
          break;
        } catch (e) {
          ultimoError = e;
        }
      }
      if (!convertido) throw ultimoError;

      resultado = await fs.promises.readFile(salida);
      if (resultado.length <= LIMITE_ANIMADO) break;
    }

    if (resultado.length > LIMITE_MAXIMO) {
      throw new Error("El sticker animado pesa demasiado, prueba con uno más corto");
    }
    return resultado;
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function crearStickerConMeta(buffer, pack, autor) {
  const tipo = tipoDeMedia(buffer);

  if (tipo === "gif" || tipo === "video") {
    return conExif(await aWebpAnimado(buffer), pack, autor);
  }
  if (tipo === "webp-animado") {
    if (buffer.length > LIMITE_MAXIMO) throw new Error("El sticker animado pesa más de 1MB");
    return conExif(buffer, pack, autor);
  }
  return conExif(await aWebp512(buffer), pack, autor);
}

export async function crearSticker(buffer, sender, contexto = {}) {
  const meta = getStickerMeta(claveMeta(sender)) || getStickerMeta(sender);
  const predeterminado = metaPredeterminada({ ...contexto, nombre: contexto.nombre || claveMeta(sender) });
  return crearStickerConMeta(buffer, meta?.pack || predeterminado.pack, meta?.author || predeterminado.autor);
}

export async function crearStickerConMetaFijo(buffer) {
  return crearStickerConMeta(buffer, META_PACK, META_AUTOR_FIJO);
}

export async function buscarStickersTenor(query, limite = 10) {
  const slug = encodeURIComponent(String(query).trim().toLowerCase().replace(/\s+/g, "-"));
  const res = await fetch(`https://tenor.com/search/${slug}-stickers`, {
    headers: { "user-agent": UA, "accept-language": "es,en;q=0.8" }
  });
  if (!res.ok) throw new Error(`Tenor respondio HTTP ${res.status}`);
  const html = (await res.text()).replace(/\\u002F/g, "/").replace(/\\\//g, "/");

  const vistos = new Set();
  for (const m of html.matchAll(/https:\/\/media\.tenor\.com\/[^"'\s\\<>)]+?\.(?:gif|webp)/g)) {
    // saltamos miniaturas / previews chicos
    if (/\/(?:tinygif|nanogif|mini|preview)/i.test(m[0])) continue;
    vistos.add(m[0]);
    if (vistos.size >= limite) break;
  }
  return [...vistos];
}

export function claveMeta(sender) {
  return String(sender || "").split("@")[0].split(":")[0];
}

const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

function crc32(datos) {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function crearZip(entradas) {
  const locales = [];
  const centrales = [];
  let desplazamiento = 0;

  for (const { nombre, datos } of entradas) {
    const nombreBuf = Buffer.from(nombre, "utf8");
    const crc = crc32(datos);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(datos.length, 18);
    local.writeUInt32LE(datos.length, 22);
    local.writeUInt16LE(nombreBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locales.push(local, nombreBuf, datos);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(datos.length, 20);
    central.writeUInt32LE(datos.length, 24);
    central.writeUInt16LE(nombreBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(desplazamiento, 42);
    centrales.push(central, nombreBuf);

    desplazamiento += 30 + nombreBuf.length + datos.length;
  }

  const directorio = Buffer.concat(centrales);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(entradas.length, 8);
  fin.writeUInt16LE(entradas.length, 10);
  fin.writeUInt32LE(directorio.length, 12);
  fin.writeUInt32LE(desplazamiento, 16);
  fin.writeUInt16LE(0, 20);
  return Buffer.concat([...locales, directorio, fin]);
}

async function miniaturaPaquete(stickers) {
  const lienzo = createCanvas(252, 252);
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 252, 252);

  const celda = 120;
  const hueco = 4;
  const muestra = stickers.slice(0, 4);
  for (let i = 0; i < muestra.length; i++) {
    const img = await loadImage(muestra[i]);
    const x = hueco + (i % 2) * (celda + hueco);
    const y = hueco + Math.floor(i / 2) * (celda + hueco);
    const escala = Math.min(celda / img.width, celda / img.height);
    const w = img.width * escala;
    const h = img.height * escala;
    ctx.drawImage(img, x + (celda - w) / 2, y + (celda - h) / 2, w, h);
  }
  return Buffer.from(await lienzo.encode("jpeg", 85));
}

let bailleysCache;

async function cargarBaileys() {
  if (bailleysCache !== undefined) return bailleysCache;
  try {
    const mod = await import("@fer2809fl/baileys");
    bailleysCache = mod.default && typeof mod.default === "object" ? { ...mod, ...mod.default } : mod;
  } catch (e) {
    bailleysCache = null;
  }
  return bailleysCache;
}

export async function enviarPaqueteStickers({ sock, from, msg, nombre, publisher, descripcion = "", stickers }) {
  const lib = await cargarBaileys();
  const faltan = ["encryptedStream", "generateWAMessageFromContent", "generateMessageIDV2"].filter(
    (n) => typeof lib?.[n] !== "function"
  );
  if (!lib || faltan.length || !lib.proto?.Message?.StickerPackMessage) {
    throw new Error("La librería instalada no soporta paquetes de stickers");
  }
  if (typeof sock.waUploadToServer !== "function") {
    throw new Error("El socket no puede subir archivos");
  }

  const idPaquete = lib.generateMessageIDV2();
  const entradas = [];
  const nombresUsados = new Set();
  const lista = stickers.map((datos, i) => {
    const hash = crypto.createHash("sha256").update(datos).digest("base64").replace(/\//g, "-");
    const fileName = `${hash}.webp`;
    if (!nombresUsados.has(fileName)) {
      nombresUsados.add(fileName);
      entradas.push({ nombre: fileName, datos });
    }
    return {
      fileName,
      mimetype: "image/webp",
      isAnimated: esWebpAnimado(datos),
      emojis: [EMOJIS_PAQUETE[i % EMOJIS_PAQUETE.length]],
      accessibilityLabel: ""
    };
  });

  const icono = `${idPaquete}.webp`;
  entradas.push({ nombre: icono, datos: stickers[0] });
  const zip = crearZip(entradas);

  const subida = await lib.encryptedStream(zip, "sticker-pack", {});
  const resultado = await sock.waUploadToServer(subida.encWriteStream, {
    fileEncSha256B64: subida.fileEncSha256.toString("base64"),
    mediaType: "sticker-pack",
    timeoutMs: 120000
  });
  if (!resultado?.directPath) throw new Error("WhatsApp no devolvió la ruta del paquete");

  const paquete = {
    name: nombre,
    publisher,
    stickerPackId: idPaquete,
    packDescription: descripcion,
    stickerPackOrigin: lib.proto.Message.StickerPackMessage.StickerPackOrigin.THIRD_PARTY,
    stickerPackSize: zip.length,
    stickers: lista,
    fileSha256: subida.fileSha256,
    fileEncSha256: subida.fileEncSha256,
    mediaKey: subida.mediaKey,
    directPath: resultado.directPath,
    fileLength: subida.fileLength,
    mediaKeyTimestamp: Math.floor(Date.now() / 1000),
    trayIconFileName: icono
  };

  try {
    const miniatura = await miniaturaPaquete(stickers);
    const subidaMini = await lib.encryptedStream(miniatura, "thumbnail-sticker-pack", { mediaKey: subida.mediaKey });
    if (Buffer.compare(Buffer.from(subidaMini.mediaKey), Buffer.from(subida.mediaKey)) !== 0) {
      throw new Error("la librería no reutilizó la clave del paquete");
    }
    const resultadoMini = await sock.waUploadToServer(subidaMini.encWriteStream, {
      fileEncSha256B64: subidaMini.fileEncSha256.toString("base64"),
      mediaType: "thumbnail-sticker-pack",
      timeoutMs: 60000
    });
    if (!resultadoMini?.directPath) throw new Error("sin ruta de miniatura");
    Object.assign(paquete, {
      thumbnailDirectPath: resultadoMini.directPath,
      thumbnailSha256: subidaMini.fileSha256,
      thumbnailEncSha256: subidaMini.fileEncSha256,
      thumbnailHeight: 252,
      thumbnailWidth: 252,
      imageDataHash: crypto.createHash("sha256").update(miniatura).digest("base64")
    });
  } catch (e) {
    console.log("[spack] El paquete se manda sin miniatura: " + e.message);
  }

  const armado = lib.generateWAMessageFromContent(
    from,
    { stickerPackMessage: paquete },
    { userJid: sock.user?.id || sock.user?.jid, quoted: msg }
  );
  await sock.relayMessage(from, armado.message, { messageId: armado.key.id });
}

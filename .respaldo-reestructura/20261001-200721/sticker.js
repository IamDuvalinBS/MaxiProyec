

import { createCanvas, loadImage } from "@napi-rs/canvas";
import crypto from "crypto";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import { getStickerMeta } from "./motores/db.js";

const META_PACK = "MaxiBots";
const META_AUTOR_FIJO = "MaxiBot";
const UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";

export async function descargarBuffer(url) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar`);
  return Buffer.from(await res.arrayBuffer());
}

export async function extraerImagenDeMensaje(msg) {
  const m = msg.message || {};
  const ctx = m.extendedTextMessage?.contextInfo || m.imageMessage?.contextInfo;
  const citado = ctx?.quotedMessage;

  let objetivo = null;
  if (m.imageMessage) {
    objetivo = msg;
  } else if (citado?.imageMessage || citado?.stickerMessage) {
    objetivo = {
      key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant },
      message: citado
    };
  }
  if (!objetivo) return null;
  return downloadMediaMessage(objetivo, "buffer", {});
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

function conExif(webp, pack, autor) {
  if (webp.toString("ascii", 0, 4) !== "RIFF" || webp.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("El resultado no es un WebP valido");
  }
  let cuerpo = webp.subarray(12);
  if (cuerpo.toString("ascii", 0, 4) === "VP8X") {
    cuerpo = Buffer.from(cuerpo);
    cuerpo[8] |= 0x08;
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

export async function crearStickerConMeta(buffer, pack, autor) {
  return conExif(await aWebp512(buffer), pack, autor);
}

export async function crearSticker(buffer, sender) {
  const meta = getStickerMeta(sender);
  const pack = meta?.pack || META_PACK;
  const autor = meta?.author || "@" + String(sender).split("@")[0].split(":")[0];
  return crearStickerConMeta(buffer, pack, autor);
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

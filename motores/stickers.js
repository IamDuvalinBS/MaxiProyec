// Motor de STICKERS - logica compartida que usan los comandos de la carpeta
// /stickers (.spack, .setmeta, .s). No define comandos, solo funciones.
import { Sticker } from "wa-sticker-formatter";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { getStickerMeta } from "./db.js";

// Pon tu API key gratuita de GIPHY en la variable de entorno GIPHY_API_KEY.
// Se consigue en: https://developers.giphy.com/ (Create an App > API, no SDK).
// El valor de abajo es tu key actual como fallback si no defines la variable
// de entorno - conviene mover la key a GIPHY_API_KEY antes de compartir este
// codigo o subirlo a un repo publico.
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || "4YSFu6IejYe7t5rOeag97cELBe9Ggoga";

const PACK_DEFAULT = "MaxiBots";
function authorDefaultDe(sender) {
  return "@" + sender.split("@")[0];
}

// Busca hasta `limit` stickers en GIPHY. Pide el rendition "original" en
// formato webp (el que GIPHY recomienda para stickers, ya que soporta
// transparencia), con fallback a "fixed_height" si el original no trae webp.
export async function buscarStickersGiphy(query, limit = 10) {
  if (!GIPHY_API_KEY) {
    throw new Error("Falta configurar GIPHY_API_KEY (variable de entorno).");
  }

  const url =
    `https://api.giphy.com/v1/stickers/search?api_key=${GIPHY_API_KEY}` +
    `&q=${encodeURIComponent(query)}&limit=${limit}&rating=pg-13`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`GIPHY respondio con estado ${res.status}`);
  const data = await res.json();

  const urls = [];
  for (const item of data.data || []) {
    const formato = item.images?.original?.webp || item.images?.fixed_height?.webp;
    if (formato) urls.push(formato);
  }
  return urls.slice(0, limit);
}

// Alias para no romper los otros archivos (.spack, .s) si todavia importan
// el nombre viejo "buscarStickersTenor". Conviene actualizar esos imports a
// "buscarStickersGiphy" cuando puedas y despues borrar esta linea.
export const buscarStickersTenor = buscarStickersGiphy;

export async function descargarBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar el archivo (estado ${res.status})`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Crea un sticker a partir de un buffer de imagen, usando el meta que el
// usuario haya configurado con .setmeta - o el default si no configuro nada.
// Usado por .s / .sticker.
export async function crearSticker(buffer, sender) {
  const metaGuardado = getStickerMeta(sender);
  const pack = metaGuardado?.pack || PACK_DEFAULT;
  const author = metaGuardado?.author || authorDefaultDe(sender);

  const sticker = new Sticker(buffer, {
    pack,
    author,
    type: "full",
    quality: 70
  });

  return sticker.toBuffer();
}

// Crea un sticker con un meta FIJO (no el del usuario) - usado por .spack,
// que siempre manda con el meta por defecto del bot sin importar quien pidio
// la busqueda.
export async function crearStickerConMetaFijo(buffer, pack = PACK_DEFAULT, author = "@MaxiBots") {
  const sticker = new Sticker(buffer, { pack, author, type: "full", quality: 70 });
  return sticker.toBuffer();
}

// Descarga la imagen citada (o la que trae el propio mensaje como caption).
// Devuelve un Buffer, o null si el mensaje no tiene ninguna imagen.
export async function extraerImagenDeMensaje(msg) {
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imageMsg = msg.message?.imageMessage || quoted?.imageMessage;
  if (!imageMsg) return null;

  const stream = await downloadContentFromMessage(imageMsg, "image");
  let buffer = Buffer.from([]);
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk]);
  }
  return buffer;
}


// Reconoce los stickers CON AUDIO que llegan de otros (función beta de WhatsApp).
//
// WhatsApp los manda como Message.audioStickerMessage (campo 134 del protobuf), que es un FutureProofMessage
// con un stickerMessage dentro (campo 26). Baileys no conoce ese campo y lo descarta al leer el mensaje, así
// que el bot veía un mensaje vacío y nunca ejecutaba el sticker de acción (.s tag, .s cerrar, etc.).
//
// Este parche engancha proto.Message.decode, saca el stickerMessage de ese campo y lo deja en
// mensaje.stickerMessage, igual que un sticker normal. Con eso todo lo demás (stickers de acción, .s tag,
// .s eliminar, reacciones, etc.) funciona sin tocar nada más. Se instala solo al importar este archivo.
import * as baileys from "@fer2809fl/baileys";

const CAMPO_AUDIO_STICKER = 134; // Message.audioStickerMessage (FutureProofMessage)
const CAMPO_MENSAJE = 1;         // FutureProofMessage.message
const CAMPO_STICKER = 26;        // Message.stickerMessage (dentro del mensaje anterior)

function varint(buf, pos) {
  let valor = 0;
  let factor = 1;
  for (let i = 0; i < 10; i++) {
    if (pos >= buf.length) return null;
    const b = buf[pos++];
    valor += (b & 0x7f) * factor;
    if (!(b & 0x80)) return [valor, pos];
    factor *= 128;
  }
  return null;
}

// Busca el primer campo `num` (tipo bytes/mensaje) a nivel raíz de buf[pos..fin] y devuelve su contenido.
function buscarCampo(buf, pos, fin, num) {
  while (pos < fin) {
    const t = varint(buf, pos);
    if (!t) return null;
    const [tag, siguiente] = t;
    pos = siguiente;
    const campo = Math.floor(tag / 8);
    const tipo = tag % 8;
    if (tipo === 0) {
      const v = varint(buf, pos);
      if (!v) return null;
      pos = v[1];
    } else if (tipo === 1) pos += 8;
    else if (tipo === 5) pos += 4;
    else if (tipo === 2) {
      const l = varint(buf, pos);
      if (!l) return null;
      const [largo, inicio] = l;
      if (inicio + largo > fin) return null;
      if (campo === num) return buf.subarray(inicio, inicio + largo);
      pos = inicio + largo;
    } else return null;
  }
  return null;
}

// `lector` puede ser un Uint8Array/Buffer o un Reader de protobufjs; `largo` es opcional.
function sacarStickerCrudo(lector, largo) {
  let buf, inicio, fin;
  if (lector instanceof Uint8Array) {
    buf = lector;
    inicio = 0;
    fin = largo === undefined ? lector.length : Math.min(lector.length, largo);
  } else if (lector && lector.buf) {
    buf = lector.buf;
    inicio = lector.pos;
    fin = largo === undefined ? lector.len : Math.min(lector.len, inicio + largo);
  } else return null;

  const futuro = buscarCampo(buf, inicio, fin, CAMPO_AUDIO_STICKER);
  if (!futuro) return null;
  const mensaje = buscarCampo(futuro, 0, futuro.length, CAMPO_MENSAJE);
  if (!mensaje) return null;
  return buscarCampo(mensaje, 0, mensaje.length, CAMPO_STICKER);
}

function instalar() {
  const lib = baileys.default && typeof baileys.default === "object" ? { ...baileys, ...baileys.default } : baileys;
  const Mensaje = lib?.proto?.Message;
  const Sticker = Mensaje?.StickerMessage;
  if (!Mensaje || typeof Mensaje.decode !== "function" || !Sticker) {
    console.log("⚠️ No se pudo activar el reconocimiento de stickers con audio (la librería no expone proto.Message).");
    return;
  }
  if (Mensaje.__parcheRecibirStickerAudio) return;
  const original = Mensaje.decode;
  Mensaje.decode = function (lector, largo) {
    let crudo = null;
    try {
      crudo = sacarStickerCrudo(lector, largo);
    } catch {}
    const mensaje = original.call(this, lector, largo);
    if (crudo && mensaje && !mensaje.stickerMessage) {
      try {
        mensaje.stickerMessage = Sticker.decode(crudo);
      } catch {}
    }
    return mensaje;
  };
  Mensaje.__parcheRecibirStickerAudio = true;
}

instalar();

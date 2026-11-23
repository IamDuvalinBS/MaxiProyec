import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Binary } from "mongodb";
import { obtenerBase } from "./db.js";

// ─────────────────────────────────────────────────────────────
//  STICKER-REACCIONES
//  Los owners ligan un sticker a un comando (.setreact .ping, respondiendo a un sticker).
//  Cada vez que alguien usa ese comando, el bot "reacciona" al mensaje con ese sticker.
//  Se guarda en data/sticker-reacciones.json y, si hay conexión, también en MongoDB (colección "sticker_reacciones").
// ─────────────────────────────────────────────────────────────

const COLECCION = "sticker_reacciones";
const LIMITE_BYTES = 1024 * 1024;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "sticker-reacciones.json");

const mapa = new Map(); // ".ping" -> Buffer (webp)
let mongoCargado = false;

try {
  if (fs.existsSync(ARCHIVO)) {
    for (const [comando, base64] of Object.entries(JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) || {})) {
      mapa.set(comando, Buffer.from(base64, "base64"));
    }
  }
} catch (e) {
  console.log(`❌ No se pudieron leer los sticker-reacciones: ${e.message}`);
}

function guardarLocal() {
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const objeto = Object.fromEntries([...mapa].map(([comando, buffer]) => [comando, buffer.toString("base64")]));
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(objeto));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudieron guardar los sticker-reacciones: ${e.message}`);
  }
}

const coleccion = () => {
  const base = obtenerBase();
  return base ? base.collection(COLECCION) : null;
};

// Trae lo que haya en MongoDB (una sola vez, cuando la conexión ya existe) sin pisar lo local.
async function cargarDeMongo() {
  if (mongoCargado) return;
  const col = coleccion();
  if (!col) return;
  mongoCargado = true;
  try {
    let nuevos = false;
    for (const doc of await col.find({}).toArray()) {
      const datos = doc.sticker?.buffer;
      if (datos && !mapa.has(doc._id)) {
        mapa.set(doc._id, Buffer.from(datos));
        nuevos = true;
      }
    }
    if (nuevos) guardarLocal();
  } catch (e) {
    mongoCargado = false;
    console.log(`❌ No se pudieron leer los sticker-reacciones de MongoDB: ${e.message}`);
  }
}

// ".Ping" / "ping" / "!ping" -> ".ping"
export function normalizarComando(texto) {
  const limpio = String(texto || "").trim().toLowerCase().split(/\s+/)[0].replace(/^[.!#]+/, "");
  return limpio ? `.${limpio}` : "";
}

// Devuelve true si MongoDB confirmó el guardado.
export async function fijarStickerReaccion(comando, buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error("El sticker llegó vacío");
  if (buffer.length > LIMITE_BYTES) throw new Error("Ese sticker pesa más de 1MB");
  mapa.set(comando, buffer);
  guardarLocal();
  const col = coleccion();
  if (!col) return false;
  try {
    await col.replaceOne({ _id: comando }, { _id: comando, sticker: new Binary(buffer) }, { upsert: true });
    return true;
  } catch (e) {
    console.log(`❌ No se pudo guardar el sticker-reacción en MongoDB: ${e.message}`);
    return false;
  }
}

// Devuelve { quitado, mongo }.
export async function quitarStickerReaccion(comando) {
  const quitado = mapa.delete(comando);
  if (quitado) guardarLocal();
  const col = coleccion();
  if (!col) return { quitado, mongo: false };
  try {
    await col.deleteOne({ _id: comando });
    return { quitado, mongo: true };
  } catch (e) {
    console.log(`❌ No se pudo quitar el sticker-reacción de MongoDB: ${e.message}`);
    return { quitado, mongo: false };
  }
}

export async function listarStickerReacciones() {
  await cargarDeMongo();
  return [...mapa.keys()].sort();
}

// Lo llama el despachador de comandos antes de ejecutar cada comando (ya con el nombre principal).
// OJO: ningún Baileys público trae todavía la reacción con sticker nativa de WhatsApp (ReactionMessage solo tiene
// key/text/groupingKey/senderTimestampMs), así que por ahora el sticker se manda respondiendo al mensaje del usuario.
// Cuando se tenga el formato real, solo hay que cambiar el sock.sendMessage de esta función.
export async function reaccionarConSticker(sock, from, msg, comando) {
  try {
    if (!comando || msg?.paginaChat) return;
    await cargarDeMongo();
    const sticker = mapa.get(comando);
    if (!sticker) return;
    await sock.sendMessage(from, { sticker }, { quoted: msg });
  } catch (e) {
    console.log(`[sticker-reaccion] No se pudo mandar el sticker de ${comando}: ${e.message}`);
  }
}

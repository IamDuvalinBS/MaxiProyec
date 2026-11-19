import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { obtenerBase } from "../../motores/db.js";
import { isOwner } from "../../motores/owner.js";
import { numeroDe } from "../grupos/nucleo.js";
import { desenvolverVistaUnica } from "./sticker.js";
import { normalizarHuella } from "./sticker-acciones.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "stickers-premium.json");
const COLECCION = "stickers_premium";
const CATEGORIAS_PROTEGIDAS = new Set(["Stickers"]);
const COMANDOS_PROTEGIDOS = new Set([".hd"]);

let duenos = {};

try {
  if (fs.existsSync(ARCHIVO)) duenos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) || {};
} catch (e) {
  console.log(`❌ No se pudo leer los stickers premium: ${e.message}`);
  duenos = {};
}

function guardarLocal() {
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(duenos));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudo guardar los stickers premium: ${e.message}`);
  }
}

function coleccion() {
  const base = obtenerBase();
  return base ? base.collection(COLECCION) : null;
}

function guardarEnMongo(huella) {
  const col = coleccion();
  if (!col) return;
  col
    .replaceOne({ _id: huella }, { _id: huella, duenos: duenos[huella] }, { upsert: true })
    .catch((e) => console.log(`❌ No se pudo guardar el sticker premium en MongoDB: ${e.message}`));
}

async function cargarDesdeMongo() {
  for (let i = 0; i < 30 && !coleccion(); i++) await new Promise((r) => setTimeout(r, 1000));
  const col = coleccion();
  if (!col) return;
  try {
    const docs = await col.find({}).toArray();
    const remotos = new Set();
    for (const { _id, duenos: lista } of docs) {
      remotos.add(_id);
      const union = [...new Set([...(duenos[_id] || []), ...(lista || [])])];
      const cambio = union.length !== (lista || []).length;
      duenos[_id] = union;
      if (cambio) guardarEnMongo(_id);
    }
    for (const huella of Object.keys(duenos)) if (!remotos.has(huella)) guardarEnMongo(huella);
    guardarLocal();
  } catch (e) {
    console.log(`❌ No se pudieron cargar los stickers premium desde MongoDB: ${e.message}`);
  }
}

cargarDesdeMongo();

export function registrarPremium(stickerMessage, sender) {
  const huella = normalizarHuella(stickerMessage?.fileSha256);
  if (!huella) return false;
  const numero = numeroDe(sender);
  const lista = duenos[huella] || (duenos[huella] = []);
  if (!lista.includes(numero)) lista.push(numero);
  guardarLocal();
  guardarEnMongo(huella);
  return true;
}

export function puedeUsarSticker(stickerMessage, sender) {
  const huella = normalizarHuella(stickerMessage?.fileSha256);
  const lista = huella && duenos[huella];
  if (!lista?.length) return true;
  return lista.includes(numeroDe(sender)) || isOwner(sender);
}

export function stickerPremiumBloqueado({ msg, sender, comando, categoria }) {
  if (!CATEGORIAS_PROTEGIDAS.has(categoria) && !COMANDOS_PROTEGIDOS.has(comando)) return false;
  const base = desenvolverVistaUnica(msg.message) || {};
  const ctx = base.extendedTextMessage?.contextInfo || base.imageMessage?.contextInfo || base.videoMessage?.contextInfo;
  const citado = desenvolverVistaUnica(ctx?.quotedMessage);
  if (!citado?.stickerMessage) return false;
  return !puedeUsarSticker(citado.stickerMessage, sender);
}

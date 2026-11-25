import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

// ─────────────────────────────────────────────────────────────
//  PACKS DE STICKERS PROPIOS
//  Cada usuario puede crear packs (vacíos al inicio) con su meta (nombre del pack + autor).
//  Al agregar un sticker, el bot le pone automáticamente el meta del pack.
//  Se guardan en data/packs-stickers.json (stickers en base64).
// ─────────────────────────────────────────────────────────────

export const MAX_PACKS = 20;
export const MAX_STICKERS = 30;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "packs-stickers.json");

// { usuario: { clavePack: { nombre, pack, autor, stickers: [Buffer] } } }
const datos = new Map();

try {
  if (fs.existsSync(ARCHIVO)) {
    for (const [usuario, packs] of Object.entries(JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) || {})) {
      const mapa = new Map();
      for (const [clave, p] of Object.entries(packs)) {
        mapa.set(clave, { ...p, stickers: (p.stickers || []).map((b64) => Buffer.from(b64, "base64")) });
      }
      datos.set(usuario, mapa);
    }
  }
} catch (e) {
  console.log(`❌ No se pudieron leer los packs de stickers: ${e.message}`);
}

function guardar() {
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const objeto = {};
    for (const [usuario, mapa] of datos) {
      if (!mapa.size) continue;
      objeto[usuario] = Object.fromEntries(
        [...mapa].map(([clave, p]) => [clave, { ...p, stickers: p.stickers.map((b) => b.toString("base64")) }])
      );
    }
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(objeto));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudieron guardar los packs de stickers: ${e.message}`);
  }
}

export const claveDePack = (nombre) => String(nombre || "").replace(/\s+/g, " ").trim().toLowerCase();
const packsDe = (usuario) => datos.get(usuario) || datos.set(usuario, new Map()).get(usuario);
const hash = (buffer) => crypto.createHash("sha1").update(buffer).digest("hex");

export const obtenerPack = (usuario, nombre) => datos.get(usuario)?.get(claveDePack(nombre)) || null;
export const listarPacks = (usuario) => [...(datos.get(usuario)?.values() || [])];

export function crearPack(usuario, nombre, pack, autor) {
  const clave = claveDePack(nombre);
  const mapa = packsDe(usuario);
  if (mapa.has(clave)) return { error: "Ya tienes un pack con ese nombre." };
  if (mapa.size >= MAX_PACKS) return { error: `Llegaste al máximo de ${MAX_PACKS} packs.` };
  const nuevo = { id: crypto.randomBytes(8).toString("hex").toUpperCase(), nombre: nombre.replace(/\s+/g, " ").trim(), pack, autor, stickers: [] };
  mapa.set(clave, nuevo);
  guardar();
  return { pack: nuevo };
}

// Id fijo del pack para que, al volver a mandarlo, WhatsApp lo reconozca como el mismo pack.
export function idDePack(p) {
  if (!p.id) {
    p.id = crypto.randomBytes(8).toString("hex").toUpperCase();
    guardar();
  }
  return p.id;
}

export function borrarPack(usuario, nombre) {
  const quitado = datos.get(usuario)?.delete(claveDePack(nombre)) || false;
  if (quitado) guardar();
  return quitado;
}

// El sticker ya debe venir con el meta del pack puesto. Devuelve "agregado" | "repetido" | "lleno".
export function agregarSticker(usuario, nombre, sticker) {
  const p = obtenerPack(usuario, nombre);
  if (!p) return "no-existe";
  if (p.stickers.length >= MAX_STICKERS) return "lleno";
  if (p.stickers.some((s) => hash(s) === hash(sticker))) return "repetido";
  p.stickers.push(sticker);
  guardar();
  return "agregado";
}

// Cambia el meta del pack y deja que quien llama re-estampe sus stickers (reestampar: buffer -> buffer).
export async function cambiarMeta(usuario, nombre, pack, autor, reestampar) {
  const p = obtenerPack(usuario, nombre);
  if (!p) return null;
  const nuevos = [];
  for (const s of p.stickers) nuevos.push(await reestampar(s, pack, autor));
  p.pack = pack;
  p.autor = autor;
  p.stickers = nuevos;
  guardar();
  return p;
}

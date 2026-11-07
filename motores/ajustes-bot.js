import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AsyncLocalStorage } from "async_hooks";
import { Binary } from "mongodb";
import { config, saveConfig, obtenerBase, FOTO_PATH } from "./db.js";

// ─────────────────────────────────────────────────────────────
//  AJUSTES POR BOT (el principal y cada subbot tienen los suyos)
//  Moneda, foto del menú, nombres, enlaces y baneos propios.
//  Todo se guarda en MongoDB (colección "bot_ajustes") y tiene una copia local de respaldo.
//
//  El bot "principal" conserva sus nombres y enlaces en `config` (como siempre);
//  los subbots guardan los suyos aquí y, si no personalizan algo, heredan el valor del principal.
// ─────────────────────────────────────────────────────────────

export const PRINCIPAL = "principal";
const COLECCION = "bot_ajustes";
const CLAVES_CONFIG = new Set(["botNameShort", "botNameLong", "ownerName", "channelLink", "groupLink", "webLink"]);

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "ajustes-bot.json");
const DIRECTORIO_FOTOS = path.join(DIRECTORIO, "fotos-bot");

// ── Contexto: qué bot está ejecutando el comando (lo fija el despachador de comandos) ──
const contexto = new AsyncLocalStorage();
export const correrComoBot = (botId, funcion) => contexto.run({ botId: botId || PRINCIPAL }, funcion);
export const botActual = () => contexto.getStore()?.botId || PRINCIPAL;

// ── Estado en memoria ──
let ajustes = {};
const fotos = new Map();

const archivoFoto = (id) => path.join(DIRECTORIO_FOTOS, `${String(id).replace(/[^\w-]/g, "_")}.jpg`);

try {
  if (fs.existsSync(ARCHIVO)) ajustes = JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) || {};
} catch (e) {
  console.log(`❌ No se pudieron leer los ajustes de los bots: ${e.message}`);
  ajustes = {};
}
try {
  for (const id of Object.keys(ajustes)) {
    const ruta = archivoFoto(id);
    if (fs.existsSync(ruta)) fotos.set(id, fs.readFileSync(ruta));
  }
} catch {}

function guardarLocal() {
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(ajustes));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudieron guardar los ajustes de los bots: ${e.message}`);
  }
}

function guardarFotoLocal(id, buffer) {
  try {
    fs.mkdirSync(DIRECTORIO_FOTOS, { recursive: true });
    if (buffer) fs.writeFileSync(archivoFoto(id), buffer);
    else fs.rmSync(archivoFoto(id), { force: true });
  } catch (e) {
    console.log(`❌ No se pudo guardar la foto local del bot ${id}: ${e.message}`);
  }
}

// ── MongoDB ──
const coleccion = () => {
  const base = obtenerBase();
  return base ? base.collection(COLECCION) : null;
};

function aBuffer(binario) {
  if (!binario) return null;
  if (Buffer.isBuffer(binario)) return binario;
  try {
    const largo = typeof binario.length === "function" ? binario.length() : binario.buffer.length;
    return Buffer.from(binario.buffer.subarray(0, largo));
  } catch {
    return null;
  }
}

// Devuelve true si MongoDB confirmó el guardado.
async function persistir(id) {
  guardarLocal();
  const col = coleccion();
  if (!col) return false;
  try {
    const entrada = ajustes[id];
    const foto = fotos.get(id);
    if ((!entrada || !Object.keys(entrada).length) && !foto) {
      await col.deleteOne({ _id: id });
    } else {
      await col.replaceOne({ _id: id }, { _id: id, ...(entrada || {}), ...(foto ? { foto: new Binary(foto) } : {}) }, { upsert: true });
    }
    return true;
  } catch (e) {
    console.log(`❌ No se pudieron guardar los ajustes del bot ${id} en MongoDB: ${e.message}`);
    return false;
  }
}

// Carga los ajustes desde MongoDB. Mongo manda; lo que solo exista en el archivo local se sube.
export async function cargarAjustesBot() {
  for (let i = 0; i < 30 && !coleccion(); i++) await new Promise((r) => setTimeout(r, 1000));
  const col = coleccion();
  if (!col) return console.log("⚠️ MongoDB no disponible: los ajustes de los bots quedan solo en el archivo local.");
  try {
    const docs = await col.find({}).toArray();
    const remotos = {};
    const fotosRemotas = new Set();
    for (const { _id, foto, ...resto } of docs) {
      remotos[_id] = resto;
      const buffer = aBuffer(foto);
      if (buffer) {
        fotos.set(_id, buffer);
        fotosRemotas.add(_id);
        guardarFotoLocal(_id, buffer);
      }
    }
    const subir = new Set(Object.keys(ajustes).filter((id) => !(id in remotos)));
    for (const id of fotos.keys()) if (!fotosRemotas.has(id)) subir.add(id);
    ajustes = { ...ajustes, ...remotos };
    guardarLocal();
    for (const id of subir) await persistir(id);
    console.log(`✅ Ajustes de los bots cargados desde MongoDB: ${docs.length} (subidos: ${subir.size})`);
  } catch (e) {
    console.log(`❌ No se pudieron cargar los ajustes de los bots desde MongoDB: ${e.message}`);
  }
}

// ── Lectura ──
const vacio = (v) => v === undefined || v === null || v === "";

export function ajusteBot(clave, botId = botActual()) {
  if (botId === PRINCIPAL) {
    return CLAVES_CONFIG.has(clave) ? config[clave] : ajustes[PRINCIPAL]?.[clave];
  }
  const propio = ajustes[botId]?.[clave];
  if (!vacio(propio)) return propio;
  if (CLAVES_CONFIG.has(clave)) return config[clave];
  if (clave === "moneda") return ajustes[PRINCIPAL]?.moneda;
  return undefined;
}

// ¿Este valor lo personalizó el bot (en vez de heredarlo del principal)?
export function esPropio(clave, botId = botActual()) {
  if (botId === PRINCIPAL) return !vacio(ajusteBot(clave, botId));
  return !vacio(ajustes[botId]?.[clave]);
}

function leerFotoPrincipalLocal() {
  try {
    return fs.existsSync(FOTO_PATH) ? fs.readFileSync(FOTO_PATH) : null;
  } catch {
    return null;
  }
}

export function fotoBot(botId = botActual()) {
  if (fotos.has(botId)) return fotos.get(botId);
  if (botId !== PRINCIPAL && fotos.has(PRINCIPAL)) return fotos.get(PRINCIPAL);
  return leerFotoPrincipalLocal();
}

export const fotoEsPropia = (botId = botActual()) => fotos.has(botId);

// ── Escritura ──
// Devuelve { aplicado, mongo }: "aplicado" es false si no había nada que cambiar (p. ej. restablecer un nombre del principal).
export async function fijarAjusteBot(botId, clave, valor) {
  const quitar = vacio(valor);
  if (botId === PRINCIPAL && CLAVES_CONFIG.has(clave)) {
    if (quitar) return { aplicado: false, mongo: true };
    config[clave] = valor;
    await saveConfig();
    return { aplicado: true, mongo: Boolean(obtenerBase()) };
  }
  const entrada = ajustes[botId] || (ajustes[botId] = {});
  if (quitar) delete entrada[clave];
  else entrada[clave] = valor;
  if (!Object.keys(entrada).length && !fotos.has(botId)) delete ajustes[botId];
  return { aplicado: true, mongo: await persistir(botId) };
}

export async function fijarFotoBot(botId, buffer) {
  fotos.set(botId, buffer);
  if (!ajustes[botId]) ajustes[botId] = {};
  guardarFotoLocal(botId, buffer);
  return persistir(botId);
}

export async function quitarFotoBot(botId) {
  if (!fotos.has(botId)) return { aplicado: false, mongo: true };
  fotos.delete(botId);
  guardarFotoLocal(botId, null);
  if (ajustes[botId] && !Object.keys(ajustes[botId]).length) delete ajustes[botId];
  return { aplicado: true, mongo: await persistir(botId) };
}

// Reduce la imagen (máx. 1024 px, JPEG) para que pese poco en MongoDB. Devuelve null si no se pudo usar.
export async function prepararFoto(buffer) {
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");
    const imagen = await loadImage(buffer);
    const escala = Math.min(1, 1024 / Math.max(imagen.width, imagen.height));
    const ancho = Math.max(1, Math.round(imagen.width * escala));
    const alto = Math.max(1, Math.round(imagen.height * escala));
    const lienzo = createCanvas(ancho, alto);
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(imagen, 0, 0, ancho, alto);
    return lienzo.toBuffer("image/jpeg", 88);
  } catch {
    return buffer.length <= 8 * 1024 * 1024 ? buffer : null;
  }
}

// Borra todo lo personalizado de un subbot (nombres, moneda, enlaces, foto y baneos propios).
export async function restablecerBot(botId) {
  if (botId === PRINCIPAL) return { aplicado: false, mongo: true };
  const habia = Boolean(ajustes[botId]) || fotos.has(botId);
  delete ajustes[botId];
  fotos.delete(botId);
  guardarFotoLocal(botId, null);
  return { aplicado: habia, mongo: await persistir(botId) };
}

// ── Baneos propios de un subbot (no afectan al bot principal ni a otros subbots) ──
const CLAVE_BANEO = { comando: "baneComandos", categoria: "baneCategorias" };

export function listarBaneosBot(botId = botActual()) {
  const entrada = ajustes[botId] || {};
  return { comandos: [...(entrada.baneComandos || [])], categorias: [...(entrada.baneCategorias || [])] };
}

export function baneadoEnBot(comando, categoria, botId = botActual()) {
  const entrada = ajustes[botId];
  if (!entrada) return false;
  if (entrada.baneComandos?.includes(String(comando).toLowerCase())) return true;
  return Boolean(categoria && entrada.baneCategorias?.includes(String(categoria).toLowerCase()));
}

// tipo: "comando" | "categoria"; valores: lista de nombres; activar: true = banear, false = desbanear.
export async function cambiarBaneoBot(botId, tipo, valores, activar) {
  const clave = CLAVE_BANEO[tipo];
  const entrada = ajustes[botId] || (ajustes[botId] = {});
  const lista = new Set(entrada[clave] || []);
  for (const v of [].concat(valores)) {
    const nombre = String(v).toLowerCase();
    if (activar) lista.add(nombre);
    else lista.delete(nombre);
  }
  if (lista.size) entrada[clave] = [...lista];
  else delete entrada[clave];
  if (!Object.keys(entrada).length && !fotos.has(botId)) delete ajustes[botId];
  return persistir(botId);
}

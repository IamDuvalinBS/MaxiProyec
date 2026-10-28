import crypto from "crypto";
import { obtenerBase } from "./db.js";

// ─────────────────────────────────────────────────────────────
//  RÉCORDS DE JUEGOS HTML  (colección "juegos_records")
//  Un solo documento por persona y juego/modo:
//    { _id: "juego:uid", juego, uid, nombre, score, t }
//  NO se guarda historial de partidas, solo el mejor resultado.
// ─────────────────────────────────────────────────────────────

const COLECCION = "juegos_records";
const VIGENCIA_MS = 12 * 60 * 60 * 1000; // el pase del juego dura 12 h
const CACHE_MS = 45 * 1000;

// menor:true → gana el número más bajo (golf).  valida(score, secs) → true si es creíble.
export const JUEGOS = {
  colorrush: { nombre: "Color Rush", menor: false, valida: (p, s) => p > 0 && p <= 150 + 60 * s + 30 * s * s },
  gusanos: { nombre: "Gusanos Neón", menor: false, valida: (p, s) => p >= 100 && p <= 400 + 1500 * s },
  minigolf: { nombre: "Mini Golf", menor: true, valida: (p, s) => p >= 18 && p <= 180 && s >= 60 },
  bolos10: { nombre: "Bolos (10 cuadros)", menor: false, valida: (p, s) => p >= 1 && p <= 300 && s >= 15 },
  bolos5: { nombre: "Bolos (5 cuadros)", menor: false, valida: (p, s) => p >= 1 && p <= 150 && s >= 8 },
  snake0: { nombre: "Snake Fruits · Clásico", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  snake1: { nombre: "Snake Fruits · Festival", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  snake2: { nombre: "Snake Fruits · Caos", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  snake3: { nombre: "Snake Fruits · Supervivencia", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  uno: { nombre: "UNO (mejor victoria)", menor: false, valida: (p, s) => p >= 1 && p <= 1000 && s >= 8 },
  dino: { nombre: "Dino Runner", menor: false, valida: (p, s) => p >= 10 && p <= 50 + 60 * s && s >= 3 },
  pou: { nombre: "Pou Penales", menor: false, valida: (p, s) => p >= 1 && p <= 2 + 1.4 * s && s >= 3 }
};

// ── Pase firmado ─────────────────────────────────────────────
// El pase (token) lleva dentro quién abrió el juego y cuándo, cifrado y autenticado (AES-GCM).
// Así el récord se guarda a nombre de quien abrió el juego aunque el mensaje lo envíe otro
// identificador (grupo/privado, LID/teléfono) y sin exponer el número en el HTML.
const secreto = () => process.env.JUEGOS_SECRET || process.env.MONGO_URI || "maxiproyec-juegos";
const llave = () => crypto.createHash("sha256").update(secreto()).digest();

export function firmar(juego, uid, t) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", llave(), iv, { authTagLength: 8 });
  c.setAAD(Buffer.from(String(juego)));
  const datos = Buffer.concat([c.update(`${uid}|${t}`, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), datos]).toString("base64url");
}

function abrirPase(juego, token) {
  try {
    const b = Buffer.from(String(token || ""), "base64url");
    if (b.length < 22) return null;
    const d = crypto.createDecipheriv("aes-256-gcm", llave(), b.subarray(0, 12), { authTagLength: 8 });
    d.setAAD(Buffer.from(String(juego)));
    d.setAuthTag(b.subarray(12, 20));
    const txt = Buffer.concat([d.update(b.subarray(20)), d.final()]).toString("utf8");
    const i = txt.lastIndexOf("|");
    const t = Number(txt.slice(i + 1));
    if (i < 1 || !Number.isFinite(t)) return null;
    return { uid: txt.slice(0, i), t };
  } catch {
    return null;
  }
}

export const limpiarNombre = (n) =>
  String(n || "Jugador").replace(/[\u0000-\u001f<>"`\\]/g, "").trim().slice(0, 18) || "Jugador";

let indiceCreado = false;
function coleccion() {
  const base = obtenerBase();
  if (!base) return null;
  const c = base.collection(COLECCION);
  if (!indiceCreado) {
    indiceCreado = true;
    c.createIndex({ juego: 1, score: 1 }).catch(() => {});
  }
  return c;
}

export function baseLista() {
  return !!obtenerBase();
}

const cacheTop = new Map();
const cacheRank = new Map();

export async function recordDe(juego, uid) {
  try {
    const c = coleccion();
    if (!c) return 0;
    const doc = await c.findOne({ _id: `${juego}:${uid}` }, { projection: { score: 1 } });
    return doc?.score || 0;
  } catch {
    return 0;
  }
}

// [[nombre, score], ...] de los mejores (máximo n)
export async function topDe(juego, n = 5) {
  const hit = cacheTop.get(juego);
  if (hit && Date.now() - hit.t < CACHE_MS) return hit.datos;
  try {
    const c = coleccion();
    if (!c || !JUEGOS[juego]) return [];
    const filas = await c.find({ juego }, { projection: { nombre: 1, score: 1 } })
      .sort({ score: JUEGOS[juego].menor ? 1 : -1 })
      .limit(n)
      .toArray();
    const datos = filas.map((f) => [limpiarNombre(f.nombre), f.score]);
    cacheTop.set(juego, { t: Date.now(), datos });
    return datos;
  } catch {
    return [];
  }
}

// Ranking de "mejores jugadores": junta todos los modos del juego (ids) y ordena por puntos de
// posición (30 por el 1.º, 29 por el 2.º...). Devuelve [{n, s:{id:score}, d:díasDesdeSuRécord, m:1 si eres tú}]
export async function rankingDe(ids, n = 10, uidActual = "") {
  const clave = ids.join(",");
  let base;
  const hit = cacheRank.get(clave);
  if (hit && Date.now() - hit.t < CACHE_MS) base = hit.filas;
  else {
    base = [];
    try {
      const c = coleccion();
      if (c) {
        const por = new Map();
        for (const id of ids) {
          const def = JUEGOS[id];
          if (!def) continue;
          const filas = await c.find({ juego: id }, { projection: { uid: 1, nombre: 1, score: 1, t: 1 } })
            .sort({ score: def.menor ? 1 : -1 })
            .limit(30)
            .toArray();
          filas.forEach((f, pos) => {
            let r = por.get(f.uid);
            if (!r) por.set(f.uid, (r = { uid: f.uid, n: limpiarNombre(f.nombre), s: {}, pts: 0, t: 0 }));
            r.s[id] = f.score;
            r.pts += 30 - pos;
            r.t = Math.max(r.t, f.t || 0);
          });
        }
        base = [...por.values()].sort((a, b) => b.pts - a.pts).slice(0, 30);
      }
    } catch {
      base = [];
    }
    cacheRank.set(clave, { t: Date.now(), filas: base });
  }
  const ahora = Date.now();
  return base.slice(0, n).map((r) => ({
    n: r.n,
    s: r.s,
    d: r.t ? Math.max(0, Math.floor((ahora - r.t) / 86400000)) : 0,
    m: uidActual && r.uid === uidActual ? 1 : 0
  }));
}

export async function validarYGuardar({ juego, token, nombre, score, secs }) {
  const def = JUEGOS[juego];
  if (!def) return { ok: false, texto: "❌ Juego no reconocido." };
  score = Number(score);
  secs = Number(secs);
  if (!Number.isFinite(score) || !Number.isFinite(secs)) {
    return { ok: false, texto: "❌ Datos del récord incompletos. Vuelve a abrir el juego." };
  }
  const pase = abrirPase(juego, token);
  if (!pase) return { ok: false, texto: "❌ Ese récord no es válido (pase inválido). Abre el juego otra vez." };
  const { uid, t } = pase;
  const ahora = Date.now();
  if (ahora - t > VIGENCIA_MS || t > ahora + 60000) {
    return { ok: false, texto: "⌛ La partida venció (12 h). Abre el juego otra vez y repite tu marca." };
  }
  score = Math.floor(score);
  secs = Math.max(0, Math.floor(secs));
  if (secs > (ahora - t) / 1000 + 10 || !def.valida(score, secs)) {
    return { ok: false, texto: "🚫 Ese resultado no parece válido, no se guardó." };
  }

  const c = coleccion();
  if (!c) return { ok: false, texto: "⚠️ La base de datos no está disponible ahora. Tu récord queda guardado solo en tu dispositivo." };

  try {
    const _id = `${juego}:${uid}`;
    const previo = await c.findOne({ _id }, { projection: { score: 1 } });
    const mejora = !previo || (def.menor ? score < previo.score : score > previo.score);
    if (!mejora) {
      return { ok: true, nuevo: false, rec: previo.score, texto: `ℹ️ Ya tienes un récord mejor en *${def.nombre}*: *${previo.score}*.` };
    }
    await c.updateOne({ _id }, { $set: { juego, uid, nombre: limpiarNombre(nombre), score, t: ahora } }, { upsert: true });
    cacheTop.delete(juego);
    cacheRank.clear();
    const unidad = def.menor ? " golpes" : "";
    return { ok: true, nuevo: true, rec: score, texto: `🏆 ¡Nuevo récord en *${def.nombre}*: *${score}${unidad}*!` };
  } catch (e) {
    console.log("[JUEGOS-RECORDS] " + e.message);
    return { ok: false, texto: "⚠️ No se pudo guardar el récord ahora. Inténtalo de nuevo." };
  }
}

// Prueba de escritura/lectura para .gdiag
export async function pruebaBase() {
  const c = coleccion();
  if (!c) return { ok: false, motivo: "obtenerBase() devolvió null (Mongo no está conectado)" };
  try {
    const _id = "diag:prueba";
    await c.updateOne({ _id }, { $set: { juego: "diag", uid: "diag", nombre: "prueba", score: 1, t: Date.now() } }, { upsert: true });
    const doc = await c.findOne({ _id });
    await c.deleteOne({ _id });
    return { ok: !!doc, motivo: doc ? "escritura y lectura correctas" : "no se pudo leer lo escrito" };
  } catch (e) {
    return { ok: false, motivo: e.message };
  }
}

// Configuración pequeña del módulo (p. ej. la URL pública del bot) en la colección "juegos_config".
export async function leerConfig(clave) {
  try {
    const base = obtenerBase();
    if (!base) return null;
    const d = await base.collection("juegos_config").findOne({ _id: clave });
    return d && d.valor !== undefined ? d.valor : null;
  } catch {
    return null;
  }
}

export async function guardarConfig(clave, valor) {
  try {
    const base = obtenerBase();
    if (!base) return false;
    const c = base.collection("juegos_config");
    if (valor === null || valor === undefined || valor === "") await c.deleteOne({ _id: clave });
    else await c.updateOne({ _id: clave }, { $set: { valor } }, { upsert: true });
    return true;
  } catch {
    return false;
  }
}

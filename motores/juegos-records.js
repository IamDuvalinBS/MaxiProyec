import crypto from "crypto";
import { obtenerBase } from "./db.js";

// ─────────────────────────────────────────────────────────────
//  RÉCORDS DE JUEGOS HTML  (colección "juegos_records")
//  Un solo documento por persona y juego: { _id: "juego:uid", juego, uid, nombre, score, t }
//  NO se guarda historial de partidas, solo el mejor resultado.
// ─────────────────────────────────────────────────────────────

const COLECCION = "juegos_records";
const VIGENCIA_MS = 12 * 60 * 60 * 1000; // la firma del juego dura 12 h
const CACHE_TOP_MS = 45 * 1000;

// menor:true  → gana el número más bajo (golf).  valida(score, secs) → true si es creíble.
export const JUEGOS = {
  colorrush: {
    nombre: "Color Rush",
    menor: false,
    valida: (p, s) => p > 0 && p <= 150 + 60 * s + 30 * s * s
  },
  gusanos: {
    nombre: "Gusanos Neón",
    menor: false,
    valida: (p, s) => p >= 100 && p <= 400 + 1500 * s
  },
  minigolf: {
    nombre: "Mini Golf",
    menor: true,
    valida: (p, s) => p >= 18 && p <= 180 && s >= 60
  },
  bolos10: {
    nombre: "Bolos (10 cuadros)",
    menor: false,
    valida: (p, s) => p >= 1 && p <= 300 && s >= 15
  },
  bolos5: {
    nombre: "Bolos (5 cuadros)",
    menor: false,
    valida: (p, s) => p >= 1 && p <= 150 && s >= 8
  },
  snake0: { nombre: "Snake Fruits · Clásico", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  snake1: { nombre: "Snake Fruits · Festival", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  snake2: { nombre: "Snake Fruits · Caos", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  snake3: { nombre: "Snake Fruits · Supervivencia", menor: false, valida: (p, s) => p >= 10 && p <= 100 + 250 * s },
  uno: {
    nombre: "UNO (mejor victoria)",
    menor: false,
    valida: (p, s) => p >= 1 && p <= 1000 && s >= 8
  }
};

const secreto = () => process.env.JUEGOS_SECRET || process.env.MONGO_URI || "maxiproyec-juegos";

export function firmar(juego, uid, t) {
  return crypto.createHmac("sha256", secreto()).update(`${juego}|${uid}|${t}`).digest("hex").slice(0, 24);
}

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

const cacheTop = new Map();

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
  if (hit && Date.now() - hit.t < CACHE_TOP_MS) return hit.datos;
  try {
    const c = coleccion();
    if (!c || !JUEGOS[juego]) return [];
    const filas = await c.find({ juego }, { projection: { nombre: 1, score: 1 } })
      .sort({ score: JUEGOS[juego].menor ? 1 : -1 })
      .limit(n)
      .toArray();
    const datos = filas.map((f) => [String(f.nombre || "Jugador").slice(0, 18), f.score]);
    cacheTop.set(juego, { t: Date.now(), datos });
    return datos;
  } catch {
    return [];
  }
}

export async function validarYGuardar({ juego, uid, nombre, score, secs, t, firma }) {
  const def = JUEGOS[juego];
  if (!def) return { ok: false, texto: "❌ Juego no reconocido." };
  if (!Number.isFinite(score) || !Number.isFinite(secs) || !Number.isFinite(t)) {
    return { ok: false, texto: "❌ Datos del récord incompletos. Vuelve a abrir el juego." };
  }
  const ahora = Date.now();
  const esperada = firmar(juego, uid, t);
  if (!firma || firma.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada))) {
    return { ok: false, texto: "❌ Ese récord no pertenece a tu partida (o la firma no coincide). Abre el juego otra vez." };
  }
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
      return { ok: true, nuevo: false, texto: `ℹ️ Ya tienes un récord mejor en *${def.nombre}*: *${previo.score}*.` };
    }
    await c.updateOne({ _id }, { $set: { juego, uid, nombre: String(nombre || "Jugador").slice(0, 24), score, t: ahora } }, { upsert: true });
    cacheTop.delete(juego);
    const unidad = def.menor ? " golpes" : "";
    return { ok: true, nuevo: true, texto: `🏆 ¡Nuevo récord en *${def.nombre}*: *${score}${unidad}*!` };
  } catch (e) {
    console.log("[JUEGOS-RECORDS] " + e.message);
    return { ok: false, texto: "⚠️ No se pudo guardar el récord ahora. Inténtalo de nuevo." };
  }
}

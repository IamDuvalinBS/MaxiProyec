import fs from "fs";
import path from "path";
import { obtenerBase, idCanonico, enModoRespaldo } from "./db.js";

// ═══════════════════════════════════════════════════════════════
//  KARMA Y TRATOS
//  Se guarda en MongoDB (colecciones "karma" y "tratos"). Si no hay Mongo
//  (modo respaldo), se guarda en data/karma-tratos.json.
//  No toca las cuentas de economía: el karma vive aparte.
// ═══════════════════════════════════════════════════════════════

export const KARMA_INICIAL = 100;
export const KARMA_MAX = 100;
export const KARMA_MIN = 0;

// Cuánto sube y baja el karma.
export const PUNTOS = {
  cumplir: 10,
  perdon: 15,
  buenaAccion: 5,
  incumplir: -25,
  mentira: -15,
  estafa: -30
};

// Anti-abuso: karma máximo que se puede ganar por tratos cumplidos al día.
export const MAX_CUMPLIDOS_CON_KARMA_POR_DIA = 3;
export const ESPERA_BUENA_ACCION_MS = 24 * 60 * 60 * 1000;

// Todo lo que cambia según el nivel está aquí. Para ajustar la economía, edita solo esta tabla.
//  suerte:   multiplicador de suerte: divide el riesgo de fallo en trabajos como .crimen y .espiar
//  casino:   puntos de probabilidad que suma o resta a ganar en .apuesta (0.07 = +7 puntos).
//            No se usa el x2 literal porque 48% x2 = 96% de ganar y rompería la economía
//  daily:    multiplicador del premio de .daily (el premio base normal no cambia)
//  jackpot:  probabilidad de jackpot en el slot (el bot aún no tiene slot; queda listo)
//  legendario: probabilidad extra de que una tirada de gacha sea Legendaria o mejor
//  banner:   multiplicador de la probabilidad del destacado semanal del gacha
//  rerollComun: [probabilidad de aplicar, intentos, rareza máxima aceptada] para "casi siempre común"
export const NIVELES = [
  { min: 100, clave: "leyenda", emoji: "👑", nombre: "LEYENDA", suerte: 2, casino: 0.07, daily: 1.5, jackpot: 0.18, legendario: 0.04, banner: 1.5, rerollComun: null, extra: "Suerte x2 · Gacha con más legendarios" },
  { min: 80, clave: "confiable", emoji: "💎", nombre: "CONFIABLE", suerte: 1.5, casino: 0.04, daily: 1.2, jackpot: 0.14, legendario: 0.02, banner: 1.2, rerollComun: null, extra: "Suerte +50%" },
  { min: 50, clave: "normal", emoji: "🙂", nombre: "NORMAL", suerte: 1, casino: 0, daily: 1, jackpot: 0.1, legendario: 0, banner: 1, rerollComun: null, extra: "Suerte normal" },
  { min: 30, clave: "poco", emoji: "😒", nombre: "POCO CONFIABLE", suerte: 0.7, casino: -0.04, daily: 0.6, jackpot: 0.06, legendario: 0, banner: 0.7, rerollComun: [0.4, 2, 3], extra: "Suerte -30% · Robar falla más" },
  { min: 0, clave: "traidor", emoji: "💀", nombre: "TRAIDOR", suerte: 0.4, casino: -0.1, daily: 0.25, jackpot: 0.03, legendario: 0, banner: 0, rerollComun: [0.9, 8, 1], extra: "Suerte -60% · Gacha casi siempre común", apodo: "El que no cumple" }
];

// Límites de la probabilidad de ganar en .apuesta.
export const TOPE_VICTORIA = 0.6;
export const PISO_VICTORIA = 0.05;
export const TOPE_FALLO = 0.95;

const ARCHIVO = path.resolve("./data/karma-tratos.json");

const karmas = new Map(); // jid canónico -> { karma, cumplidos, incumplidos, buenaAccion, cumplidosHoy: {dia, n}, pares: {jid: ms} }
const tratos = new Map(); // número -> trato
const sucios = { karma: new Set(), tratos: new Set() };
let siguiente = 1;
let cargado = false;
let cargando = null;
let temporizador = null;

const clave = (jid) => String(idCanonico(jid) || jid || "");

// ───────────── Carga y guardado ─────────────

function normalizarKarma(doc) {
  return {
    karma: Number.isFinite(doc.karma) ? doc.karma : KARMA_INICIAL,
    cumplidos: doc.cumplidos || 0,
    incumplidos: doc.incumplidos || 0,
    buenaAccion: doc.buenaAccion || 0,
    cumplidosHoy: doc.cumplidosHoy || { dia: "", n: 0 },
    pares: doc.pares || {},
    apodo: doc.apodo || null
  };
}

async function cargar() {
  const base = obtenerBase();
  if (base) {
    for await (const doc of base.collection("karma").find({})) karmas.set(doc._id, normalizarKarma(doc));
    for await (const doc of base.collection("tratos").find({})) tratos.set(Number(doc._id), { ...doc, n: Number(doc._id) });
  } else if (fs.existsSync(ARCHIVO)) {
    const datos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    for (const [id, doc] of Object.entries(datos.karma || {})) karmas.set(id, normalizarKarma(doc));
    for (const doc of Object.values(datos.tratos || {})) tratos.set(Number(doc.n), doc);
  }
  siguiente = Math.max(0, ...tratos.keys()) + 1;
  cargado = true;
}

// Espera a que Mongo esté listo (o usa el archivo local si el bot corre sin Mongo).
export function asegurarKarma() {
  if (cargado) return Promise.resolve();
  if (!obtenerBase() && process.env.MONGO_URI && !enModoRespaldo()) return Promise.resolve();
  if (!cargando) {
    cargando = cargar().catch((e) => console.log(`❌ No se pudo cargar el karma: ${e.message}`)).finally(() => { cargando = null; });
  }
  return cargando;
}

export const karmaListo = () => cargado;

// Al arrancar, el bot conecta a Mongo en segundo plano: se reintenta hasta que esté listo.
{
  const intervalo = setInterval(() => {
    if (cargado) return clearInterval(intervalo);
    asegurarKarma();
  }, 3000);
  intervalo.unref?.();
}

function programarGuardado() {
  if (temporizador) return;
  temporizador = setTimeout(() => { temporizador = null; guardarKarma(); }, 2000);
  temporizador.unref?.();
}

export async function guardarKarma() {
  if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  if (!cargado || (!sucios.karma.size && !sucios.tratos.size)) return;
  const idsKarma = [...sucios.karma];
  const idsTratos = [...sucios.tratos];
  sucios.karma.clear();
  sucios.tratos.clear();

  try {
    const base = obtenerBase();
    if (base) {
      if (idsKarma.length) {
        await base.collection("karma").bulkWrite(idsKarma.filter((id) => karmas.has(id)).map((id) => ({
          replaceOne: { filter: { _id: id }, replacement: { _id: id, ...karmas.get(id) }, upsert: true }
        })), { ordered: false });
      }
      if (idsTratos.length) {
        await base.collection("tratos").bulkWrite(idsTratos.filter((n) => tratos.has(n)).map((n) => {
          const { n: _n, ...resto } = tratos.get(n);
          return { replaceOne: { filter: { _id: n }, replacement: { _id: n, ...resto }, upsert: true } };
        }), { ordered: false });
      }
      return;
    }
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify({ karma: Object.fromEntries(karmas), tratos: Object.fromEntries(tratos) }));
  } catch (e) {
    console.log(`❌ Error guardando karma/tratos: ${e.message}`);
    idsKarma.forEach((id) => sucios.karma.add(id));
    idsTratos.forEach((n) => sucios.tratos.add(n));
    temporizador = setTimeout(() => { temporizador = null; guardarKarma(); }, 10000);
    temporizador.unref?.();
  }
}

// ───────────── Karma ─────────────

function registro(jid, crear = false) {
  const id = clave(jid);
  let r = karmas.get(id);
  if (!r) {
    r = normalizarKarma({});
    if (crear) karmas.set(id, r);
  }
  return { id, r };
}

const marcarKarma = (id) => { sucios.karma.add(id); programarGuardado(); };

export const getKarma = (jid) => registro(jid).r.karma;

export function nivelPorKarma(valor) {
  return NIVELES.find((n) => valor >= n.min) || NIVELES[NIVELES.length - 1];
}

export const nivelDe = (jid) => nivelPorKarma(getKarma(jid));

export function estadisticasDe(jid) {
  const { r } = registro(jid);
  return { karma: r.karma, cumplidos: r.cumplidos, incumplidos: r.incumplidos, nivel: nivelPorKarma(r.karma) };
}

// Suma o resta karma (entre 0 y 100). Devuelve cómo quedó.
export function cambiarKarma(jid, delta, { cuenta = null } = {}) {
  const { id, r } = registro(jid, true);
  const antes = r.karma;
  r.karma = Math.max(KARMA_MIN, Math.min(KARMA_MAX, antes + delta));
  if (cuenta === "cumplido") r.cumplidos += 1;
  if (cuenta === "incumplido") r.incumplidos += 1;
  marcarKarma(id);
  const nivelAntes = nivelPorKarma(antes);
  const nivelAhora = nivelPorKarma(r.karma);
  return { antes, despues: r.karma, cambio: r.karma - antes, nivelAntes, nivelAhora, cambioNivel: nivelAntes.clave !== nivelAhora.clave };
}

// Apodo temporal (ej: "El Deudor" por 3 días). Si no hay uno vigente, se usa el del nivel (TRAIDOR: "El que no cumple").
export function ponerApodo(jid, texto, ms) {
  const { id, r } = registro(jid, true);
  r.apodo = { texto, hasta: Date.now() + ms };
  marcarKarma(id);
}

export function apodoDe(jid) {
  const { r } = registro(jid);
  if (r.apodo && r.apodo.hasta > Date.now()) return r.apodo.texto;
  return nivelPorKarma(r.karma).apodo || null;
}

// +5 de karma, una vez cada 24 horas.
export function buenaAccion(jid) {
  const { id, r } = registro(jid, true);
  const restante = r.buenaAccion + ESPERA_BUENA_ACCION_MS - Date.now();
  if (restante > 0) return { espera: restante };
  if (r.karma >= KARMA_MAX) return { maximo: true };
  r.buenaAccion = Date.now();
  marcarKarma(id);
  return { resultado: cambiarKarma(jid, PUNTOS.buenaAccion) };
}

const diaHoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

// Anti-farmeo: máximo 3 tratos con karma por día y solo uno cada 24 h con la misma persona.
export function puedeGanarPorCumplir(jid, otroJid) {
  const { r } = registro(jid);
  const hoy = r.cumplidosHoy.dia === diaHoy() ? r.cumplidosHoy.n : 0;
  if (hoy >= MAX_CUMPLIDOS_CON_KARMA_POR_DIA) return false;
  const ultimo = r.pares[clave(otroJid)] || 0;
  return Date.now() - ultimo > 24 * 60 * 60 * 1000;
}

export function anotarCumplido(jid, otroJid) {
  const { id, r } = registro(jid, true);
  r.cumplidosHoy = { dia: diaHoy(), n: (r.cumplidosHoy.dia === diaHoy() ? r.cumplidosHoy.n : 0) + 1 };
  r.pares[clave(otroJid)] = Date.now();
  marcarKarma(id);
}

// ───────────── Efectos del nivel (los usan daily, apuesta, trabajos y gacha) ─────────────

export const multDaily = (jid) => nivelDe(jid).daily;
export const jackpotSlot = (jid) => nivelDe(jid).jackpot;

// Probabilidad de GANAR con la suerte aplicada (apuesta).
export function probVictoria(p, jid) {
  const ajustada = p + nivelDe(jid).casino;
  return Math.max(PISO_VICTORIA, Math.min(TOPE_VICTORIA, ajustada));
}

// Probabilidad de FALLAR con la suerte aplicada (.crimen, .espiar y demás trabajos con riesgo).
export function probFallo(p, jid) {
  if (!(p > 0)) return p;
  const suerte = nivelDe(jid).suerte;
  // Buena suerte divide el riesgo (x2 = la mitad); mala suerte lo aumenta (-60% de suerte = +60% de riesgo).
  const ajustada = suerte >= 1 ? p / suerte : p * (2 - suerte);
  return Math.min(TOPE_FALLO, ajustada);
}

// ───────────── Tratos ─────────────

export function crearTrato({ creador, destino, texto, grupo }) {
  const n = siguiente++;
  const trato = {
    n,
    creador: clave(creador),
    creadorJid: creador,
    destino: clave(destino),
    destinoJid: destino,
    texto,
    grupo: grupo || null,
    creadoEn: Date.now(),
    estado: "pendiente",
    aceptadoEn: null,
    cerradoEn: null,
    reportes: [],
    perdonSolicitadoEn: null,
    perdonado: false
  };
  tratos.set(n, trato);
  sucios.tratos.add(n);
  programarGuardado();
  return trato;
}

export const getTrato = (n) => tratos.get(Number(n)) || null;

export function guardarTrato(trato) {
  sucios.tratos.add(trato.n);
  programarGuardado();
}

export function tratosDe(jid, filtro = () => true) {
  const id = clave(jid);
  return [...tratos.values()].filter((t) => (t.creador === id || t.destino === id) && filtro(t)).sort((a, b) => a.n - b.n);
}

export function esParte(trato, jid) {
  const id = clave(jid);
  return trato.creador === id || trato.destino === id;
}

export const esCreador = (trato, jid) => trato.creador === clave(jid);
export const esDestino = (trato, jid) => trato.destino === clave(jid);
export const mismaPersona = (a, b) => clave(a) === clave(b);

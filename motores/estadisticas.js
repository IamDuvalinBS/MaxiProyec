import { obtenerBase } from "./db.js";

export function contarComando(nombre) {
  const base = obtenerBase();
  if (!base || !nombre) return;
  base.collection("estadisticas")
    .updateOne({ _id: nombre.replace(/^[.!#]/, "") }, { $inc: { usos: 1 } }, { upsert: true })
    .catch(() => {});
}

export async function topComandos(limite = 10) {
  const base = obtenerBase();
  if (!base) return null;
  const col = base.collection("estadisticas");
  const [top, suma] = await Promise.all([
    col.find({}).sort({ usos: -1 }).limit(limite).toArray(),
    col.aggregate([{ $group: { _id: null, t: { $sum: "$usos" } } }]).toArray()
  ]);
  return { top, total: suma[0]?.t || 0 };
}

// ═══════════════ CONTADOR POR GRUPO (mensajes y comandos) ═══════════════
// Se acumula en memoria y se guarda en lotes cada pocos segundos, para no pegarle a Mongo en cada mensaje.
const IGNORADOS = new Set([
  "protocolMessage", "reactionMessage", "encReactionMessage", "senderKeyDistributionMessage",
  "pollUpdateMessage", "messageContextInfo", "keepInChatMessage", "editedMessage",
  "requestPhoneNumberMessage", "peerDataOperationRequestMessage", "call", "bcallMessage"
]);
const ENVOLTURAS = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "documentWithCaptionMessage"];

// true solo si es un mensaje real escrito/enviado por una persona en un grupo
// (texto, foto, video, audio, sticker, documento, encuesta, etc.), sin reacciones, ediciones ni mensajes del sistema.
export function esMensajeDePersona(msg, tipoEvento = "notify") {
  if (tipoEvento !== "notify" || !msg || msg.key?.fromMe || msg.paginaChat) return false;
  if (!msg.key?.remoteJid?.endsWith("@g.us") || msg.messageStubType) return false;
  let contenido = msg.message;
  for (let i = 0; i < 4 && contenido; i++) {
    const envoltura = ENVOLTURAS.find((k) => contenido[k]);
    if (!envoltura) break;
    contenido = contenido[envoltura].message;
  }
  if (!contenido) return false;
  const tipos = Object.keys(contenido).filter((k) => k !== "messageContextInfo");
  return tipos.length > 0 && !tipos.every((k) => IGNORADOS.has(k));
}

const pendientes = new Map();
let temporizador = null;
let guardando = false;
const limpiarClave = (s) => String(s).replace(/^[.!#]/, "").replace(/[.$\0]/g, "_").slice(0, 60);

function acumular(grupo, campo, cmd) {
  if (!grupo?.endsWith("@g.us")) return;
  const p = pendientes.get(grupo) || { m: 0, c: 0, cmds: {} };
  if (campo === "m") p.m++;
  else { p.c++; if (cmd) { const k = limpiarClave(cmd); p.cmds[k] = (p.cmds[k] || 0) + 1; } }
  pendientes.set(grupo, p);
  if (!temporizador) { temporizador = setInterval(guardarContadores, 15000); temporizador.unref?.(); }
}

export const contarMensajeGrupo = (grupo) => acumular(grupo, "m");
export const contarComandoGrupo = (grupo, nombre) => acumular(grupo, "c", nombre);

export async function guardarContadores() {
  const base = obtenerBase();
  if (guardando || !base || !pendientes.size) return;
  guardando = true;
  const lote = [...pendientes];
  pendientes.clear();
  try {
    await base.collection("estadisticas_grupos").bulkWrite(lote.map(([grupo, p]) => {
      const inc = { mensajes: p.m, comandos: p.c };
      for (const [k, n] of Object.entries(p.cmds)) inc[`cmds.${k}`] = n;
      return { updateOne: { filter: { _id: grupo }, update: { $inc: inc, $set: { ultimo: Date.now() } }, upsert: true } };
    }), { ordered: false });
  } catch {
    for (const [grupo, p] of lote) {   // si falló, se devuelve a la cola para reintentar
      const q = pendientes.get(grupo) || { m: 0, c: 0, cmds: {} };
      q.m += p.m; q.c += p.c;
      for (const [k, n] of Object.entries(p.cmds)) q.cmds[k] = (q.cmds[k] || 0) + n;
      pendientes.set(grupo, q);
    }
  } finally { guardando = false; }
}

export async function estadisticasGrupo(grupo, limite = 10) {
  const base = obtenerBase();
  if (!base) return null;
  const doc = await base.collection("estadisticas_grupos").findOne({ _id: grupo }) || {};
  const p = pendientes.get(grupo) || { m: 0, c: 0, cmds: {} };   // suma lo que aún no se guardó
  const cmds = { ...(doc.cmds || {}) };
  for (const [k, n] of Object.entries(p.cmds)) cmds[k] = (cmds[k] || 0) + n;
  return {
    mensajes: (doc.mensajes || 0) + p.m,
    comandos: (doc.comandos || 0) + p.c,
    top: Object.entries(cmds).sort((a, b) => b[1] - a[1]).slice(0, limite).map(([nombre, usos]) => ({ nombre, usos }))
  };
}

for (const senal of ["SIGINT", "SIGTERM"]) process.once(senal, () => { guardarContadores().finally(() => process.exit(0)); });

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
const ENVOLTURAS = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "documentWithCaptionMessage", "deviceSentMessage"];

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

// jid -> clave segura para Mongo (sin puntos) y de vuelta
const claveUsuario = (jid) => { const [n, d] = String(jid).split("@"); return d === "lid" ? `${n.replace(/\D/g, "")}_lid` : n.replace(/\D/g, ""); };
export const jidDeClave = (k) => (k.endsWith("_lid") ? `${k.slice(0, -4)}@lid` : `${k}@s.whatsapp.net`);

function acumular(grupo, campo, cmd, sender) {
  if (!grupo?.endsWith("@g.us")) return;
  const p = pendientes.get(grupo) || { m: 0, c: 0, cmds: {}, usr: {} };
  if (campo === "m") p.m++;
  else { p.c++; if (cmd) { const k = limpiarClave(cmd); p.cmds[k] = (p.cmds[k] || 0) + 1; } }
  const u = sender && claveUsuario(sender);
  if (u) { const x = p.usr[u] || (p.usr[u] = { m: 0, c: 0 }); x[campo]++; }
  pendientes.set(grupo, p);
  if (!temporizador) { temporizador = setInterval(guardarContadores, 15000); temporizador.unref?.(); }
}

export const contarMensajeGrupo = (grupo, sender) => acumular(grupo, "m", null, sender);
export const contarComandoGrupo = (grupo, nombre, sender) => acumular(grupo, "c", nombre, sender);

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
      for (const [u, x] of Object.entries(p.usr)) { if (x.m) inc[`usr.${u}.m`] = x.m; if (x.c) inc[`usr.${u}.c`] = x.c; }
      return { updateOne: { filter: { _id: grupo }, update: { $inc: inc, $set: { ultimo: Date.now() } }, upsert: true } };
    }), { ordered: false });
  } catch {
    for (const [grupo, p] of lote) {   // si falló, se devuelve a la cola para reintentar
      const q = pendientes.get(grupo) || { m: 0, c: 0, cmds: {}, usr: {} };
      q.m += p.m; q.c += p.c;
      for (const [u, x] of Object.entries(p.usr)) { const y = q.usr[u] || (q.usr[u] = { m: 0, c: 0 }); y.m += x.m; y.c += x.c; }
      for (const [k, n] of Object.entries(p.cmds)) q.cmds[k] = (q.cmds[k] || 0) + n;
      pendientes.set(grupo, q);
    }
  } finally { guardando = false; }
}

export async function estadisticasGrupo(grupo, limite = 10) {
  const base = obtenerBase();
  if (!base) return null;
  const doc = await base.collection("estadisticas_grupos").findOne({ _id: grupo }) || {};
  const p = pendientes.get(grupo) || { m: 0, c: 0, cmds: {}, usr: {} };   // suma lo que aún no se guardó
  const cmds = { ...(doc.cmds || {}) };
  for (const [k, n] of Object.entries(p.cmds)) cmds[k] = (cmds[k] || 0) + n;
  const usuarios = new Map();
  for (const [k, x] of Object.entries(doc.usr || {})) usuarios.set(k, { m: x.m || 0, c: x.c || 0 });
  for (const [k, x] of Object.entries(p.usr)) { const y = usuarios.get(k) || { m: 0, c: 0 }; y.m += x.m; y.c += x.c; usuarios.set(k, y); }
  return {
    usuarios: [...usuarios].map(([k, x]) => ({ jid: jidDeClave(k), mensajes: x.m, comandos: x.c })).sort((a, b) => b.mensajes - a.mensajes || b.comandos - a.comandos),
    mensajes: (doc.mensajes || 0) + p.m,
    comandos: (doc.comandos || 0) + p.c,
    top: Object.entries(cmds).sort((a, b) => b[1] - a[1]).slice(0, limite).map(([nombre, usos]) => ({ nombre, usos }))
  };
}

for (const senal of ["SIGINT", "SIGTERM"]) process.once(senal, () => { guardarContadores().finally(() => process.exit(0)); });

import chalk from "chalk";
import { obtenerBase, enModoRespaldo, setCanonId, fusionarCuenta } from "../../motores/db.js";
import { gachaListo } from "../../motores/gacha-core.js";
import { fusionarUsuarioGacha } from "../../motores/gacha-db.js";
import { metadatos, limpiarJid } from "../grupos/nucleo.js";

const COLECCION = "alias_lid";
const PN = "@s.whatsapp.net";
const alias = new Map();
let coleccion = null;
let listo = false;
let cola = Promise.resolve();
let libLid;

const esLid = (jid) => typeof jid === "string" && jid.endsWith("@lid");
const esPN = (jid) => typeof jid === "string" && jid.endsWith(PN);

function comoPN(valor) {
  if (typeof valor !== "string" || !valor) return null;
  const texto = valor.includes("@") ? valor : valor + PN;
  const limpio = limpiarJid(texto);
  return esPN(limpio) ? limpio : null;
}

async function utilidades() {
  if (libLid !== undefined) return libLid;
  try {
    libLid = await import("@fer2809fl/baileys");
  } catch {
    libLid = null;
  }
  return libLid;
}

export function pnRapido(jid, key = null) {
  if (!jid) return jid;
  const limpio = limpiarJid(jid);
  if (!esLid(limpio)) return limpio;
  const alt = key ? altDeClave(key) : null;
  if (alt) aprender(limpio, alt);
  return alias.get(limpio) || limpio;
}

setCanonId((jid) => pnRapido(jid));

function fusionar(lid, pn) {
  cola = cola
    .then(async () => {
      if (!listo) return;
      const cuenta = await fusionarCuenta(lid, pn);
      await gachaListo;
      const gacha = fusionarUsuarioGacha(lid, pn);
      if (cuenta || gacha) console.log(chalk.cyan(`🔗 Cuentas unificadas: ${lid} → ${pn}`));
    })
    .catch((e) => console.log("No se pudo unificar " + lid + ": " + e.message));
}

function aprender(lid, pn) {
  const a = limpiarJid(lid);
  const b = comoPN(pn);
  if (!esLid(a) || !b || alias.get(a) === b) return;
  alias.set(a, b);
  if (coleccion && !enModoRespaldo()) coleccion.updateOne({ _id: a }, { $set: { pn: b } }, { upsert: true }).catch(() => {});
  fusionar(a, b);
}

export function aprenderParticipantes(participantes) {
  for (const p of participantes || []) {
    const ids = [p.id, p.lid, p.jid, p.phoneNumber, p.phoneNumberJid].filter(Boolean).map(limpiarJid);
    const lid = ids.find(esLid);
    const pn = ids.find(esPN);
    if (lid && pn) aprender(lid, pn);
  }
}

export async function aprenderTodosLosGrupos(sock) {
  try {
    const grupos = await sock.groupFetchAllParticipating();
    for (const g of Object.values(grupos || {})) aprenderParticipantes(g.participants);
  } catch {}
}

async function viaSocket(sock, lid) {
  try {
    const repo = sock.signalRepository?.lidMapping;
    if (repo?.getPNForLID) {
      const pn = comoPN(await repo.getPNForLID(lid));
      if (pn) return pn;
    }
  } catch {}
  try {
    const lib = await utilidades();
    const pn = comoPN(lib?.getCachedJid?.(lid));
    if (pn) return pn;
  } catch {}
  return null;
}

async function viaGrupo(sock, grupo, lid) {
  try {
    const meta = await metadatos(sock, grupo);
    if (!meta) return null;
    let encontrado = null;
    for (const p of meta.participantes) {
      const par = p.ids.find(esLid);
      const pn = p.ids.find(esPN);
      if (par && pn) aprender(par, pn);
      if (p.ids.includes(lid) && pn) encontrado = pn;
    }
    return encontrado;
  } catch {
    return null;
  }
}

export async function resolverUsuario(sock, jid, { grupo = null, alt = null } = {}) {
  if (!jid) return jid;
  const limpio = limpiarJid(jid);
  if (!esLid(limpio)) return limpio;
  if (alt) aprender(limpio, alt);
  if (alias.has(limpio)) return alias.get(limpio);
  let pn = await viaSocket(sock, limpio);
  if (!pn && grupo && grupo.endsWith("@g.us")) pn = await viaGrupo(sock, grupo, limpio);
  if (pn) {
    aprender(limpio, pn);
    return pn;
  }
  return limpio;
}

export function altDeClave(key) {
  if (!key) return null;
  const alt = key.participant ? key.participantAlt || key.participantPn : key.remoteJidAlt || key.senderPn;
  return comoPN(alt);
}

async function normalizarContexto(sock, contenido, grupo, nivel = 0) {
  if (!contenido || typeof contenido !== "object" || nivel > 4) return;
  for (const valor of Object.values(contenido)) {
    if (!valor || typeof valor !== "object") continue;
    const ci = valor.contextInfo;
    if (ci && typeof ci === "object") {
      if (Array.isArray(ci.mentionedJid)) {
        ci.mentionedJid = await Promise.all(ci.mentionedJid.map((j) => resolverUsuario(sock, j, { grupo })));
      }
      if (esLid(ci.participant)) ci.participant = await resolverUsuario(sock, ci.participant, { grupo });
    }
    if (valor.message) await normalizarContexto(sock, valor.message, grupo, nivel + 1);
  }
}

export async function normalizarMensaje(sock, msg, crudo) {
  const grupo = msg.key.remoteJid;
  const sender = await resolverUsuario(sock, crudo, { grupo, alt: altDeClave(msg.key) });
  try {
    await normalizarContexto(sock, msg.message, grupo);
  } catch {}
  return sender;
}

async function iniciar() {
  for (let i = 0; i < 240 && !obtenerBase(); i++) {
    if (enModoRespaldo()) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const base = obtenerBase();
  if (base) {
    coleccion = base.collection(COLECCION);
    try {
      for (const doc of await coleccion.find({}).toArray()) {
        const pn = comoPN(doc.pn);
        if (pn) alias.set(doc._id, pn);
      }
    } catch (e) {
      console.log("No se pudieron cargar los alias de ID: " + e.message);
    }
  }
  await gachaListo.catch(() => {});
  listo = true;
  for (const [lid, pn] of alias) fusionar(lid, pn);
  console.log(chalk.cyan(`🆔 Identidades cargadas: ${alias.size} alias LID → número`));
}

iniciar().catch((e) => console.log("Error iniciando identidades: " + e.message));

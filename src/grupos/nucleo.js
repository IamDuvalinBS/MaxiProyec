import { isOwner } from "../../motores/owner.js";

const VIGENCIA_METADATOS_MS = 60 * 1000;
const VIGENCIA_ENLACE_MS = 10 * 60 * 1000;
const metadatosGuardados = new Map();
const metadatosPendientes = new Map();
const enlacesGuardados = new Map();
let utilidadesLid = null;

async function cargarUtilidadesLid() {
  if (utilidadesLid !== null) return utilidadesLid || null;
  try {
    const lib = await import("@fer2809fl/baileys");
    const completas = ["cacheParticipantLids", "getCachedJid", "isLid"].every((n) => typeof lib[n] === "function");
    utilidadesLid = completas ? { cachear: lib.cacheParticipantLids, jidDe: lib.getCachedJid, esLid: lib.isLid } : false;
  } catch (e) {
    utilidadesLid = false;
  }
  return utilidadesLid || null;
}

export function esGrupo(jid) {
  return typeof jid === "string" && jid.endsWith("@g.us");
}

export function limpiarJid(jid) {
  const [usuario, dominio] = String(jid || "").split("@");
  const base = usuario.split(":")[0];
  return dominio ? `${base}@${dominio}` : base;
}

export function normalizarParticipante(participante) {
  if (!participante) return null;
  if (typeof participante === "object") return participante;
  const texto = String(participante).trim();
  if (texto.startsWith("{")) {
    try {
      return JSON.parse(texto);
    } catch (e) {
      return { id: texto };
    }
  }
  return { id: texto };
}

export function jidDe(participante) {
  if (!participante) return null;
  if (typeof participante === "string") return participante;
  return participante.phoneNumber || participante.jid || participante.id || null;
}

export function numeroDe(jid) {
  return limpiarJid(jid).split("@")[0];
}

export function textoTrasComando(cleanText) {
  return cleanText.replace(/^\S+\s*/, "").trim();
}

export function aviso(emoji, titulo, texto) {
  return `⧼${emoji}⧽ *${titulo}*\n\n> ${texto}`;
}

export function idsDe(participante) {
  return [participante.id, participante.lid, participante.jid, participante.phoneNumber]
    .filter(Boolean)
    .map(limpiarJid);
}

function aligerar(metadata) {
  return {
    id: metadata.id,
    asunto: metadata.subject || "",
    creacion: metadata.creation || 0,
    participantes: metadata.participants.map((p) => ({
      id: p.id,
      ids: idsDe(p),
      admin: p.admin === "admin" || p.admin === "superadmin",
      superadmin: p.admin === "superadmin"
    }))
  };
}

export function metadatos(sock, grupo, forzar = false) {
  const guardado = metadatosGuardados.get(grupo);
  if (!forzar && guardado && guardado.vence > Date.now()) return Promise.resolve(guardado.datos);
  if (metadatosPendientes.has(grupo)) return metadatosPendientes.get(grupo);

  const promesa = sock
    .groupMetadata(grupo)
    .then((metadata) => {
      const datos = aligerar(metadata);
      cargarUtilidadesLid().then((u) => u && u.cachear(metadata.participants)).catch(() => {});
      metadatosGuardados.set(grupo, { datos, vence: Date.now() + VIGENCIA_METADATOS_MS });
      return datos;
    })
    .catch(() => (guardado ? guardado.datos : null))
    .finally(() => metadatosPendientes.delete(grupo));

  metadatosPendientes.set(grupo, promesa);
  return promesa;
}

export function olvidarMetadatos(grupo) {
  metadatosGuardados.delete(grupo);
}

export async function enlaceDeGrupo(sock, grupo) {
  const guardado = enlacesGuardados.get(grupo);
  if (guardado && guardado.vence > Date.now()) return guardado.enlace;
  try {
    const codigo = await sock.groupInviteCode(grupo);
    if (!codigo) return null;
    const enlace = `https://chat.whatsapp.com/${codigo}`;
    enlacesGuardados.set(grupo, { enlace, codigo, vence: Date.now() + VIGENCIA_ENLACE_MS });
    return enlace;
  } catch (e) {
    return null;
  }
}

export function codigoPropio(grupo) {
  const guardado = enlacesGuardados.get(grupo);
  return guardado ? guardado.codigo : null;
}

export function olvidarEnlace(grupo) {
  enlacesGuardados.delete(grupo);
}

export function buscarParticipante(meta, jid) {
  if (!meta || !jid) return null;
  const limpio = limpiarJid(jid);
  return meta.participantes.find((p) => p.ids.includes(limpio)) || null;
}

// Igual que buscarParticipante, pero entiende que un mismo usuario puede llegar como número (@s.whatsapp.net) o como LID (@lid)
// y que los metadatos del grupo a veces solo traen uno de los dos. Si no lo encuentra, vuelve a pedir los metadatos una vez.
export async function buscarParticipanteResuelto(sock, grupo, meta, jid) {
  if (!meta || !jid) return null;
  let identidad = null;
  try {
    identidad = await import("../nucleo/identidad.js");
  } catch (e) {}
  const esLid = (id) => String(id).endsWith("@lid");

  const intentar = async (m) => {
    const directo = buscarParticipante(m, jid);
    if (directo) return directo;
    if (!identidad) return null;
    const objetivo = limpiarJid(jid);

    // El usuario llegó como LID: se pasa a número y se busca de nuevo.
    if (esLid(objetivo)) {
      const pn = await identidad.resolverUsuario(sock, objetivo, { grupo }).catch(() => objetivo);
      const porPn = pn && pn !== objetivo ? buscarParticipante(m, pn) : null;
      if (porPn) return porPn;
    }

    // El usuario llegó como número pero el grupo solo lo tiene como LID: se compara el número de cada LID del grupo.
    const pendientes = [];
    for (const p of m.participantes) {
      for (const id of p.ids.filter(esLid)) {
        const rapido = identidad.pnRapido(id);
        if (rapido === objetivo) return p;
        if (rapido === id) pendientes.push([p, id]);
      }
    }
    const resueltos = await Promise.all(
      pendientes.map(([p, id]) => identidad.resolverUsuario(sock, id, { grupo }).then((pn) => [p, pn]).catch(() => [p, id]))
    );
    for (const [p, pn] of resueltos) if (limpiarJid(pn) === objetivo) return p;
    return null;
  };

  const primero = await intentar(meta);
  if (primero) return primero;

  const fresco = await metadatos(sock, grupo, true).catch(() => null);
  const segundo = fresco && fresco !== meta ? await intentar(fresco) : null;
  if (!segundo) {
    console.log(`[grupos] No encontré a ${jid} en ${grupo}. Participantes: ${meta.participantes.slice(0, 6).map((p) => p.ids.join("/")).join(", ")}${meta.participantes.length > 6 ? ", …" : ""}`);
  }
  return segundo;
}

export function buscarBot(sock, meta) {
  if (!meta) return null;
  const propios = [sock.user?.id, sock.user?.lid].filter(Boolean).map(limpiarJid);
  return meta.participantes.find((p) => p.ids.some((id) => propios.includes(id))) || null;
}

export async function esAdminOOwner(sock, grupo, sender) {
  if (isOwner(sender)) return true;
  const participante = buscarParticipante(await metadatos(sock, grupo), sender);
  return Boolean(participante && participante.admin);
}

function contextoDe(msg) {
  let contenido = msg.message;
  for (let i = 0; i < 4 && contenido; i++) {
    const interno = contenido.ephemeralMessage?.message || contenido.viewOnceMessage?.message || contenido.viewOnceMessageV2?.message || contenido.documentWithCaptionMessage?.message;
    if (!interno) break;
    contenido = interno;
  }
  if (!contenido) return null;
  for (const valor of Object.values(contenido)) {
    if (valor && typeof valor === "object" && valor.contextInfo) return valor.contextInfo;
  }
  return null;
}

export function objetivoDe({ msg, cleanText }) {
  const info = contextoDe(msg);
  const numero = (cleanText.split(/\s+/)[1] || "").replace(/\D/g, "");
  return info?.mentionedJid?.[0] || info?.participant || (numero.length >= 8 ? `${numero}@s.whatsapp.net` : null);
}

export async function ajustarMenciones(sock, grupo, contenido) {
  if (!esGrupo(grupo) || !contenido || !contenido.mentions || !contenido.mentions.length) return contenido;
  const meta = await metadatos(sock, grupo);
  if (!meta) return contenido;

  const utilidades = await cargarUtilidadesLid();
  const cambios = new Map();
  for (const jid of contenido.mentions) {
    let destino = buscarParticipante(meta, jid)?.id;
    if (!destino && utilidades && utilidades.esLid(jid)) {
      const real = utilidades.jidDe(jid);
      if (real) destino = buscarParticipante(meta, real)?.id || real;
    }
    if (destino && limpiarJid(destino) !== limpiarJid(jid)) cambios.set(jid, destino);
  }
  if (!cambios.size) return contenido;

  const reemplazar = (texto) => {
    if (typeof texto !== "string") return texto;
    let nuevo = texto;
    for (const [viejo, id] of cambios) {
      nuevo = nuevo.replace(new RegExp(`@${numeroDe(viejo)}(?!\\d)`, "g"), `@${numeroDe(id)}`);
    }
    return nuevo;
  };

  return {
    ...contenido,
    ...(contenido.text !== undefined ? { text: reemplazar(contenido.text) } : {}),
    ...(contenido.caption !== undefined ? { caption: reemplazar(contenido.caption) } : {}),
    mentions: contenido.mentions.map((jid) => cambios.get(jid) || jid)
  };
}

export function comandoGrupo({ emoji, titulo, admin = true, botAdmin = false }, ejecutar) {
  return async (ctx) => {
    const { sock, from, sender, msg } = ctx;
    const responder = (texto, mentions = []) => sock.sendMessage(from, { text: texto, mentions }, { quoted: msg });
    const avisar = (texto) => responder(aviso(emoji, titulo, texto));

    if (!esGrupo(from)) return avisar("Este comando solo funciona en grupos.");

    const meta = await metadatos(sock, from);
    if (!meta) return avisar("No fue posible obtener la información del grupo. Intenta nuevamente.");

    const quien = buscarParticipante(meta, sender);
    const autorizado = msg.key.fromMe || isOwner(sender) || Boolean(quien && quien.admin);
    if (admin && !autorizado) return avisar("Solo los administradores pueden usar este comando.");

    const bot = buscarBot(sock, meta);
    if (botAdmin && !(bot && bot.admin)) {
      return avisar("Necesito ser administrador del grupo para ejecutar esta acción.");
    }

    return ejecutar({ ...ctx, meta, quien, bot, responder, avisar });
  };
}

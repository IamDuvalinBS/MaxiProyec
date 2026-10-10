import { isOwner } from "../../motores/owner.js";

const VIGENCIA_METADATOS_MS = 60 * 1000;
const VIGENCIA_ENLACE_MS = 10 * 60 * 1000;
const metadatosGuardados = new Map();
const metadatosPendientes = new Map();
const enlacesGuardados = new Map();

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

export function objetivoDe({ msg, cleanText }) {
  const info = msg.message?.extendedTextMessage?.contextInfo;
  const numero = (cleanText.split(/\s+/)[1] || "").replace(/\D/g, "");
  return info?.mentionedJid?.[0] || info?.participant || (numero.length >= 8 ? `${numero}@s.whatsapp.net` : null);
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

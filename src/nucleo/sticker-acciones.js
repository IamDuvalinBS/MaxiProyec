import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import { obtenerBase } from "../../motores/db.js";
import { isOwner } from "../../motores/owner.js";
import { esGrupo, metadatos, buscarParticipante, buscarBot, numeroDe, ajustarMenciones, aviso, olvidarMetadatos, enlaceDeGrupo } from "../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../economia/estilo.js";
import { sumarAdvertencia, limpiarAdvertencias } from "../../motores/db.js";
import { LIMITE_ADVERTENCIAS } from "../comandos/grupos/warn.js";
import { crearStickerConMetaFijo, desenvolverVistaUnica } from "./sticker.js";

// ═══════════════ STICKERS DE ACCIÓN ═══════════════
// Un admin registra un sticker con ".s cerrar" / ".s abrir". Se guarda su huella SHA-256 (la misma que WhatsApp
// entrega en stickerMessage.fileSha256). Cuando un admin envía ese sticker en el grupo, el bot ejecuta la acción.
// Los registros son por grupo y se guardan en data/stickers-acciones.json + MongoDB (colección stickers_acciones).

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "stickers-acciones.json");
const COLECCION = "stickers_acciones";
const MAX_POR_GRUPO = 50;
const MAX_IMAGEN_BYTES = 15 * 1024 * 1024;
const ESPERA_ACCION_MS = 3000;

// tipo "ajuste": cambia un ajuste del grupo · "grupo": actúa sobre el grupo · "objetivo": actúa sobre la persona
// a la que el admin le responde con el sticker (o menciona).
// botAdmin: el bot necesita ser admin del grupo. verbo: cómo se dice en el aviso de registro.
export const ACCIONES = {
  cerrar: { emoji: "🔒", tipo: "ajuste", ajuste: "announcement", botAdmin: true, verbo: "cierra el grupo", hecho: "Cerró el grupo (solo admins pueden escribir)." },
  abrir: { emoji: "🔓", tipo: "ajuste", ajuste: "not_announcement", botAdmin: true, verbo: "abre el grupo", hecho: "Abrió el grupo (todos escriben)." },
  tag: { emoji: "📣", tipo: "grupo", botAdmin: false, verbo: "menciona a todos", hecho: "Mencionó a todos los miembros." },
  link: { emoji: "🔗", tipo: "grupo", botAdmin: true, verbo: "manda el link del grupo", hecho: "Envió el link del grupo." },
  delmsg: { emoji: "🗑️", tipo: "objetivo", mensaje: true, botAdmin: true, verbo: "borra el mensaje citado", hecho: "Eliminó un mensaje." },
  warn: { emoji: "⚠️", tipo: "objetivo", botAdmin: false, verbo: "advierte al usuario citado", hecho: "Advirtió a un usuario." },
  unwarn: { emoji: "🧹", tipo: "objetivo", botAdmin: false, verbo: "quita las advertencias del usuario citado", hecho: "Retiró las advertencias de un usuario." },
  kick: { emoji: "😿", tipo: "objetivo", botAdmin: true, verbo: "expulsa al usuario citado", hecho: "Expulsó a un usuario." },
  promote: { emoji: "🚂", tipo: "objetivo", botAdmin: true, verbo: "da admin al usuario citado", hecho: "Dio admin a un usuario." },
  demote: { emoji: "🍂", tipo: "objetivo", botAdmin: true, verbo: "quita el admin al usuario citado", hecho: "Quitó el admin a un usuario." }
};

const SUBCOMANDOS = {
  cerrar: "cerrar", close: "cerrar",
  abrir: "abrir", open: "abrir",
  tag: "tag", todos: "tag", hidetag: "tag", tagall: "tag",
  link: "link", enlace: "link",
  delmsg: "delmsg", borrarmsg: "delmsg", delmensaje: "delmsg",
  warn: "warn", advertir: "warn",
  unwarn: "unwarn", quitarwarn: "unwarn",
  kick: "kick", expulsar: "kick", echar: "kick",
  promote: "promote", promover: "promote", admin: "promote",
  demote: "demote", degradar: "demote",
  lista: "lista", list: "lista",
  eliminar: "eliminar", borrar: "eliminar", del: "eliminar",
  ayuda: "ayuda", help: "ayuda"
};

// ───────────── Almacenamiento permanente ─────────────
// registro[grupo][huellaHex] = { accion, por, nombre, fecha, origen }
let registro = {};

try {
  if (fs.existsSync(ARCHIVO)) registro = JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) || {};
} catch (e) {
  console.log(`❌ No se pudo leer los stickers de acción: ${e.message}`);
  try {
    fs.copyFileSync(ARCHIVO, `${ARCHIVO}.corrupto`);
  } catch {}
  registro = {};
}

function guardarLocal() {
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(registro));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudo guardar los stickers de acción: ${e.message}`);
  }
}

function coleccion() {
  const base = obtenerBase();
  return base ? base.collection(COLECCION) : null;
}

function guardarEnMongo(grupo) {
  const col = coleccion();
  if (!col) return;
  const entrada = registro[grupo];
  const op = entrada && Object.keys(entrada).length
    ? col.replaceOne({ _id: grupo }, { _id: grupo, stickers: entrada }, { upsert: true })
    : col.deleteOne({ _id: grupo });
  op.catch((e) => console.log(`❌ No se pudo guardar los stickers de ${grupo} en MongoDB: ${e.message}`));
}

function guardar(grupo) {
  if (registro[grupo] && !Object.keys(registro[grupo]).length) delete registro[grupo];
  guardarLocal();
  guardarEnMongo(grupo);
}

// Une lo de MongoDB con lo local (si hay conflicto manda MongoDB) y sube lo que solo existía en el archivo.
async function cargarDesdeMongo() {
  for (let i = 0; i < 30 && !coleccion(); i++) await new Promise((r) => setTimeout(r, 1000));
  const col = coleccion();
  if (!col) return console.log("⚠️ MongoDB no disponible: los stickers de acción quedan solo en el archivo local.");
  try {
    const docs = await col.find({}).toArray();
    let subidos = 0;
    const remotos = new Set();
    for (const { _id, stickers } of docs) {
      remotos.add(_id);
      const local = registro[_id] || {};
      const union = { ...local, ...(stickers || {}) };
      if (Object.keys(union).length !== Object.keys(stickers || {}).length) {
        registro[_id] = union;
        guardarEnMongo(_id);
        subidos++;
      } else registro[_id] = union;
    }
    for (const grupo of Object.keys(registro)) {
      if (!remotos.has(grupo)) {
        guardarEnMongo(grupo);
        subidos++;
      }
    }
    guardarLocal();
    console.log(`✅ Stickers de acción cargados desde MongoDB: ${docs.length} grupos (subidos: ${subidos})`);
  } catch (e) {
    console.log(`❌ No se pudieron cargar los stickers de acción desde MongoDB: ${e.message}`);
  }
}

cargarDesdeMongo();

// ───────────── Huellas ─────────────
// WhatsApp entrega fileSha256 como Buffer/Uint8Array, pero según la versión puede llegar como base64, como
// {type:"Buffer",data:[...]} o como objeto con índices numéricos. Todo se convierte a hex (64 caracteres).
export function normalizarHuella(valor) {
  if (!valor) return null;
  let buf = null;
  if (typeof valor === "string") {
    if (/^[0-9a-f]{64}$/i.test(valor)) return valor.toLowerCase();
    buf = Buffer.from(valor, "base64");
  } else if (Buffer.isBuffer(valor) || valor instanceof Uint8Array) {
    buf = Buffer.from(valor);
  } else if (Array.isArray(valor)) {
    buf = Buffer.from(valor);
  } else if (typeof valor === "object") {
    if (valor.type === "Buffer" && Array.isArray(valor.data)) buf = Buffer.from(valor.data);
    else {
      const numeros = Object.values(valor);
      if (numeros.length && numeros.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) buf = Buffer.from(numeros);
    }
  }
  return buf && buf.length === 32 ? buf.toString("hex") : null;
}

export const huellaDeSticker = (stickerMessage) => normalizarHuella(stickerMessage?.fileSha256);
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

// ───────────── Consultas ─────────────
export function buscarRegistro(grupo, huella) {
  return (huella && registro[grupo]?.[huella]) || null;
}

export function listarRegistros(grupo) {
  return Object.entries(registro[grupo] || {})
    .map(([huella, datos]) => ({ huella, ...datos }))
    .sort((a, b) => (a.fecha || 0) - (b.fecha || 0) || a.huella.localeCompare(b.huella));
}

function buscarPorOrigen(grupo, origen) {
  return origen ? listarRegistros(grupo).find((r) => r.origen === origen) || null : null;
}

// Devuelve { estado: "nuevo" | "igual" | "distinto" | "lleno", existente? }
export function registrarSticker(grupo, huella, accion, quien = {}, origen = null) {
  const existente = registro[grupo]?.[huella];
  if (existente) return { estado: existente.accion === accion ? "igual" : "distinto", existente };
  if (Object.keys(registro[grupo] || {}).length >= MAX_POR_GRUPO) return { estado: "lleno" };
  (registro[grupo] || (registro[grupo] = {}))[huella] = {
    accion,
    por: quien.por || "",
    nombre: quien.nombre || "",
    fecha: Date.now(),
    ...(origen ? { origen } : {})
  };
  guardar(grupo);
  return { estado: "nuevo" };
}

export function eliminarSticker(grupo, huella) {
  if (!registro[grupo]?.[huella]) return false;
  delete registro[grupo][huella];
  guardar(grupo);
  return true;
}

// ───────────── Lectura del mensaje ─────────────
function contenidoDe(message) {
  let m = desenvolverVistaUnica(message) || {};
  if (m.documentWithCaptionMessage?.message) m = desenvolverVistaUnica(m.documentWithCaptionMessage.message) || m.documentWithCaptionMessage.message;
  return m;
}

const esDocumentoImagen = (m) => Boolean(m?.documentMessage && /^image\//i.test(m.documentMessage.mimetype || ""));

// Qué trae el mensaje: imagen propia, imagen/sticker/video citado o nada.
function fuenteDeMensaje(msg) {
  const m = contenidoDe(msg?.message);
  if (m.imageMessage || esDocumentoImagen(m)) return { tipo: "imagen", objetivo: { key: msg.key, message: m } };
  if (m.videoMessage) return { tipo: "video" };

  const ctx = [m.extendedTextMessage, m.imageMessage, m.videoMessage, m.documentMessage, m.stickerMessage]
    .map((x) => x?.contextInfo)
    .find((c) => c?.quotedMessage);
  if (!ctx) return { tipo: "nada" };

  const q = contenidoDe(ctx.quotedMessage);
  if (q.stickerMessage) return { tipo: "sticker", sticker: q.stickerMessage };
  if (q.imageMessage || esDocumentoImagen(q)) {
    return {
      tipo: "imagen",
      objetivo: { key: { remoteJid: msg.key.remoteJid, id: ctx.stanzaId, participant: ctx.participant }, message: q }
    };
  }
  if (q.videoMessage) return { tipo: "video" };
  return { tipo: "nada" };
}

// ───────────── Permisos ─────────────
async function permisosDeGrupo(sock, from, sender, msg, { fresco = false } = {}) {
  const meta = await metadatos(sock, from, fresco);
  if (!meta) return null;
  const quien = buscarParticipante(meta, sender);
  const bot = buscarBot(sock, meta);
  return {
    meta,
    esAdmin: Boolean(msg?.key?.fromMe || isOwner(sender) || (quien && quien.admin)),
    botEsAdmin: Boolean(bot && bot.admin)
  };
}

const idsEnviados = new Set();
function recordarEnvio(enviado) {
  const id = enviado?.key?.id;
  if (!id) return;
  idsEnviados.add(id);
  setTimeout(() => idsEnviados.delete(id), 60000).unref?.();
}

const ultimaAccion = new Map();

// ───────────── Reconocimiento automático (se llama desde index.js) ─────────────
// Devuelve true si el sticker estaba registrado en este grupo (el mensaje ya quedó atendido).
export async function ejecutarStickerAccion({ sock, from, sender, msg, sticker }) {
  if (!esGrupo(from) || !sticker) return false;
  if (msg?.key?.fromMe && idsEnviados.has(msg.key.id)) return true;   // el sticker que el bot mismo acaba de enviar

  const huella = huellaDeSticker(sticker);
  const datos = buscarRegistro(from, huella);
  if (!datos) return false;

  const accion = ACCIONES[datos.accion];
  if (!accion) return true;

  // 1) Filtro rápido con la información en caché: un miembro normal no provoca consultas nuevas.
  let permisos = await permisosDeGrupo(sock, from, sender, msg);
  if (!permisos || !permisos.esAdmin) return true;

  // 2) Antes de actuar se confirma con datos frescos (por si le quitaron el admin hace poco).
  permisos = await permisosDeGrupo(sock, from, sender, msg, { fresco: true });
  if (!permisos || !permisos.esAdmin) return true;

  const clave = `${from}|${datos.accion}`;
  if (Date.now() - (ultimaAccion.get(clave) || 0) < ESPERA_ACCION_MS) return true;
  ultimaAccion.set(clave, Date.now());

  const responder = async (contenido) => {
    try {
      await sock.sendMessage(from, await ajustarMenciones(sock, from, contenido), { quoted: msg });
    } catch (e) {
      console.log("❌ No se pudo responder al sticker de acción: " + e.message);
    }
  };

  if (accion.botAdmin && !permisos.botEsAdmin) {
    await responder({ text: aviso("⚠️", "STICKER", "Necesito ser administrador del grupo para ejecutar esa acción.") });
    return true;
  }

  try {
    if (accion.tipo === "ajuste") await accionAjuste({ sock, from, sender, datos, accion, responder });
    else if (accion.tipo === "grupo") await accionGrupo({ sock, from, sender, sticker, permisos, datos, accion, responder });
    else await accionObjetivo({ sock, from, sender, sticker, permisos, datos, accion, responder });
  } catch (e) {
    console.log(`❌ Sticker de acción (${datos.accion}) falló en ${from}: ${e.message}`);
    await responder({ text: aviso("❌", "STICKER", `No fue posible ejecutar *${datos.accion}*.`) });
  }
  return true;
}

// ───────────── Acciones ─────────────
const avisoHecho = (sender, accion) => ({ text: `» @${numeroDe(sender)} *realizó cambios:*\n> ${accion.hecho}`, mentions: [sender] });

async function accionAjuste({ sock, from, sender, accion, responder }) {
  await sock.groupSettingUpdate(from, accion.ajuste);
  await responder(avisoHecho(sender, accion));
}

async function accionGrupo({ sock, from, sender, sticker, permisos, datos, accion, responder }) {
  if (datos.accion === "tag") {
    const citado = contenidoDe(sticker?.contextInfo?.quotedMessage);
    const textoCitado = citado.conversation || citado.extendedTextMessage?.text || citado.imageMessage?.caption || citado.videoMessage?.caption || "";
    const texto = textoCitado || "📣 Atención a todos los miembros del grupo.";
    await sock.sendMessage(from, { text: texto, mentions: permisos.meta.participantes.map((p) => p.id) });
    return;
  }
  if (datos.accion === "link") {
    const enlace = await enlaceDeGrupo(sock, from);
    if (!enlace) return responder({ text: aviso("❌", "STICKER", "No pude obtener el link del grupo.") });
    return responder({ text: `🔗 *${permisos.meta.asunto || "Grupo"}*\n${enlace}` });
  }
  await responder(avisoHecho(sender, accion));
}

// Persona objetivo: a quien responde el sticker, o la primera mención.
function objetivoDeSticker(sticker) {
  const ctx = sticker?.contextInfo;
  return ctx?.mentionedJid?.[0] || ctx?.participant || null;
}

async function accionObjetivo({ sock, from, sender, sticker, permisos, datos, accion, responder }) {
  const { meta } = permisos;
  const ctx = sticker?.contextInfo;
  const dicho = (texto) => responder({ text: aviso(accion.emoji, datos.accion.toUpperCase(), texto) });

  // Borrar un mensaje no necesita persona, solo el mensaje citado.
  if (accion.mensaje) {
    if (!ctx?.stanzaId) return dicho("Envía el sticker *respondiendo* al mensaje que quieres borrar.");
    const autor = ctx.participant;
    const bot = buscarBot(sock, meta);
    const esDelBot = Boolean(bot && autor && buscarParticipante(meta, autor) === bot);
    await sock.sendMessage(from, { delete: { remoteJid: from, fromMe: esDelBot, id: ctx.stanzaId, participant: autor } });
    return;
  }

  const usuario = objetivoDeSticker(sticker);
  if (!usuario) return dicho(`Envía el sticker *respondiendo* al mensaje de la persona (o mencionándola) para *${datos.accion}*.`);

  const objetivo = buscarParticipante(meta, usuario);
  if (!objetivo) return dicho("Ese usuario no está en el grupo.");
  const bot = buscarBot(sock, meta);
  const quien = buscarParticipante(meta, sender);

  if (datos.accion === "kick") {
    if (objetivo.superadmin) return dicho("No es posible eliminar al creador del grupo.");
    if (objetivo === bot) return dicho("No es posible eliminar al propio bot.");
    if (objetivo === quien) return dicho("No puedes eliminarte a ti mismo.");
    await sock.groupParticipantsUpdate(from, [objetivo.id], "remove");
    olvidarMetadatos(from);
    return responder({
      text: tarjetaMarcada({
        emoji: "😿",
        titulo: "USUARIO ELIMINADO",
        relato: "Un integrante menos en el grupo...",
        lineas: ["⧼🦉⧽ *Usuario eliminado*::", `> ${mencion(objetivo.id)}`, "⧼🦖⧽ *Responsable*::", `> ${mencion(sender)} eliminó al usuario.`]
      }),
      mentions: [objetivo.id, sender]
    });
  }

  if (datos.accion === "promote") {
    if (objetivo.admin) return dicho("Ese usuario ya es administrador.");
    await sock.groupParticipantsUpdate(from, [objetivo.id], "promote");
    olvidarMetadatos(from);
    return responder({
      text: tarjetaMarcada({
        emoji: "🚂",
        titulo: "NUEVO ADMIN",
        relato: "Un nuevo administrador ha llegado a este grupo.",
        lineas: ["⧼🎲⧽ *Nuevo admin*::", `> ${mencion(objetivo.id)}`, "⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} le otorgó admin.`]
      }),
      mentions: [objetivo.id, sender]
    });
  }

  if (datos.accion === "demote") {
    if (!objetivo.admin) return dicho("Ese usuario no es administrador.");
    if (objetivo.superadmin) return dicho("No es posible retirar el rol al creador del grupo.");
    if (objetivo === bot) return dicho("No es posible retirar el rol al propio bot.");
    await sock.groupParticipantsUpdate(from, [objetivo.id], "demote");
    olvidarMetadatos(from);
    return responder({
      text: tarjetaMarcada({
        emoji: "🍂",
        titulo: "ADMIN REMOVIDO",
        relato: "Un administrador ha dejado de serlo en este grupo.",
        lineas: ["⧼🥀⧽ *Admin removido*::", `> ${mencion(objetivo.id)}`, "⧼🎯⧽ *Responsable*::", `> ${mencion(sender)} le retiró el admin.`]
      }),
      mentions: [objetivo.id, sender]
    });
  }

  if (datos.accion === "unwarn") {
    const previas = await limpiarAdvertencias(from, numeroDe(objetivo.id));
    if (previas === null) return dicho("La base de datos no está disponible en este momento.");
    if (!previas) return dicho("Ese usuario no tiene advertencias registradas.");
    return responder({
      text: tarjetaMarcada({
        emoji: "🧹",
        titulo: "ADVERTENCIAS RETIRADAS",
        relato: "Se han eliminado todas las advertencias del usuario.",
        lineas: ["⧼🌿⧽ *Usuario*::", `> ${mencion(objetivo.id)}`, "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} retiró las advertencias.`]
      }),
      mentions: [objetivo.id, sender]
    });
  }

  if (datos.accion === "warn") {
    if (objetivo.admin) return dicho("No es posible advertir a un administrador.");
    const total = await sumarAdvertencia(from, numeroDe(objetivo.id));
    if (total === null) return dicho("La base de datos no está disponible en este momento.");

    const alLimite = total >= LIMITE_ADVERTENCIAS;
    let expulsado = false;
    if (alLimite && bot && bot.admin) {
      try {
        await sock.groupParticipantsUpdate(from, [objetivo.id], "remove");
        await limpiarAdvertencias(from, numeroDe(objetivo.id));
        olvidarMetadatos(from);
        expulsado = true;
      } catch {}
    }
    const relato = expulsado
      ? "El usuario alcanzó el límite de advertencias y fue expulsado del grupo."
      : alLimite
        ? "El usuario alcanzó el límite de advertencias, pero no fue posible expulsarlo."
        : "Un integrante ha recibido una advertencia formal.";
    return responder({
      text: tarjetaMarcada({
        emoji: "🦑",
        titulo: "USUARIO ADVERTIDO",
        relato,
        lineas: [
          "⧼🌻⧽ *Usuario advertido*::", `> ${mencion(objetivo.id)}`,
          "⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} advirtió al usuario.`,
          "⧼📊⧽ *Advertencias*::", `> ${Math.min(total, LIMITE_ADVERTENCIAS)}/${LIMITE_ADVERTENCIAS}${expulsado ? " (usuario expulsado)" : ""}`
        ]
      }),
      mentions: [objetivo.id, sender]
    });
  }
}

// ───────────── Subcomandos de ".s" ─────────────
const AYUDA = [
  "⧼🧷⧽ *STICKERS DE ACCIÓN*",
  "",
  "Convierte una imagen en sticker y úsalo como botón. Cuando un admin lo envía, el bot hace la acción sin escribir nada.",
  "",
  "*Registrar (solo admins)*",
  "Envía una imagen con el texto *.s <acción>*, o responde a una imagen (o sticker) con *.s <acción>*",
  "",
  "*Acciones del grupo*",
  "• *.s cerrar* / *.s abrir* → cierra o abre el grupo",
  "• *.s tag* → menciona a todos (si respondes a un mensaje, usa su texto)",
  "• *.s link* → manda el link del grupo",
  "",
  "*Acciones sobre alguien* (envía el sticker respondiendo a su mensaje)",
  "• *.s warn* → le da una advertencia (3 lo expulsan)",
  "• *.s unwarn* → le quita las advertencias",
  "• *.s kick* → lo expulsa",
  "• *.s promote* / *.s demote* → le da o quita el admin",
  "• *.s delmsg* → borra el mensaje al que respondes",
  "",
  "*Administrar*",
  "• *.s lista* → ver los stickers registrados",
  "• *.s eliminar* respondiendo al sticker, o *.s eliminar 2* (número de la lista)",
  "",
  "> Solo los admins pueden activarlos. Tip: mantén presionado el sticker y elige *Agregar a favoritos*."
].join("\n");

const fechaCorta = (ms) => {
  try {
    return new Date(ms).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" });
  } catch {
    return "";
  }
};

async function descargar(objetivo) {
  const buffer = await downloadMediaMessage(objetivo, "buffer", {});
  if (!buffer || !buffer.length) throw new Error("archivo vacío");
  return buffer;
}

async function registrarDesdeMensaje({ sock, from, sender, msg, reply }, accion) {
  const quien = { por: sender, nombre: String(msg?.pushName || "").slice(0, 30) };
  const config = ACCIONES[accion];
  const fuente = fuenteDeMensaje(msg);

  if (fuente.tipo === "video") {
    return reply({ text: aviso("❌", "STICKER", "Solo imágenes. Envía o responde a una *imagen* (no video ni GIF).") });
  }
  if (fuente.tipo === "nada") {
    return reply({ text: aviso("🖼️", "STICKER", `Envía una imagen con *.s ${accion}* o responde a una imagen o sticker con ese comando.`) });
  }

  // Responder a un sticker ya existente: se registra tal cual lo tiene WhatsApp, sin reconvertirlo.
  if (fuente.tipo === "sticker") {
    const huella = huellaDeSticker(fuente.sticker);
    if (!huella) return reply({ text: aviso("❌", "STICKER", "No pude leer la huella de ese sticker. Envíalo de nuevo e intenta otra vez.") });
    return confirmarRegistro(reply, accion, config, registrarSticker(from, huella, accion, quien));
  }

  let original;
  try {
    original = await descargar(fuente.objetivo);
  } catch (e) {
    console.log("❌ Error descargando la imagen para sticker de acción: " + e.message);
    return reply({ text: aviso("❌", "STICKER", "No se pudo descargar la imagen. Envíala de nuevo.") });
  }
  if (original.length > MAX_IMAGEN_BYTES) {
    return reply({ text: aviso("❌", "STICKER", "La imagen es demasiado pesada (máximo 15 MB).") });
  }

  // Misma imagen ya registrada en este grupo: no se crea otro sticker.
  const origen = sha256(original);
  const repetida = buscarPorOrigen(from, origen);
  if (repetida) {
    return confirmarRegistro(reply, accion, config, { estado: repetida.accion === accion ? "igual" : "distinto", existente: repetida });
  }
  if (Object.keys(registro[from] || {}).length >= MAX_POR_GRUPO) {
    return confirmarRegistro(reply, accion, config, { estado: "lleno" });
  }

  let webp;
  try {
    webp = await crearStickerConMetaFijo(original);
  } catch (e) {
    console.log("❌ Error creando el sticker de acción: " + e.message);
    return reply({ text: aviso("❌", "STICKER", "La imagen no es válida o no se pudo convertir en sticker. Prueba con otra (JPG, PNG o WebP).") });
  }

  let enviado;
  try {
    enviado = await sock.sendMessage(from, { sticker: webp }, { quoted: msg });
  } catch (e) {
    console.log("❌ Error enviando el sticker de acción: " + e.message);
    return reply({ text: aviso("❌", "STICKER", "No pude enviar el sticker al grupo. Intenta de nuevo.") });
  }
  recordarEnvio(enviado);

  // La huella que cuenta es la del sticker tal como lo recibe WhatsApp; si no viene en el mensaje enviado, la del archivo.
  const local = sha256(webp);
  const huella = huellaDeSticker(enviado?.message?.stickerMessage) || local;
  if (huella !== local) console.log(`ℹ️ Huella del sticker enviado (${huella}) distinta a la del archivo (${local}); se usa la de WhatsApp.`);

  return confirmarRegistro(reply, accion, config, registrarSticker(from, huella, accion, quien, origen));
}

function confirmarRegistro(reply, accion, config, resultado) {
  if (resultado.estado === "nuevo") {
    return reply({
      text: aviso(config.emoji, "STICKER REGISTRADO", `Quedó guardado como *${accion}*. Cuando un admin lo envíe, el bot ${config.verbo} solo.${config.tipo === "objetivo" && !config.mensaje ? " (envíalo respondiendo al mensaje de la persona)" : ""}`) +
        "\n\n> Mantenlo presionado → *Agregar a favoritos* para tenerlo a la mano."
    });
  }
  if (resultado.estado === "igual") return reply({ text: aviso("ℹ️", "STICKER", `Ese sticker ya estaba registrado para *${accion}*.`) });
  if (resultado.estado === "distinto") {
    return reply({ text: aviso("⚠️", "STICKER", `Ese sticker ya está registrado como *${resultado.existente.accion}*. Elimínalo con *.s eliminar* antes de usarlo para *${accion}*.`) });
  }
  return reply({ text: aviso("⚠️", "STICKER", `Este grupo ya tiene ${MAX_POR_GRUPO} stickers registrados. Elimina alguno con *.s eliminar*.`) });
}

function mostrarLista(grupo) {
  const lista = listarRegistros(grupo);
  if (!lista.length) {
    return "⧼🧷⧽ *STICKERS REGISTRADOS*\n\n> Este grupo todavía no tiene stickers registrados.\n\nUsa *.s ayuda* para ver cómo registrarlos.";
  }
  const lineas = lista.map((r, i) => {
    const emoji = ACCIONES[r.accion]?.emoji || "▫️";
    const quien = r.nombre || (r.por ? "+" + numeroDe(r.por) : "");
    return `${i + 1}. ${emoji} *${r.accion}*${quien ? ` — ${quien}` : ""}${r.fecha ? ` · ${fechaCorta(r.fecha)}` : ""}`;
  });
  return ["⧼🧷⧽ *STICKERS REGISTRADOS*", "", ...lineas, "", "> Para borrar uno: *.s eliminar N* o responde al sticker con *.s eliminar*."].join("\n");
}

async function eliminarDesdeMensaje({ from, msg, cleanText, reply }) {
  const fuente = fuenteDeMensaje(msg);
  let huella = null;

  if (fuente.tipo === "sticker") {
    huella = huellaDeSticker(fuente.sticker);
    if (!huella) return reply({ text: aviso("❌", "STICKER", "No pude leer la huella de ese sticker.") });
    if (!buscarRegistro(from, huella)) return reply({ text: aviso("ℹ️", "STICKER", "Ese sticker no está registrado en este grupo.") });
  } else {
    const numero = parseInt((cleanText.trim().split(/\s+/)[2] || "").replace(/\D/g, ""), 10);
    if (!numero) {
      return reply({ text: aviso("🗑️", "STICKER", "Responde al sticker con *.s eliminar* o usa *.s eliminar N* (el número sale en *.s lista*).") });
    }
    const elegido = listarRegistros(from)[numero - 1];
    if (!elegido) return reply({ text: aviso("❌", "STICKER", `No existe el sticker número ${numero}. Mira *.s lista*.`) });
    huella = elegido.huella;
  }

  const datos = buscarRegistro(from, huella);
  eliminarSticker(from, huella);
  return reply({ text: aviso("🗑️", "STICKER ELIMINADO", `Se eliminó el sticker de *${datos.accion}*.`) });
}

// Devuelve true si el mensaje era un subcomando de acción (el ".s" normal sigue funcionando igual si devuelve false).
export async function subcomandoS({ sock, from, sender, cleanText, msg, reply }) {
  const sub = SUBCOMANDOS[(cleanText.trim().split(/\s+/)[1] || "").toLowerCase()];
  if (!sub) return false;

  if (sub === "ayuda") {
    await reply({ text: AYUDA });
    return true;
  }

  if (!esGrupo(from)) {
    await reply({ text: aviso("🧷", "STICKER", "Los stickers de acción solo funcionan en grupos.") });
    return true;
  }

  const permisos = await permisosDeGrupo(sock, from, sender, msg, { fresco: true });
  if (!permisos) {
    await reply({ text: aviso("❌", "STICKER", "No fue posible obtener la información del grupo. Intenta nuevamente.") });
    return true;
  }
  if (!permisos.esAdmin) {
    await reply({ text: aviso("🚫", "STICKER", "Solo los administradores pueden registrar, ver o eliminar stickers de acción.") });
    return true;
  }

  try {
    if (sub === "lista") await reply({ text: mostrarLista(from) });
    else if (sub === "eliminar") await eliminarDesdeMensaje({ from, msg, cleanText, reply });
    else await registrarDesdeMensaje({ sock, from, sender, msg, reply }, sub);
  } catch (e) {
    console.log(`❌ Error en ".s ${sub}": ${e.stack || e.message}`);
    await reply({ text: aviso("❌", "STICKER", "Ocurrió un error inesperado. Intenta de nuevo.") });
  }
  return true;
}

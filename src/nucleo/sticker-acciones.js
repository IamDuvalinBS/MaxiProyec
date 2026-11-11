import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import { obtenerBase } from "../../motores/db.js";
import { isOwner } from "../../motores/owner.js";
import { esGrupo, metadatos, buscarParticipante, buscarBot, numeroDe, ajustarMenciones, aviso } from "../grupos/nucleo.js";
import { crearStickerConMetaFijo, desenvolverVistaUnica } from "./sticker.js";

// ═══════════════ STICKERS DE ACCIÓN ═══════════════
// Un admin registra un sticker con ".s cerrar" / ".s abrir". Se guarda su huella SHA-256 (la misma que WhatsApp
// entrega en stickerMessage.fileSha256). Cuando un admin envía ese sticker en el grupo, el bot ejecuta la acción.
// Los registros son por grupo y se guardan en data/stickers-acciones.json + MongoDB (colección stickers_acciones).

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "stickers-acciones.json");
const COLECCION = "stickers_acciones";
const MAX_POR_GRUPO = 30;
const MAX_IMAGEN_BYTES = 15 * 1024 * 1024;
const ESPERA_ACCION_MS = 3000;

export const ACCIONES = {
  cerrar: { emoji: "🔒", ajuste: "announcement", hecho: "Cerró el grupo (solo admins pueden escribir)." },
  abrir: { emoji: "🔓", ajuste: "not_announcement", hecho: "Abrió el grupo (todos escriben)." }
};

const SUBCOMANDOS = {
  cerrar: "cerrar", close: "cerrar",
  abrir: "abrir", open: "abrir",
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

  if (!permisos.botEsAdmin) {
    await responder({ text: aviso("⚠️", "STICKER", "Necesito ser administrador del grupo para ejecutar esa acción.") });
    return true;
  }

  try {
    await sock.groupSettingUpdate(from, accion.ajuste);
  } catch (e) {
    console.log(`❌ Sticker de acción (${datos.accion}) falló en ${from}: ${e.message}`);
    await responder({ text: aviso("❌", "STICKER", `No fue posible ${datos.accion} el grupo.`) });
    return true;
  }

  const texto = `» @${numeroDe(sender)} *realizó cambios:*\n> ${accion.hecho}`;
  await responder({ text: texto, mentions: [sender] });
  return true;
}

// ───────────── Subcomandos de ".s" ─────────────
const AYUDA = [
  "⧼🧷⧽ *STICKERS DE ACCIÓN*",
  "",
  "Convierte una imagen en sticker y úsalo como botón para abrir o cerrar el grupo.",
  "",
  "*Registrar (solo admins)*",
  "• Envía una imagen con el texto *.s cerrar* o *.s abrir*",
  "• O responde a una imagen (o a un sticker) con *.s cerrar* / *.s abrir*",
  "",
  "*Usar*",
  "Cualquier admin solo envía el sticker registrado y el bot abre o cierra el grupo. No hay que escribir nada.",
  "",
  "*Administrar*",
  "• *.s lista* → ver los stickers registrados",
  "• *.s eliminar* respondiendo al sticker, o *.s eliminar 2* (número de la lista)",
  "",
  "> Tip: mantén presionado el sticker y elige *Agregar a favoritos* para tenerlo a la mano."
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
      text: aviso(config.emoji, "STICKER REGISTRADO", `Quedó guardado para *${accion}* el grupo. Cuando un admin lo envíe, el bot lo ${accion === "cerrar" ? "cierra" : "abre"} solo.`) +
        "\n\n> Mantenlo presionado → *Agregar a favoritos* para tenerlo a la mano."
    });
  }
  if (resultado.estado === "igual") return reply({ text: aviso("ℹ️", "STICKER", `Ese sticker ya estaba registrado para *${accion}*.`) });
  if (resultado.estado === "distinto") {
    return reply({ text: aviso("⚠️", "STICKER", `Ese sticker ya está registrado para *${resultado.existente.accion}*. Elimínalo con *.s eliminar* antes de usarlo para *${accion}*.`) });
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

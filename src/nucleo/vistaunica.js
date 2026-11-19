// Vistas únicas (.revelar) — se guardan AL INSTANTE y para siempre en una carpeta local.
//
// Cómo funciona:
//   1. Cuando llega un mensaje nuevo (grupo o privado, de otra persona o de la propia cuenta del bot), se revisa SOLO ese
//      mensaje: si NO es foto/video/audio de "ver una vez", se descarta en microsegundos y no se hace nada más.
//   2. Si SÍ es de ver una vez, se descarga en el momento (cola de 2 a la vez para no ahogar Termux) y se guarda en
//      datos/vistaunica/<id>.bin + <id>.json. Nunca se borra solo.
//   3. .revelar <citando el mensaje> solo busca ese id en la carpeta y lo manda. No toca el servidor, no pide historial,
//      no lee el chat.
//
// NO se lee el chat, NO se procesa el historial (messaging-history.set) y NO se hace ningún sondeo periódico.
// Solo se mira cada mensaje que WhatsApp entrega por sí mismo, una sola vez, y solo si es reciente
// (VISTA_UNICA_MAX_EDAD_SEG, por defecto 6 horas: cubre los pendientes que llegan al reconectar, pero no historiales viejos).

import { downloadMediaMessage } from "@fer2809fl/baileys";
import fs from "fs";
import path from "path";

const CARPETA = path.join(process.cwd(), "datos", "vistaunica");
const MAX_EDAD_SEG = Number(process.env.VISTA_UNICA_MAX_EDAD_SEG) || 6 * 60 * 60;
const SIMULTANEAS = 2;
const MAX_COLA = 50;
const TIPOS = ["imageMessage", "videoMessage", "audioMessage"];
const ENVOLTURAS = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "deviceSentMessage", "documentWithCaptionMessage"];

// Diagnóstico: encendido por defecto, escribe solo en datos/vistaunica/debug.txt (DEPURAR_VISTAUNICA=1 además lo muestra en pantalla; =0 lo apaga).
const DEPURAR = process.env.DEPURAR_VISTAUNICA !== "0";
const DEPURAR_PANTALLA = process.env.DEPURAR_VISTAUNICA === "1";

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const nombreSeguro = (id) => String(id).replace(/[^A-Za-z0-9_-]/g, "_");

// ───────────── utilidades ─────────────

export function desenvolver(message) {
  let m = message;
  for (let i = 0; i < 5 && m; i++) {
    const clave = ENVOLTURAS.find((k) => m[k]);
    if (!clave) break;
    m = m[clave].message;
  }
  return m || null;
}

function esVistaUnica(message) {
  if (!message) return false;
  let m = message;
  for (let i = 0; i < 5 && m; i++) {
    if (m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension) return true;
    const clave = ENVOLTURAS.find((k) => m[k]);
    if (!clave) break;
    m = m[clave].message;
  }
  const interno = desenvolver(message);
  return TIPOS.some((t) => interno?.[t]?.viewOnce === true);
}

export function tieneClave(media) {
  const k = media?.mediaKey;
  return Boolean(k) && (typeof k === "string" ? k.length > 0 : (k.length ?? Object.keys(k).length) > 0);
}

export function segundosDe(msg) {
  const bruto = msg?.messageTimestamp;
  const seg = typeof bruto === "object" && bruto ? (bruto.toNumber ? bruto.toNumber() : Number(bruto.low)) : Number(bruto);
  return Number.isFinite(seg) && seg > 0 ? seg : 0;
}

function contexto(sock) {
  const ctx = {};
  if (typeof sock?.updateMediaMessage === "function") ctx.reuploadRequest = sock.updateMediaMessage;
  return ctx;
}

// ───────────── disco (permanente) ─────────────

function asegurarCarpeta() {
  try { fs.mkdirSync(CARPETA, { recursive: true }); } catch {}
}

const rutaBin = (id) => path.join(CARPETA, id + ".bin");
const rutaJson = (id) => path.join(CARPETA, id + ".json");

// El .json se escribe al final: si existe, la copia está completa.
function yaGuardada(id) {
  return fs.existsSync(rutaJson(id)) && fs.existsSync(rutaBin(id));
}

function guardarEnDisco(id, buffer, meta) {
  asegurarCarpeta();
  const tmp = rutaBin(id) + ".tmp";
  fs.writeFileSync(tmp, buffer);
  fs.renameSync(tmp, rutaBin(id));
  fs.writeFileSync(rutaJson(id), JSON.stringify(meta));
}

// Usado por .revelar. Devuelve { buffer, tipo, mimetype, caption, ptt, ... } o null.
export function buscarVistaUnica(idOriginal) {
  if (!idOriginal) return null;
  const id = nombreSeguro(idOriginal);
  try {
    const meta = JSON.parse(fs.readFileSync(rutaJson(id), "utf8"));
    const buffer = fs.readFileSync(rutaBin(id));
    return { buffer, ...meta };
  } catch {
    return null;
  }
}

// ───────────── cola de descargas ─────────────

const pendientes = [];
const enProceso = new Set();
let activas = 0;

async function descargar(sock, tarea) {
  const { key, interno, tipo } = tarea;
  const media = interno[tipo];
  let ultimo;
  for (let intento = 1; intento <= 2; intento++) {
    try {
      return await downloadMediaMessage({ key, message: interno }, "buffer", {}, contexto(sock));
    } catch (e) {
      ultimo = e;
      if (intento < 2) await esperar(2000);
    }
  }
  throw ultimo || new Error("descarga fallida");
}

async function procesar(sock, tarea) {
  const { id, key, interno, tipo } = tarea;
  const media = interno[tipo];
  const buffer = await descargar(sock, tarea);
  guardarEnDisco(id, buffer, {
    tipo,
    mimetype: media.mimetype || null,
    caption: media.caption || "",
    ptt: media.ptt ?? null,
    chat: key.remoteJid,
    participante: key.participant || null,
    deMi: Boolean(key.fromMe),
    guardado: Date.now()
  });
  console.log(`👁️ Vista única guardada (${tipo}, ${Math.round(buffer.length / 1024)} KB)`);
}

function bombear(sock) {
  while (activas < SIMULTANEAS && pendientes.length) {
    const tarea = pendientes.shift();
    activas++;
    procesar(sock, tarea)
      .catch((e) => console.log("👁️ No se pudo guardar la vista única: " + e.message))
      .finally(() => { activas--; enProceso.delete(tarea.id); bombear(sock); });
  }
}

// ───────────── evento (llamado desde index.js con cada mensaje que llega) ─────────────
// Muy barato: si el mensaje no es de ver una vez, sale de inmediato sin tocar disco ni red.

function escribir(texto) {
  if (DEPURAR_PANTALLA) console.log(texto);
  try {
    asegurarCarpeta();
    const ruta = path.join(CARPETA, "debug.txt");
    if (fs.existsSync(ruta) && fs.statSync(ruta).size > 300 * 1024) return;   // tope para no llenar el disco
    fs.appendFileSync(ruta, new Date().toISOString() + " " + texto + "\n");
  } catch {}
}

function depurar(msg) {
  const m = msg.message;
  if (m.conversation || m.extendedTextMessage || m.reactionMessage || m.stickerMessage || m.protocolMessage || m.senderKeyDistributionMessage) return;   // ruido: no interesa
  const interno = desenvolver(m);
  const tipo = TIPOS.find((t) => interno?.[t]);
  let campos = "-";
  if (tipo) {
    // Solo campos simples (sin claves, rutas ni miniaturas): sirven para ver qué marca trae el mensaje.
    campos = Object.entries(interno[tipo])
      .filter(([k, v]) => !/url|path|sha|key|thumb|enc|waveform|scan/i.test(k) && (v == null || ["string", "number", "boolean"].includes(typeof v)) && String(v).length < 40)
      .map(([k, v]) => `${k}=${v}`).join(" ");
  }
  const raiz = Object.keys(msg).filter((k) => !["key", "message"].includes(k)).join(",");
  const ctxMsg = Object.keys(m.messageContextInfo || {}).join(",");
  escribir(`[vu-debug] fromMe=${Boolean(msg.key.fromMe)} chat=${String(msg.key.remoteJid).slice(0, 12)} raiz=[${Object.keys(m).join(",")}] interno=[${Object.keys(interno || {}).join(",")}] viewOnce=${esVistaUnica(m)} clave=${tipo ? tieneClave(interno[tipo]) : "-"}`);
  if (tipo) escribir(`[vu-debug]   ${tipo}: ${campos}\n[vu-debug]   msg=[${raiz}] ctxMsg=[${ctxMsg}] ctxMedia=[${Object.keys(interno[tipo].contextInfo || {}).join(",")}]`);
}

function alLlegar(sock, msg) {
  if (!msg?.message || !msg.key?.id) return;
  if (DEPURAR) { try { depurar(msg); } catch {} }
  if (!esVistaUnica(msg.message)) return;

  const seg = segundosDe(msg);
  if (seg && Date.now() / 1000 - seg > MAX_EDAD_SEG) return;   // historial viejo: no se toca

  const interno = desenvolver(msg.message);
  const tipo = TIPOS.find((t) => interno?.[t]);
  if (!tipo) return;   // botones/menús interactivos también vienen envueltos como "ver una vez": se ignoran
  if (!tieneClave(interno[tipo])) {
    console.log(`👁️ Llegó una vista única (${tipo}) SIN clave de descifrado: no se puede guardar.`);
    return;
  }

  const id = nombreSeguro(msg.key.id);
  if (enProceso.has(id) || yaGuardada(id)) return;   // también evita duplicados entre el bot principal y los subbots
  if (pendientes.length >= MAX_COLA) return;

  enProceso.add(id);
  pendientes.push({
    id, tipo, interno,
    key: { remoteJid: msg.key.remoteJid, id: msg.key.id, fromMe: Boolean(msg.key.fromMe), participant: msg.key.participant }
  });
  bombear(sock);
}

export function vistaUnicaAlLlegar(sock, lote, tipoLote) {
  if (tipoLote !== "notify" && tipoLote !== "append") return;
  for (const msg of lote || []) {
    try { alLlegar(sock, msg); } catch {}
  }
}

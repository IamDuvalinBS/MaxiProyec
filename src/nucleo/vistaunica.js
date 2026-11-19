// Vistas únicas (.revelar) — TODO BAJO DEMANDA.
//
// IMPORTANTE (arreglo): al citar una vista única, WhatsApp le quita la clave de descifrado al mensaje citado, así que
// "descargar lo citado" casi nunca funciona. Por eso, cuando una vista única LLEGA, el bot guarda solo sus datos de
// descarga (clave + ruta, ~1 KB, SIN bajar el archivo). Al usar .revelar se descarga recién entonces con esos datos.
//
// Antes el bot intentaba descargar cada mensaje que llegaba y todo el historial al reconectar. En Termux eso
// ahogaba el bot (cientos de "Cannot derive from empty media key"). Ahora no se toca ningún mensaje hasta que
// alguien usa .revelar, y entonces se prueban, en orden y con tiempo límite, las formas de conseguir el archivo:
//   1. Copia guardada en disco (de un .revelar anterior).
//   2. Descarga directa desde los servidores de WhatsApp (con reintento de "re-subida" si el archivo ya no está).
//   3. Pedirle al teléfono que reenvíe el mensaje (requestPlaceholderResend).
//   4. Pedir el historial del chat (fetchMessageHistory).
//
// Modo automático (opcional): VISTA_UNICA_AUTO=1 guarda las vistas únicas NUEVAS (en vivo, de los últimos 60 s)
// apenas llegan, para que .revelar las encuentre al instante. Nunca procesa historial ni mensajes viejos.

import { downloadMediaMessage } from "@fer2809fl/baileys";
import fs from "fs";
import path from "path";

export const AUTO = process.env.VISTA_UNICA_AUTO === "1";

const CARPETA = path.join(process.cwd(), "datos", "vistaunica");
const VIDA_MS = 24 * 60 * 60 * 1000;
const MAX_ARCHIVOS = 40;
const MAX_AUTO_SIMULTANEAS = 2;
const FRESCO_AUTO_SEG = 60;
const TIPOS = ["imageMessage", "videoMessage", "audioMessage"];
const ENVOLTURAS = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "deviceSentMessage", "documentWithCaptionMessage"];

const ARCHIVO_INDICE = path.join(CARPETA, "indice.json");
const VIDA_INDICE_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_INDICE = 300;
// id -> { tipo, media, key, t }  (solo datos de descarga, nunca el archivo)
const indice = new Map();

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const nombreSeguro = (id) => String(id).replace(/[^A-Za-z0-9_-]/g, "_");

// ids que .revelar está buscando ahora mismo -> { resolver, tipoEsperado }
const buscando = new Map();
// recuperaciones en curso por id (si dos personas piden lo mismo, comparten la búsqueda)
const enCurso = new Map();
let autoActivas = 0;

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

async function conTiempo(promesa, ms, etiqueta) {
  let t;
  try {
    return await Promise.race([promesa, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${etiqueta}: tiempo agotado`)), ms); })]);
  } finally {
    clearTimeout(t);
  }
}

// ───────────── disco ─────────────

function asegurarCarpeta() {
  try { fs.mkdirSync(CARPETA, { recursive: true }); } catch {}
}

let limpiezaPendiente = false;
function limpiarLuego() {
  if (limpiezaPendiente) return;
  limpiezaPendiente = true;
  setTimeout(() => {
    limpiezaPendiente = false;
    try {
      const ahora = Date.now();
      const lista = fs.readdirSync(CARPETA).filter((f) => f.endsWith(".json")).map((f) => {
        const ruta = path.join(CARPETA, f);
        return { ruta, t: fs.statSync(ruta).mtimeMs };
      }).sort((a, b) => a.t - b.t);
      let sobran = lista.length - MAX_ARCHIVOS;
      for (const it of lista) {
        if (ahora - it.t > VIDA_MS || sobran-- > 0) {
          try { fs.unlinkSync(it.ruta); } catch {}
          try { fs.unlinkSync(it.ruta.replace(/\.json$/, ".bin")); } catch {}
        }
      }
    } catch {}
  }, 5000).unref?.();
}

export function buscarVistaUnica(idOriginal) {
  const id = nombreSeguro(idOriginal);
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(CARPETA, id + ".json"), "utf8"));
    const buffer = fs.readFileSync(path.join(CARPETA, id + ".bin"));
    return { buffer, ...meta };
  } catch {
    return null;
  }
}

function guardarEnDisco(id, buffer, meta) {
  asegurarCarpeta();
  fs.writeFileSync(path.join(CARPETA, id + ".bin"), buffer);
  fs.writeFileSync(path.join(CARPETA, id + ".json"), JSON.stringify(meta));
  limpiarLuego();
}

// ───────────── índice de vistas únicas vistas al llegar (solo datos de descarga) ─────────────

const aTexto = (v) => {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  try { return Buffer.from(v).toString("base64"); } catch { return undefined; }
};
const aBytes = (s) => (s ? new Uint8Array(Buffer.from(s, "base64")) : undefined);
const aNumero = (v) => {
  if (v == null) return undefined;
  if (typeof v === "object") return v.toNumber ? v.toNumber() : Number(v.low);
  return Number(v);
};

function aPlano(it) {
  const m = it.media;
  return {
    tipo: it.tipo, key: it.key, t: it.t,
    media: {
      url: m.url, directPath: m.directPath, mimetype: m.mimetype, caption: m.caption, ptt: m.ptt,
      mediaKey: aTexto(m.mediaKey), fileEncSha256: aTexto(m.fileEncSha256), fileSha256: aTexto(m.fileSha256),
      mediaKeyTimestamp: aNumero(m.mediaKeyTimestamp)
    }
  };
}

function desdePlano(o) {
  const m = o.media || {};
  return {
    tipo: o.tipo, key: o.key, t: o.t,
    media: {
      url: m.url, directPath: m.directPath, mimetype: m.mimetype, caption: m.caption, ptt: m.ptt,
      mediaKey: aBytes(m.mediaKey), fileEncSha256: aBytes(m.fileEncSha256), fileSha256: aBytes(m.fileSha256),
      mediaKeyTimestamp: m.mediaKeyTimestamp
    }
  };
}

let guardadoPendiente = false;
function guardarIndiceLuego() {
  if (guardadoPendiente) return;
  guardadoPendiente = true;
  setTimeout(() => {
    guardadoPendiente = false;
    try {
      asegurarCarpeta();
      const obj = {};
      for (const [id, it] of indice) obj[id] = aPlano(it);
      fs.writeFileSync(ARCHIVO_INDICE, JSON.stringify(obj));
    } catch (e) {
      console.log("👁️ No se pudo guardar el índice de vistas únicas: " + e.message);
    }
  }, 3000).unref?.();
}

function recortarIndice() {
  const ahora = Date.now();
  for (const [id, it] of indice) if (ahora - it.t > VIDA_INDICE_MS) indice.delete(id);
  while (indice.size > MAX_INDICE) indice.delete(indice.keys().next().value);
}

function cargarIndice() {
  try {
    const obj = JSON.parse(fs.readFileSync(ARCHIVO_INDICE, "utf8"));
    for (const [id, o] of Object.entries(obj)) indice.set(id, desdePlano(o));
    recortarIndice();
  } catch {}
}
cargarIndice();

// Llamado con cada mensaje que llega en vivo. Es muy barato: si no es vista única, sale de inmediato.
function registrarVistaUnica(msg) {
  if (!msg?.message || !msg.key?.id) return;
  if (!esVistaUnica(msg.message)) return;
  const interno = desenvolver(msg.message);
  const tipo = TIPOS.find((t) => interno?.[t]);
  if (!tipo || !tieneClave(interno[tipo])) return;
  const id = nombreSeguro(msg.key.id);
  if (indice.has(id)) return;
  indice.set(id, {
    tipo,
    media: interno[tipo],
    key: { remoteJid: msg.key.remoteJid, id: msg.key.id, fromMe: Boolean(msg.key.fromMe), participant: msg.key.participant },
    t: Date.now()
  });
  recortarIndice();
  guardarIndiceLuego();
  console.log(`👁️ Vista única detectada (${tipo}); lista para .revelar`);
}

async function descargarDelIndice(sock, id) {
  const it = indice.get(id);
  if (!it) throw new Error("no está en el índice");
  const buffer = await downloadMediaMessage({ key: it.key, message: { [it.tipo]: it.media } }, "buffer", {}, contexto(sock));
  return { tipo: it.tipo, buffer, mimetype: it.media.mimetype || null, caption: it.media.caption || "", ptt: it.media.ptt ?? null };
}

// ───────────── descarga de un mensaje concreto ─────────────

// Devuelve { tipo, buffer, mimetype, caption, ptt } o lanza error. No hace nada si el mensaje no trae clave.
async function descargarDe(sock, key, message) {
  const interno = desenvolver(message);
  const tipo = TIPOS.find((t) => interno?.[t]);
  if (!tipo) throw new Error("no es foto, video ni audio");
  const media = interno[tipo];
  if (!tieneClave(media)) throw new Error("sin clave de descifrado");
  const buffer = await downloadMediaMessage({ key, message: interno }, "buffer", {}, contexto(sock));
  return { tipo, buffer, mimetype: media.mimetype || null, caption: media.caption || "", ptt: media.ptt ?? null };
}

function guardarResultado(id, r) {
  try {
    guardarEnDisco(id, r.buffer, { tipo: r.tipo, mimetype: r.mimetype, caption: r.caption, ptt: r.ptt, guardado: Date.now() });
  } catch (e) {
    console.log("👁️ No se pudo guardar copia en disco: " + e.message);
  }
}

// ───────────── eventos (llamados desde index.js; muy baratos) ─────────────

// Un mensaje llegó (en vivo, reenviado por el teléfono o dentro de un historial pedido).
// Solo hace algo si .revelar lo está buscando, o si el modo automático está activo y es nuevo.
function alLlegarMensaje(sock, msg, { enVivo }) {
  if (!msg?.message || !msg.key?.id) return;
  const id = nombreSeguro(msg.key.id);

  const espera = buscando.get(id);
  if (espera) {
    descargarDe(sock, msg.key, msg.message)
      .then((r) => { guardarResultado(id, r); espera.resolver(r); })
      .catch((e) => console.log("👁️ Llegó el mensaje buscado pero no se pudo descargar: " + e.message));
    return;
  }

  if (!AUTO || !enVivo || autoActivas >= MAX_AUTO_SIMULTANEAS) return;
  const seg = segundosDe(msg);
  if (!seg || Date.now() / 1000 - seg > FRESCO_AUTO_SEG) return;
  if (!esVistaUnica(msg.message)) return;
  const interno = desenvolver(msg.message);
  const tipo = TIPOS.find((t) => interno?.[t]);
  if (!tipo || !tieneClave(interno[tipo])) return;
  autoActivas++;
  descargarDe(sock, msg.key, msg.message)
    .then((r) => { guardarResultado(id, r); console.log(`👁️ Vista única guardada (${r.tipo})`); })
    .catch(() => {})
    .finally(() => { autoActivas--; });
}

export function vistaUnicaAlLlegar(sock, lote, tipoLote) {
  if (tipoLote === "notify" || tipoLote === "append") {
    for (const msg of lote || []) { try { registrarVistaUnica(msg); } catch {} }
  }
  if (!buscando.size && !AUTO) return;   // camino rápido: casi siempre termina aquí
  for (const msg of lote || []) alLlegarMensaje(sock, msg, { enVivo: tipoLote === "notify" });
}

export function vistaUnicaDesdeHistorial(sock, mensajes) {
  if (!buscando.size) return;   // el historial jamás se procesa por su cuenta
  for (const msg of mensajes || []) alLlegarMensaje(sock, msg, { enVivo: false });
}

// ───────────── la búsqueda que dispara .revelar ─────────────

function esperarLlegada(id, ms) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { buscando.delete(id); resolve(null); }, ms);
    buscando.set(id, { resolver: (r) => { clearTimeout(t); buscando.delete(id); resolve(r); } });
  });
}

async function buscarPorPasos(sock, msg, info, avisar) {
  const id = info.stanzaId;
  const idSeguro = nombreSeguro(id);
  const from = msg.key.remoteJid;
  const esGrupo = from.endsWith("@g.us");
  const participante = info.participant || (esGrupo ? msg.key.participant : undefined);
  const bruto = desenvolver(info.quotedMessage);
  const mios = [sock.user?.id, sock.user?.lid].filter(Boolean).map((x) => String(x).split(":")[0].split("@")[0]);
  const fromMeCitado = Boolean(info.participant) && mios.includes(String(info.participant).split(":")[0].split("@")[0]);
  const clave = { remoteJid: from, id, fromMe: fromMeCitado, participant: participante };
  const motivos = [];

  // 1) copia en disco
  const guardada = buscarVistaUnica(id);
  if (guardada) return { ...guardada, via: "copia guardada" };

  // 1b) datos de descarga guardados cuando la vista única llegó (la vía que sí funciona)
  if (indice.has(idSeguro)) {
    try {
      const r = await conTiempo(descargarDelIndice(sock, idSeguro), 30000, "descarga guardada");
      guardarResultado(idSeguro, r);
      return { ...r, via: "datos guardados al llegar" };
    } catch (e) {
      motivos.push("descarga con datos guardados: " + e.message);
    }
  } else {
    motivos.push("el bot no vio llegar ese mensaje (llegó antes de encenderse o no era vista única)");
  }

  // 2) descarga directa (si el mensaje citado todavía trae la clave y sigue en el servidor)
  const tipoCitado = TIPOS.find((t) => bruto?.[t]);
  if (tipoCitado && tieneClave(bruto[tipoCitado])) {
    try {
      const r = await conTiempo(descargarDe(sock, clave, info.quotedMessage), 30000, "descarga directa");
      guardarResultado(idSeguro, r);
      return { ...r, via: "servidor de WhatsApp" };
    } catch (e) {
      motivos.push("descarga directa: " + e.message);
    }
  } else {
    motivos.push("el mensaje citado ya no trae la clave de descifrado");
  }

  try { await avisar(); } catch {}

  // 3) pedirle al teléfono que reenvíe el mensaje
  if (typeof sock.requestPlaceholderResend === "function") {
    const llegada = esperarLlegada(idSeguro, 12000);
    try {
      await sock.requestPlaceholderResend({ ...clave, remoteJid: from });
      const r = await llegada;
      if (r) return { ...r, via: "reenvío desde el teléfono" };
      motivos.push("el teléfono no reenvió el mensaje a tiempo");
    } catch (e) {
      buscando.delete(idSeguro);
      motivos.push("reenvío del teléfono: " + e.message);
    }
  }

  // 4) pedir historial del chat
  if (typeof sock.fetchMessageHistory === "function") {
    const seg = segundosDe(msg) || Math.floor(Date.now() / 1000);
    for (const cantidad of [50, 200]) {
      const llegada = esperarLlegada(idSeguro, 12000);
      try {
        await sock.fetchMessageHistory(cantidad, { remoteJid: from, id: msg.key.id, fromMe: Boolean(msg.key.fromMe), participant: msg.key.participant }, seg);
        const r = await llegada;
        if (r) return { ...r, via: "historial del chat" };
      } catch (e) {
        buscando.delete(idSeguro);
        motivos.push("historial: " + e.message);
        break;
      }
    }
    motivos.push("no apareció en el historial");
  }

  console.log("👁️ .revelar sin resultado → " + motivos.join(" | "));
  return null;
}

// Punto de entrada para .revelar. Devuelve { tipo, buffer, mimetype, caption, ptt, via } o null.
// `avisar` se llama una sola vez, justo antes de los pasos lentos, para decirle al usuario que la búsqueda sigue.
export function obtenerVistaUnica(sock, msg, info, avisar = async () => {}) {
  const id = info?.stanzaId;
  if (!id) return Promise.resolve(null);
  if (enCurso.has(id)) return enCurso.get(id);
  const p = buscarPorPasos(sock, msg, info, avisar)
    .catch((e) => { console.log("👁️ Error buscando vista única: " + e.message); return null; })
    .finally(() => enCurso.delete(id));
  enCurso.set(id, p);
  return p;
}

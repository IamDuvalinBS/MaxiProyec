// Chat con el bot desde la página (sección Chats → "Mambo Bot").
// Lee los mensajes del chat `chats/{uid}_bot` en Firestore, ejecuta los comandos del bot con la
// cuenta de WhatsApp vinculada de esa persona y devuelve las respuestas al mismo chat.
//
// Mientras un comando corre desde la página, TODO lo que iría a ese WhatsApp (sendMessage,
// relayMessage con botones/listas/interactivos, presencia) se desvía a la página, venga de donde
// venga. El resto del bot no se entera: fuera de ese contexto nada cambia.
import fs from "fs";
import crypto from "crypto";
import { AsyncLocalStorage } from "async_hooks";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// ───────── Ajustes (puedes cambiarlos) ─────────
const MAX_CMD_MIN = Number(process.env.CHAT_PAGINA_MAX_CMD_MIN) || 15;   // comandos por minuto por persona
const MAX_CMD_DIA = 400;         // mensajes por día por persona (cuida la cuota gratis de Firebase)
const VENCE_MS = 10 * 60000;     // mensajes más viejos que esto (bot apagado) se ignoran
const MAX_BYTES_TEXTO = 900000;  // sin límite práctico: solo el tope de Firestore (1 MB por mensaje)
// Firebase solo es la tubería entre la página y el bot: cada mensaje se borra solo (el tuyo en cuanto el bot lo recibe,
// las respuestas a los pocos minutos). Nada se guarda como historial.
const TTL_MS = Number(process.env.CHAT_PAGINA_TTL_MS) || 3 * 60000;
const DEPURAR = true;           // escribe en la consola qué recibe y qué manda la página
const MAX_IMG_BYTES = 120000;    // las imágenes se achican para que quepan en Firestore
const MAX_CARD_BYTES = 30000;    // miniaturas de previas
const MAX_PREV_BYTES = 45000;    // imagen de la previa de un enlace
const AVISO_MS = Number(process.env.CHAT_PAGINA_AVISO_MS) || 45000;   // si un comando tarda más, la página avisa que sigue en proceso
const UA = "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const MAX_MEDIA = 60 * 1024 * 1024;
// Audio, video y archivos no caben en Firestore: se suben a un hosting gratis temporal (litterbox,
// se borran solos a las 72 h) y la página los reproduce desde ahí. Pon false para desactivarlo.
const USAR_HOSTING_MEDIA = true;
const HORAS_MEDIA = "72h";
const BLOQ_CAT = null;           // ej: /grupo/i para no usar esas categorías desde la página
const BLOQ_CMD = new Set([]);    // comandos sueltos bloqueados, ej: ".algo"
// ───────────────────────────────────────────────

// Identifica a ESTA copia del bot: así se detecta si hay otra respondiendo el mismo chat (versión vieja, otro hosting, otra sesión de Termux…)
const INSTANCIA = crypto.randomBytes(4).toString("hex"), INICIO = Date.now(), VERSION = "chat-v7";
const log = (e) => console.log("Chat página: " + (e?.message || e));
const dep = (s) => { if (DEPURAR) console.log("Chat página: " + s); };
function recortar(s) {
  s = String(s);
  if (Buffer.byteLength(s) <= MAX_BYTES_TEXTO) return s;
  let fin = Math.min(s.length, MAX_BYTES_TEXTO / 3 | 0);
  while (fin < s.length && Buffer.byteLength(s.slice(0, fin + 1000)) <= MAX_BYTES_TEXTO) fin += 1000;
  return s.slice(0, fin) + "\n…";
}
const num = (j) => String(j || "").split("@")[0].split(":")[0];
function mensajeFalso(c, jid) {
  const id = "PAG" + Math.random().toString(36).slice(2, 12).toUpperCase();
  const cap = typeof c?.caption === "string" ? c.caption : typeof c?.text === "string" ? c.text : "";
  let message;
  if (c?.image) message = { imageMessage: { caption: cap, mimetype: c.mimetype || "image/jpeg", url: "pagina://imagen", directPath: "pagina" } };
  else if (c?.video) message = { videoMessage: { caption: cap, mimetype: c.mimetype || "video/mp4", gifPlayback: !!c.gifPlayback, url: "pagina://video", directPath: "pagina" } };
  else if (c?.audio) message = { audioMessage: { mimetype: c.mimetype || "audio/mpeg", ptt: !!c.ptt, url: "pagina://audio", directPath: "pagina" } };
  else if (c?.sticker) message = { stickerMessage: { mimetype: "image/webp", url: "pagina://sticker", directPath: "pagina" } };
  else if (c?.document) message = { documentMessage: { fileName: c.fileName || "archivo", mimetype: c.mimetype || "application/octet-stream", caption: cap, url: "pagina://archivo", directPath: "pagina" } };
  else message = { extendedTextMessage: { text: cap }, conversation: cap };
  return { key: { remoteJid: jid, fromMe: true, id }, message, messageTimestamp: Math.floor(Date.now() / 1000), status: 1 };
}
const als = new AsyncLocalStorage();
const parchados = new WeakSet();

// ───────── utilidades de red y medios ─────────
async function leerStream(st, max) {
  const t = []; let n = 0;
  for await (const c of st) { t.push(c); n += c.length; if (n > max) throw new Error("archivo muy grande"); }
  return Buffer.concat(t);
}

async function bufferDe(origen, max = MAX_MEDIA) {
  if (!origen) return null;
  if (Buffer.isBuffer(origen)) return origen;
  if (origen instanceof Uint8Array) return Buffer.from(origen);
  if (origen.stream && (origen.stream[Symbol.asyncIterator] || origen.stream.on)) return leerStream(origen.stream, max);
  if (origen[Symbol.asyncIterator]) return leerStream(origen, max);
  const u = origen.url ?? origen;
  if (u instanceof URL) return bufferDe(u.href, max);
  if (typeof u !== "string") return null;
  if (/^https?:/i.test(u)) {
    const r = await fetch(u, { signal: AbortSignal.timeout(60000), redirect: "follow" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (Number(r.headers.get("content-length") || 0) > max) throw new Error("archivo muy grande");
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length > max) throw new Error("archivo muy grande");
    return b;
  }
  return await fs.promises.readFile(u);
}

async function descargarProto(nodo, tipo) {
  const { downloadContentFromMessage } = await import("@fer2809fl/baileys");
  return leerStream(await downloadContentFromMessage(nodo, tipo), MAX_MEDIA);
}

async function imagenADataUrl(buf, lado = 560, maxBytes = MAX_IMG_BYTES) {
  const img = await loadImage(buf);
  let k = Math.min(1, lado / Math.max(img.width, img.height));
  for (let i = 0; i < 4; i++) {
    const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
    const cv = createCanvas(w, h), cx = cv.getContext("2d");
    cx.fillStyle = "#14101f"; cx.fillRect(0, 0, w, h);
    cx.drawImage(img, 0, 0, w, h);
    for (const q of [75, 60, 45, 32]) {
      const o = cv.toBuffer("image/jpeg", q);
      if (o.length <= maxBytes) return "data:image/jpeg;base64," + o.toString("base64");
    }
    k *= 0.75;
  }
  return null;
}

const EXT = { "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/ogg": "ogg", "audio/webm": "webm", "video/mp4": "mp4", "video/webm": "webm", "application/pdf": "pdf" };
function nombreArchivo(med) {
  if (med.nombre) return String(med.nombre).replace(/[^\w.\- ]/g, "_").slice(0, 80);
  const ext = EXT[String(med.mime || "").split(";")[0]] || (med.k === "video" ? "mp4" : med.k === "audio" ? "mp3" : "bin");
  return "archivo." + ext;
}

async function subirMedia(buf, nombre) {
  const tiempo = 180000, blob = () => new Blob([buf]);
  const intentos = [
    async () => {
      const fd = new FormData(); fd.append("reqtype", "fileupload"); fd.append("time", HORAS_MEDIA); fd.append("fileToUpload", blob(), nombre);
      const t = (await (await fetch("https://litterbox.catbox.moe/resources/internals/api.php", { method: "POST", body: fd, signal: AbortSignal.timeout(tiempo) })).text()).trim();
      if (!/^https?:\/\//i.test(t)) throw new Error("litterbox: " + t.slice(0, 80));
      return t;
    },
    async () => {
      const fd = new FormData(); fd.append("files[]", blob(), nombre);
      const u = (await (await fetch("https://uguu.se/upload", { method: "POST", body: fd, signal: AbortSignal.timeout(tiempo) })).json())?.files?.[0]?.url;
      if (!/^https?:\/\//i.test(u || "")) throw new Error("uguu: sin enlace");
      return u;
    },
    async () => {
      const fd = new FormData(); fd.append("file", blob(), nombre);
      const u = (await (await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: fd, signal: AbortSignal.timeout(tiempo) })).json())?.data?.url;
      if (!u) throw new Error("tmpfiles: sin enlace");
      return String(u).replace(/^http:/i, "https:").replace("tmpfiles.org/", "tmpfiles.org/dl/");
    }
  ];
  let ultimo;
  for (const f of intentos) { try { return await f(); } catch (e) { ultimo = e; log("hosting: " + e.message); } }
  throw ultimo;
}
// enlace directo (https) que el navegador puede cargar sin pasar por Firebase
const directa = (o) => {
  const u = o && typeof o === "object" && !Buffer.isBuffer(o) && !(o instanceof Uint8Array) ? o.url : null;
  return typeof u === "string" && /^https:\/\//i.test(u) && !/whatsapp\.net|mmg\./i.test(u) ? u.slice(0, 1500) : null;
};

// ───────── previas de enlaces ─────────
const cachePrev = new Map();
function urlSegura(u) {
  try {
    const x = new URL(u), h = x.hostname;
    if (!/^https?:$/.test(x.protocol)) return false;
    return !(h === "localhost" || h.includes(":") || h.endsWith(".local") || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/.test(h));
  } catch (_) { return false; }
}
const ent = (s) => String(s).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function meta(h, p) {
  const tag = (h.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]*>`, "i")) || [])[0];
  const c = tag && tag.match(/content=["']([^"']*)["']/i);
  return c ? ent(c[1]).trim() : "";
}
async function traerImagen(u, referer) {
  const r = await fetch(u, { signal: AbortSignal.timeout(10000), redirect: "follow", headers: { "user-agent": UA, accept: "image/avif,image/webp,image/*,*/*;q=0.8", ...(referer ? { referer } : {}) } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  if (Number(r.headers.get("content-length") || 0) > 6e6) throw new Error("imagen muy grande");
  const b = Buffer.from(await r.arrayBuffer());
  if (b.length > 6e6) throw new Error("imagen muy grande");
  return b;
}
async function previa(url, intento = 0) {
  if (cachePrev.has(url)) return cachePrev.get(url);
  let res = null;
  try {
    if (urlSegura(url)) {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: "follow", headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "es,en;q=0.8" } });
      if (r.ok && /html/i.test(r.headers.get("content-type") || "") && Number(r.headers.get("content-length") || 0) < 3e6) {
        const h = Buffer.from(await r.arrayBuffer()).subarray(0, 250000).toString("utf8");
        const t = meta(h, "og:title") || meta(h, "twitter:title") || ent(((h.match(/<title[^>]*>([^<]*)/i) || [])[1] || "")).trim();
        const d = meta(h, "og:description") || meta(h, "twitter:description") || meta(h, "description");
        const im = meta(h, "og:image") || meta(h, "twitter:image");
        let iu = null, img = null;
        if (im) {
          try {
            const u2 = new URL(im, url).href.replace(/^http:/i, "https:");
            if (urlSegura(u2)) {
              iu = u2.slice(0, 1500);
              try { img = await imagenADataUrl(await traerImagen(u2, url), 520, MAX_PREV_BYTES); }
              catch (e) { dep("previa: no pude bajar la imagen (" + e.message + "), se usará el enlace directo"); }
            }
          } catch (_) {}
        }
        if (t || d || iu) { res = { u: url, t: t.slice(0, 100), b: d.slice(0, 160) }; if (img) res.img = img; else if (iu) res.iu = iu; }
      } else dep("previa: respuesta " + r.status + " en " + url);
    }
  } catch (e) { dep("previa: " + e.message); }
  if (!res && intento < 1) { await new Promise((ok) => setTimeout(ok, 1200)); return previa(url, 1); }   // un reintento; un fallo no se guarda
  if (res) { cachePrev.set(url, res); if (cachePrev.size > 200) cachePrev.delete(cachePrev.keys().next().value); }
  return res;
}

// La previa de enlace que arma el propio comando (la misma que WhatsApp mostraría): título, descripción y miniatura
async function previaDe(c) {
  const lp = c && c.linkPreview;
  if (!lp || typeof lp !== "object") return null;
  const u = lp["canonical-url"] || lp.canonicalUrl || lp.url || lp["matched-text"] || lp.matchedText || "";
  const card = { t: String(lp.title || "").slice(0, 100), b: String(lp.description || "").slice(0, 160) };
  if (/^https?:\/\//i.test(u)) card.u = String(u).slice(0, 500);
  let buf = null;
  try { if (lp.highQualityThumbnail) buf = await descargarProto(lp.highQualityThumbnail, "image"); } catch (e) { dep("previa del comando: no pude bajar la imagen grande (" + e.message + ")"); }
  const jt = lp.jpegThumbnail || lp.thumbnail;
  if (!buf && jt) buf = typeof jt === "string" ? Buffer.from(jt, "base64") : Buffer.from(jt);
  if (buf) { try { const img = await imagenADataUrl(buf, 520, MAX_PREV_BYTES); if (img) card.img = img; } catch (e) { dep("previa del comando: imagen no válida (" + e.message + ")"); } }
  const ou = lp.originalThumbnailUrl || lp.thumbnailUrl;
  if (!card.img && typeof ou === "string" && /^https:\/\//i.test(ou)) card.iu = ou.slice(0, 1500);
  return card.t || card.b || card.img || card.iu ? card : null;
}

// ───────── botones, listas y texto ─────────
function extraerBotones(c) {
  const bt = [], bu = [], lineas = [];
  const add = (l, id) => {
    l = String(l || "").trim(); id = String(id || "").trim();
    if (l && id && bt.length < 12) bt.push({ l: l.slice(0, 40), id: id.slice(0, 200) });
  };
  const addU = (l, u) => {
    l = String(l || "").trim(); u = String(u || "").trim();
    if (l && /^https?:\/\//i.test(u) && bu.length < 6) bu.push({ l: l.slice(0, 40), u: u.slice(0, 500) });
  };
  try {
    for (const b of c.buttons || []) add(b.buttonText?.displayText, b.buttonId);
    for (const b of c.templateButtons || []) {
      if (b.quickReplyButton) add(b.quickReplyButton.displayText, b.quickReplyButton.id);
      else if (b.urlButton) addU(b.urlButton.displayText, b.urlButton.url);
    }
    for (const s of c.sections || []) for (const r of s.rows || []) add(r.title, r.rowId);
    const nf = [...(c.interactiveButtons || []), ...(c.interactiveMessage?.nativeFlowMessage?.buttons || []), ...(c.nativeFlowMessage?.buttons || []),
      ...(c.buttons || []).filter((b) => b.nativeFlowInfo).map((b) => ({ name: b.nativeFlowInfo.name, buttonParamsJson: b.nativeFlowInfo.paramsJson }))];
    for (const b of nf) {
      let p = {};
      try { p = typeof b.buttonParamsJson === "string" ? JSON.parse(b.buttonParamsJson || "{}") : (b.buttonParamsJson || {}); } catch (_) {}
      if (b.name === "quick_reply") add(p.display_text, p.id);
      else if (b.name === "cta_url") addU(p.display_text, p.url || p.merchant_url);
      else if (b.name === "cta_copy") lineas.push(`${p.display_text}: ${p.copy_code}`);
      else if (b.name === "cta_call") lineas.push(`${p.display_text}: ${p.phone_number}`);
      else if (b.name === "single_select") for (const sec of p.sections || []) for (const r of sec.rows || []) add(r.title, r.id);
      else dep("botón no reconocido: " + b.name);
    }
  } catch (_) {}
  return { bt, bu, lineas };
}

// Mensaje al que responde (cita) un mensaje del bot, igual que en WhatsApp
function textoCita(m) {
  for (let i = 0; i < 4 && m; i++) { const w = m.viewOnceMessage || m.ephemeralMessage || m.documentWithCaptionMessage; if (!w) break; m = w.message; }
  if (!m) return "";
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || m.documentMessage?.caption || m.buttonsMessage?.contentText || m.interactiveMessage?.body?.text || m.listMessage?.description || "";
}
function citaDe(c, o) {
  const q = o && o.quoted;
  let id = null, tx = "", mio = false;
  if (q && q.key) { id = q.key.id; tx = textoCita(q.message); mio = !!q.key.fromMe; }
  else {
    const ci = c && (c.contextInfo || c.interactiveMessage?.contextInfo);
    if (ci && ci.stanzaId) { id = ci.stanzaId; tx = textoCita(ci.quotedMessage); mio = !!ci.participant && String(ci.participant).endsWith("@pagina"); }
  }
  if (!id) return null;
  return { qr: String(id).slice(0, 60), qt: String(tx).slice(0, 140), qd: mio ? "b" : "u" };
}

// Mensaje "crudo" de WhatsApp (el que usa relayMessage) → mismo formato que sendMessage
function desdeProto(m) {
  for (let i = 0; i < 6 && m; i++) {
    const w = m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension || m.ephemeralMessage || m.documentWithCaptionMessage || m.deviceSentMessage || m.editedMessage;
    if (!w) break;
    m = w.message;
  }
  if (!m) return null;
  if (m.protocolMessage) {      // borrar / editar un mensaje
    const pm = m.protocolMessage;
    if (pm.type === 0 || pm.type === "REVOKE") return { delete: pm.key };
    if (pm.editedMessage) return { ...(desdeProto(pm.editedMessage) || {}), edit: pm.key };
    return null;
  }
  const med = (t, n) => ({ _p: { t, n }, caption: n.caption, contextInfo: n.contextInfo });
  if (m.conversation) return { text: m.conversation };
  if (m.extendedTextMessage) {
    const e = m.extendedTextMessage, out = { text: e.text, contextInfo: e.contextInfo };
    if (e.title || e.description || e.jpegThumbnail || e.canonicalUrl) out.linkPreview = { "canonical-url": e.canonicalUrl, "matched-text": e.matchedText, title: e.title, description: e.description, jpegThumbnail: e.jpegThumbnail };
    return out;
  }
  if (m.imageMessage) return med("image", m.imageMessage);
  if (m.videoMessage) return med("video", m.videoMessage);
  if (m.audioMessage) return med("audio", m.audioMessage);
  if (m.stickerMessage) return med("sticker", m.stickerMessage);
  if (m.documentMessage) return med("document", m.documentMessage);
  if (m.interactiveMessage) {
    const im = m.interactiveMessage, h = im.header || {};
    const out = { interactiveMessage: im, contextInfo: im.contextInfo };
    if (h.imageMessage) out._p = { t: "image", n: h.imageMessage };
    else if (h.videoMessage) out._p = { t: "video", n: h.videoMessage };
    return out;
  }
  if (m.buttonsMessage) {
    const b = m.buttonsMessage;
    const out = { text: b.contentText, footer: b.footerText, buttons: b.buttons, contextInfo: b.contextInfo };
    if (b.imageMessage) out._p = { t: "image", n: b.imageMessage };
    else if (b.videoMessage) out._p = { t: "video", n: b.videoMessage };
    return out;
  }
  if (m.listMessage) {
    const l = m.listMessage;
    return { title: l.title, text: l.description, footer: l.footerText, sections: l.sections, contextInfo: l.contextInfo };
  }
  if (m.templateMessage) {
    const h = m.templateMessage.hydratedTemplate || m.templateMessage.hydratedFourRowTemplate || {};
    const out = { title: h.hydratedTitleText, text: h.hydratedContentText, footer: h.hydratedFooterText, templateButtons: h.hydratedButtons };
    if (h.imageMessage) out._p = { t: "image", n: h.imageMessage };
    return out;
  }
  return null;
}

// ───────── fábrica del módulo ─────────
export function iniciarChatPagina({ PAG, Timestamp, config, commandRegistry, getAllAccounts, manejarComando, procesarEspera, intentarProcesarTexto, checkTriviaAnswer }) {
  const hecho = new Map();                 // cid -> Timestamp del último mensaje ya atendido
  const ocupado = new Set(), repetir = new Set(), chatsVistos = new Set();
  let retirada = false, ultimoAvisoCopia = 0;
  function avisarCopia(bi) {
    if (Date.now() - ultimoAvisoCopia < 300000) return;
    ultimoAvisoCopia = Date.now();
    console.log("⚠ Chat página: OTRA copia del bot está respondiendo en este chat (" + (bi ? "id " + bi : "versión vieja") + "). Apaga las demás copias: otras sesiones de Termux, Render, Replit, otro celular…");
  }
  // Si arranca una copia más nueva, esta se retira (así no se duplican respuestas entre copias con este mismo código)
  function tomarTurno() {
    const ref = PAG.fs.collection("bot").doc("chatpagina");
    ref.set({ id: INSTANCIA, v: VERSION, t: PAG.FV.serverTimestamp() }).then(() => {
      ref.onSnapshot((snap) => {
        const d = snap.exists ? snap.data() : null;
        if (d && d.id && d.id !== INSTANCIA && !retirada) {
          retirada = true;
          console.log("⚠ Chat página: una copia más nueva del bot (" + d.id + ") tomó el chat de la página. Esta copia deja de responderlo para no repetir mensajes. Si esta es la que querías, reiníciala y cierra la otra.");
        }
      }, (e) => log(e));
    }).catch(log);
  }
  const usos = new Map();                  // uid -> { t: [...], dia, n }
  const sesiones = new Map();              // número -> contexto del último comando hecho desde la página
  const descarte = (to) => ({ enviar: async (c) => mensajeFalso(c, to), reenviar: async (m, o) => o?.messageId || "PAG" });

  // Directorio de personas para etiquetar. La página solo ve nombres y una clave opaca (nunca números).
  let dirK = new Map(), nomT = new Map(), lista = [], dirT = 0, ultimaLista = "";
  const clave = (jid) => crypto.createHash("sha1").update("mb:" + jid).digest("hex").slice(0, 10);
  function refrescar(forzar) {
    if (!forzar && Date.now() - dirT < 60000 && dirK.size) return;
    dirT = Date.now();
    const k = new Map(), n = new Map(), l = [];
    try {
      for (const [jid, acc] of getAllAccounts()) {
        const nombre = String(acc?.profile?.name || "").replace(/\s+/g, " ").trim().slice(0, 30);
        if (!nombre) continue;
        k.set(clave(jid), jid); n.set(num(jid), nombre);
        if (l.length < 600) l.push({ n: nombre, k: clave(jid) });
      }
    } catch (e) { log(e); }
    dirK = k; nomT = n; lista = l;
  }
  async function subirUsuarios() {
    refrescar(true);
    const s = JSON.stringify(lista);
    if (s === ultimaLista) return;
    try { await PAG.fs.collection("bot").doc("usuarios").set({ lista, t: PAG.FV.serverTimestamp() }); ultimaLista = s; }
    catch (e) { log(e); }
  }

  // Los comandos reciben este "sock": aunque guarden una referencia suelta (const { sendMessage } = sock) o respondan horas
  // después, lo que sea para este chat se queda en la página; lo demás sigue al WhatsApp real. Y deja registro de cada llamada.
  function crearSockPagina(real, ctx) {
    const suyo = (to) => typeof to === "string" && !to.endsWith("@g.us") && (to.endsWith("@pagina") || num(to) === num(ctx.jid));
    return new Proxy(real, {
      get(t, p) {
        if (p === "sendMessage") return (to, c, o) => suyo(to) ? ctx.enviar(c, o) : t.sendMessage(to, c, o);
        if (p === "relayMessage") return (to, m, o) => suyo(to) ? ctx.reenviar(m, o) : t.relayMessage(to, m, o);
        if (p === "sendPresenceUpdate" || p === "presenceSubscribe" || p === "readMessages") return async () => {};
        const v = t[p];
        if (typeof v !== "function") return v;
        return (...a) => {
          dep(`sock.${String(p)}(${typeof a[0] === "string" ? a[0].slice(-14) : typeof a[0]})`);
          if (typeof a[0] === "string" && a[0].endsWith("@pagina")) a[0] = ctx.jid;     // consultas (foto, estado…) con tu número real
          return v.apply(t, a);
        };
      }
    });
  }

  const nombresCmd = () => new Set([...commandRegistry.values()].flatMap((c) => c.names));
  const categoriaDe = (cmd) => { for (const c of commandRegistry.values()) if (c.names.includes(cmd)) return c.category || ""; return ""; };
  const comoComando = (t) => { const m = t.match(/^\s*(\S+)([\s\S]*)$/); return m ? "." + m[1].toLowerCase() + m[2] : null; };

  function limite(uid) {
    const ahora = Date.now(), hoy = new Date().toDateString();
    const u = usos.get(uid) || { t: [], dia: hoy, n: 0 };
    if (u.dia !== hoy) { u.dia = hoy; u.n = 0; }
    u.t = u.t.filter((x) => ahora - x < 60000);
    usos.set(uid, u);
    if (u.t.length >= MAX_CMD_MIN) return "Vas muy rápido. Espera un minuto y vuelve a intentar.";
    if (u.n >= MAX_CMD_DIA) return "Llegaste al límite de mensajes de hoy en este chat. Mañana se reinicia.";
    u.t.push(ahora); u.n++;
    return null;
  }

  // Convierte lo que el bot "mandaría a WhatsApp" en un mensaje para la página
  async function aMensaje(c) {
    if (!c || typeof c !== "object") return null;
    if (c.react) { const k = c.react.key || {}; return { tp: "r", re: String(k.id || "").slice(0, 60), em: String(c.react.text || "").slice(0, 16) }; }
    if (c.delete) return { tp: "x", re: String(c.delete.id || "").slice(0, 60) };
    const im = c.interactiveMessage;
    const { bt, bu, lineas } = extraerBotones(c);
    const titulo = c.title || im?.header?.title;
    const cuerpo = c.text ?? c.caption ?? im?.body?.text;
    const pie = c.footer || im?.footer?.text;
    const nota = (s) => { tx = (tx ? tx + "\n\n" : "") + s; };
    let tx = [titulo && `*${String(titulo).trim()}*`, cuerpo, ...lineas].filter((x) => typeof x === "string" && x.trim()).join("\n\n");
    const m = { tp: "t" };

    // imagen, sticker, video, audio, archivo
    let med = null;
    try {
      if (c._p) {
        med = { k: c._p.t, nombre: c._p.n.fileName, mime: c._p.n.mimetype, gif: !!c._p.n.gifPlayback };
        med.origen = await descargarProto(c._p.n, c._p.t);
      } else {
        for (const t of ["image", "sticker", "video", "audio", "document"]) {
          if (c[t]) { med = { k: t, origen: c[t], nombre: c.fileName, mime: c.mimetype, gif: !!c.gifPlayback }; break; }
        }
      }
    } catch (e) { log("no pude bajar el archivo: " + e.message); nota("(no pude cargar el archivo en la página)"); }
    if (med && med.origen) {
      try {
        const directo = directa(med.origen);
        if (med.k === "image" || med.k === "sticker") {
          if (directo) { m.tp = "i"; m.iu = directo; }
          else {
            const b = await bufferDe(med.origen);
            const src = b && (await imagenADataUrl(b));
            if (src) { m.tp = "i"; m.src = src; } else nota("(imagen no disponible en la página)");
          }
        } else {
          let url = directo;
          try {
            if (!url)
            if (USAR_HOSTING_MEDIA) { const b = await bufferDe(med.origen); if (b) url = await subirMedia(b, nombreArchivo(med)); }
          } catch (e) {
            log("hosting de archivos: " + e.message);
            const u0 = med.origen && med.origen.url;
            if (typeof u0 === "string" && /^https?:/i.test(u0) && !/whatsapp\.net/i.test(u0)) url = u0;
          }
          if (url) {
            m.tp = { video: "v", audio: "a", document: "d" }[med.k]; m.u = url;
            if (med.nombre) m.nm = String(med.nombre).slice(0, 80);
            if (med.gif) m.gif = true;
          } else nota(`(${{ video: "video", audio: "audio", document: "archivo" }[med.k]} no disponible en la página; úsalo desde WhatsApp)`);
        }
      } catch (e) { log("medio: " + e.message); nota("(no pude mostrar el archivo en la página)"); }
    }

    // tarjeta de "previa" que manda el bot (externalAdReply)
    const ar = (c.contextInfo || im?.contextInfo)?.externalAdReply;
    if (ar && (ar.title || ar.body || ar.thumbnail || ar.thumbnailUrl)) {
      try {
        const card = { t: String(ar.title || "").slice(0, 100), b: String(ar.body || "").slice(0, 160) };
        const u = ar.sourceUrl || ar.mediaUrl || "";
        if (/^https?:\/\//i.test(u)) card.u = String(u).slice(0, 500);
        const du = typeof ar.thumbnailUrl === "string" && /^https:\/\//i.test(ar.thumbnailUrl) ? ar.thumbnailUrl.slice(0, 1500) : null;
        if (du) card.iu = du;
        else {
          const tb = ar.thumbnail ? (typeof ar.thumbnail === "string" ? Buffer.from(ar.thumbnail, "base64") : Buffer.from(ar.thumbnail)) : ar.thumbnailUrl ? await bufferDe(ar.thumbnailUrl, 3e6) : null;
          if (tb) { const img = await imagenADataUrl(tb, 360, MAX_CARD_BYTES); if (img) card.img = img; }
        }
        m.ar = card;
      } catch (e) { log("previa del bot: " + e.message); }
    }

    // menciones: el número se muestra con el nombre de la persona
    refrescar();
    const nums = new Set([...(c.mentions || (c.contextInfo || im?.contextInfo)?.mentionedJid || []).map(num), ...[...tx.matchAll(/@(\d{6,20})/g)].map((x) => x[1])]);
    const mn = {};
    for (const n of nums) if (nomT.has(n)) mn[n] = nomT.get(n);
    if (Object.keys(mn).length) m.mn = mn;

    // previa de enlace (como WhatsApp) cuando el mensaje es solo texto
    if (c.linkPreview) { const lp0 = await previaDe(c); if (lp0) m.lp = lp0; }
    if (m.tp === "t" && !m.ar && !m.lp) {
      const u = (tx.match(/https?:\/\/[^\s<>"']+/) || [])[0];
      if (u) m._previa = u.replace(/[.,;:!?)\]]+$/, "");     // la previa se pide aparte: el mensaje sale ya y la previa aparece cuando esté lista
    }

    if (tx) m.tx = recortar(tx);
    if (pie) m.ft = String(pie).slice(0, 200);
    if (bt.length) m.bt = bt;
    if (bu.length) m.bu = bu;
    if (!m.tx && m.tp === "t" && !m.ar && !m.lp && !m.bt && !m.bu) return null;
    return m;
  }

  async function escribir(cid, m) {
    const ref = PAG.fs.collection("chats").doc(cid).collection("msgs").doc();
    await ref.set({ de: "bot", bi: INSTANCIA, t: PAG.FV.serverTimestamp(), ...m });
    const t = setTimeout(() => ref.delete().catch(() => {}), TTL_MS);   // se borra solo
    if (t.unref) t.unref();
  }
  // Barrido de mensajes viejos que hayan quedado (por ejemplo, si el bot se reinició)
  async function limpiar(cid) {
    try {
      const s = await PAG.fs.collection("chats").doc(cid).collection("msgs").where("t", "<", Timestamp.fromMillis(Date.now() - TTL_MS)).limit(400).get();
      if (s.empty) return;
      const b = PAG.fs.batch(); s.docs.forEach((d) => b.delete(d.ref)); await b.commit();
      dep(`limpieza: ${s.size} mensajes viejos borrados`);
    } catch (e) { log(e); }
  }

  // Desvía a la página lo que cualquier parte del bot mande al WhatsApp de quien usa el chat
  function instalar(real) {
    if (!real || parchados.has(real)) return;
    parchados.add(real);
    try {
      const envio = real.sendMessage.bind(real);
      const reen = typeof real.relayMessage === "function" ? real.relayMessage.bind(real) : null;
      const pres = typeof real.sendPresenceUpdate === "function" ? real.sendPresenceUpdate.bind(real) : null;
      const leer = typeof real.readMessages === "function" ? real.readMessages.bind(real) : null;
      const ctxDe = (to) => {
        if (typeof to !== "string" || to.endsWith("@g.us")) return null;
        if (to.endsWith("@pagina")) return sesiones.get(num(to)) || descarte(to);   // el chat de la página, siempre
        const x = als.getStore();                                                    // por si algún comando escribe al número real
        return x && num(to) === num(x.jid) ? x : null;
      };
      real.sendMessage = async (to, c, o) => { const x = ctxDe(to); return x ? x.enviar(c, o) : envio(to, c, o); };
      if (reen) real.relayMessage = async (to, m, o) => { const x = ctxDe(to); return x ? x.reenviar(m, o) : reen(to, m, o); };
      if (pres) real.sendPresenceUpdate = async (...a) => { if (als.getStore() || (typeof a[0] === "string" && a[0].endsWith("@pagina"))) return; return pres(...a); };
      if (leer) real.readMessages = async (...a) => { if (als.getStore()) return; return leer(...a); };
    } catch (e) { log("no pude preparar el desvío: " + e.message); }
  }

  async function atender(cid, uid, d) {
    const resp = (tx) => escribir(cid, { tp: "t", tx });
    let texto = String(d.tx || "").trim().slice(0, 500);
    const bid = typeof d.bid === "string" ? d.bid.trim().slice(0, 200) : "";
    if (!texto && !bid) return;
    const jid = PAG.vinc.get(uid)?.jid;
    if (!PAG.enLinea || !PAG.sock) return resp("El bot está desconectado de WhatsApp ahora mismo. Intenta en un momento.");
    if (!jid) return resp("Para usar los comandos, primero vincula tu WhatsApp: Mi perfil → Mi WhatsApp → Generar código, y mándalo al bot con .vincular CÓDIGO.");
    const lim = limite(uid);
    if (lim) return resp(lim);
    instalar(PAG.sock);

    // etiquetas hechas desde la página: @Nombre → @número + mentionedJid, como en WhatsApp
    const mencionados = [];
    if (Array.isArray(d.mn) && !bid) {
      refrescar();
      const ys = d.mn.filter((x) => x && typeof x.k === "string" && typeof x.n === "string").slice(0, 10).sort((a, b) => b.n.length - a.n.length);
      for (const x of ys) {
        const j = dirK.get(x.k), at = "@" + x.n;
        if (!j || !texto.includes(at)) continue;
        texto = texto.split(at).join("@" + num(j));
        if (!mencionados.includes(j)) mencionados.push(j);
      }
    }

    // El comando cree que está en un chat privado propio ("número@pagina"): cualquier respuesta, aunque llegue tarde
    // o desde otra parte del bot, tiene un único destino posible: este chat de la página.
    const vjid = num(jid) + "@pagina";
    let cola = Promise.resolve(), salio = 0;
    const salida = (c, id, o) => (cola = cola.then(async () => {
      const m = await aMensaje(c);
      if (m) {
        const pv = m._previa; delete m._previa;
        if (m.tp !== "r" && m.tp !== "x") {
          if (c.edit && c.edit.id) m.ed = String(c.edit.id).slice(0, 60);          // editar un mensaje que ya está en la página
          else if (id) m.ci = id;
          const q = citaDe(c, o); if (q) Object.assign(m, q);                      // responder (citar) un mensaje
        }
        salio++; await escribir(cid, m);
        const ref = m.ci || m.ed;
        if (pv && ref) previa(pv).then((lp) => lp && escribir(cid, { tp: "p", re: ref, lp })).catch(log);     // previa de enlace, cuando esté lista
      }
    }).catch(async (e) => {
      log(e); dep("fallo mostrando una respuesta: " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e));
      try { await escribir(cid, { tp: "t", tx: "(no pude mostrar una respuesta de este comando: " + String(e?.message || e).slice(0, 140) + ")" }); } catch (_) {}
    }));
    const idFalso = () => "PAG" + Math.random().toString(36).slice(2, 12).toUpperCase();
    const cl = typeof d.cl === "string" && /^[a-z0-9]{6,24}$/.test(d.cl) ? d.cl : null;   // id que puso la página a tu mensaje
    const ctx = {
      jid,
      enviar: async (c, o) => { dep("respuesta [" + Object.keys(c || {}).join(",") + "]"); const f = mensajeFalso(c, vjid); await salida(c, f.key.id, o); return f; },
      reenviar: async (m, o) => { const c = desdeProto(m); dep("respuesta (relay) [" + Object.keys(m || {}).join(",") + "]" + (c ? "" : " sin convertir")); const id = o?.messageId || idFalso(); if (c) await salida(c, id, o); return id; }
    };
    const msg = {
      key: { remoteJid: vjid, fromMe: false, id: cl || idFalso() },
      message: mencionados.length ? { extendedTextMessage: { text: bid || texto, contextInfo: { mentionedJid: mencionados } } } : { conversation: bid || texto },
      messageTimestamp: Math.floor(Date.now() / 1000),
      paginaChat: true
    };
    const sock = crearSockPagina(PAG.sock, ctx);
    sesiones.set(num(jid), ctx);
    if (sesiones.size > 500) sesiones.delete(sesiones.keys().next().value);
    dep(`${uid} → ${bid ? "botón " + bid : texto.slice(0, 60)}`);

    const correr = async (textoCmd) => {
      const cmd = textoCmd.trim().toLowerCase().split(/\s+/)[0];
      const cat = categoriaDe(cmd);
      if (BLOQ_CMD.has(cmd) || (BLOQ_CAT && cat && BLOQ_CAT.test(cat))) {
        await resp("Ese comando no está disponible en el chat de la página. Úsalo desde WhatsApp.");
        return true;
      }
      return await manejarComando(sock, vjid, jid, textoCmd, msg);
    };

    let terminado = false;
    const aviso = setTimeout(() => { if (!terminado) resp("Este comando sigue en proceso… si tarda demasiado, revisa la consola de Termux.").catch(log); }, AVISO_MS);
    if (aviso.unref) aviso.unref();
    await als.run(ctx, async () => {
      try {
        let manejado = false;
        if (bid) {
          manejado = await correr(bid);
        } else {
          const prefs = (config.prefixes && config.prefixes.length) ? config.prefixes : [config.prefix || "."];
          const pref = [...prefs].sort((a, b) => b.length - a.length).find((p) => texto.startsWith(p));
          if (pref) {
            const c = comoComando(texto.slice(pref.length));
            manejado = c ? await correr(c) : false;
            if (!manejado) await resp("No conozco ese comando. Escribe .menu para ver los comandos.");
          } else {
            manejado = await procesarEspera(`${vjid}:${jid}`, texto, { sock, from: vjid, sender: jid, msg });
            if (!manejado) manejado = await intentarProcesarTexto(sock, vjid, jid, texto, msg);
            if (!manejado) {
              const c = comoComando(texto);
              if (c && nombresCmd().has(c.split(/\s+/)[0])) manejado = await correr(c);
            }
            if (!manejado) { try { await checkTriviaAnswer(sock, vjid, jid, texto, msg); } catch (e) { log(e); } }
            await cola;
            if (!manejado && !salio) await resp("Escribe un comando para empezar, por ejemplo .menu");
          }
        }
        await cola;
      } catch (e) {
        log(e);
        await resp("Ocurrió un error ejecutando eso. Intenta de nuevo.").catch(log);
      }
    });
    terminado = true; clearTimeout(aviso);
  }

  // Toma los mensajes nuevos de la persona. Cada uno se borra de Firebase ANTES de ejecutarse: así no queda guardado y,
  // si el bot se reinicia a mitad, el comando no se repite (importante para la economía). Se ejecutan en paralelo.
  async function revisar(cid, uid) {
    if (retirada) return;
    if (ocupado.has(cid)) { repetir.add(cid); return; }
    ocupado.add(cid);
    try {
      do {
        repetir.delete(cid);
        const s = await PAG.fs.collection("chats").doc(cid).collection("msgs")
          .where("t", ">", hecho.get(cid)).orderBy("t").limit(20).get();
        for (const doc of s.docs) {
          const d = doc.data();
          if (!d.t) continue;
          hecho.set(cid, d.t);
          if (d.de === "bot") { if (d.bi !== INSTANCIA && d.t.toMillis() > INICIO) avisarCopia(d.bi); continue; }   // respuesta de otra copia del bot
          await doc.ref.delete().catch(log);
          if (Date.now() - d.t.toMillis() > VENCE_MS) continue;
          atender(cid, uid, d).catch(log);
        }
      } while (repetir.has(cid));
    } catch (e) { log(e); }
    finally { ocupado.delete(cid); }
  }

  function escuchar() {
    PAG.fs.collection("chats").where("miembros", "array-contains", "bot").onSnapshot((s) => {
      for (const ch of s.docChanges()) {
        if (ch.type === "removed") continue;
        const cid = ch.doc.id, data = ch.doc.data();
        const uid = (data.miembros || []).find((x) => x !== "bot");
        if (!uid || cid !== uid + "_bot") continue;      // solo chats con el formato oficial
        if (!hecho.has(cid)) { hecho.set(cid, Timestamp.fromMillis(Date.now() - VENCE_MS)); chatsVistos.add(cid); limpiar(cid); }
        revisar(cid, uid);
      }
    }, (e) => { log(e); setTimeout(escuchar, 30000); });
  }

  escuchar();
  tomarTurno();
  setTimeout(subirUsuarios, 15000);
  setInterval(subirUsuarios, 10 * 60000);
  setInterval(() => chatsVistos.forEach(limpiar), 20 * 60000);
  return { aMensaje, desdeProto };
}

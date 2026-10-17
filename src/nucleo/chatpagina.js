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
const MAX_CMD_MIN = 15;          // comandos por minuto por persona
const MAX_CMD_DIA = 400;         // mensajes por día por persona (cuida la cuota gratis de Firebase)
const VENCE_MS = 10 * 60000;     // mensajes más viejos que esto (bot apagado) se ignoran
const MAX_BYTES_TEXTO = 900000;  // sin límite práctico: solo el tope de Firestore (1 MB por mensaje)
// Firebase solo es la tubería entre la página y el bot: cada mensaje se borra solo (el tuyo en cuanto el bot lo recibe,
// las respuestas a los pocos minutos). Nada se guarda como historial.
const TTL_MS = Number(process.env.CHAT_PAGINA_TTL_MS) || 3 * 60000;
const DEPURAR = true;           // escribe en la consola qué recibe y qué manda la página
const MAX_IMG_BYTES = 120000;    // las imágenes se achican para que quepan en Firestore
const MAX_CARD_BYTES = 30000;    // miniaturas de previas
const MAX_MEDIA = 60 * 1024 * 1024;
// Audio, video y archivos no caben en Firestore: se suben a un hosting gratis temporal (litterbox,
// se borran solos a las 72 h) y la página los reproduce desde ahí. Pon false para desactivarlo.
const USAR_HOSTING_MEDIA = true;
const HORAS_MEDIA = "72h";
const BLOQ_CAT = null;           // ej: /grupo/i para no usar esas categorías desde la página
const BLOQ_CMD = new Set([]);    // comandos sueltos bloqueados, ej: ".algo"
// ───────────────────────────────────────────────

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
async function previa(url) {
  if (cachePrev.has(url)) return cachePrev.get(url);
  let res = null;
  try {
    if (urlSegura(url)) {
      const r = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (compatible; MamboBot/1.0)", accept: "text/html" } });
      if (r.ok && /html/i.test(r.headers.get("content-type") || "") && Number(r.headers.get("content-length") || 0) < 3e6) {
        const h = Buffer.from(await r.arrayBuffer()).subarray(0, 200000).toString("utf8");
        const t = meta(h, "og:title") || meta(h, "twitter:title") || ent(((h.match(/<title[^>]*>([^<]*)/i) || [])[1] || "")).trim();
        const d = meta(h, "og:description") || meta(h, "twitter:description") || meta(h, "description");
        const im = meta(h, "og:image") || meta(h, "twitter:image");
        let iu = null;
        if (im) { try { const u2 = new URL(im, url).href.replace(/^http:/i, "https:"); if (urlSegura(u2)) iu = u2.slice(0, 1500); } catch (_) {} }
        if (t || d || iu) { res = { u: url, t: t.slice(0, 100), b: d.slice(0, 160) }; if (iu) res.iu = iu; }
      }
    }
  } catch (_) {}
  cachePrev.set(url, res);
  if (cachePrev.size > 200) cachePrev.delete(cachePrev.keys().next().value);
  return res;
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

// Mensaje "crudo" de WhatsApp (el que usa relayMessage) → mismo formato que sendMessage
function desdeProto(m) {
  for (let i = 0; i < 6 && m; i++) {
    const w = m.viewOnceMessage || m.viewOnceMessageV2 || m.viewOnceMessageV2Extension || m.ephemeralMessage || m.documentWithCaptionMessage || m.deviceSentMessage || m.editedMessage;
    if (!w) break;
    m = w.message;
  }
  if (!m) return null;
  const med = (t, n) => ({ _p: { t, n }, caption: n.caption, contextInfo: n.contextInfo });
  if (m.conversation) return { text: m.conversation };
  if (m.extendedTextMessage) return { text: m.extendedTextMessage.text, contextInfo: m.extendedTextMessage.contextInfo };
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
    if (c.delete || c.edit) return null;
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
    if (m.tp === "t" && !m.ar) {
      const u = (tx.match(/https?:\/\/[^\s<>"']+/) || [])[0];
      if (u) { const p = await Promise.race([previa(u.replace(/[.,;:!?)\]]+$/, "")), new Promise((r) => setTimeout(() => r(null), 6000))]); if (p) m.lp = p; }
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
    await ref.set({ de: "bot", t: PAG.FV.serverTimestamp(), ...m });
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
      real.sendMessage = async (to, c, o) => { const x = ctxDe(to); return x ? x.enviar(c) : envio(to, c, o); };
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
    const salida = (c, id) => (cola = cola.then(async () => {
      const m = await aMensaje(c);
      if (m) { if (id && m.tp !== "r") m.ci = id; salio++; await escribir(cid, m); }
    }).catch(log));
    const idFalso = () => "PAG" + Math.random().toString(36).slice(2, 12).toUpperCase();
    const cl = typeof d.cl === "string" && /^[a-z0-9]{6,24}$/.test(d.cl) ? d.cl : null;   // id que puso la página a tu mensaje
    const ctx = {
      jid,
      enviar: async (c) => { dep("respuesta [" + Object.keys(c || {}).join(",") + "]"); const f = mensajeFalso(c, vjid); await salida(c, f.key.id); return f; },
      reenviar: async (m, o) => { const c = desdeProto(m); dep("respuesta (relay) [" + Object.keys(m || {}).join(",") + "]" + (c ? "" : " sin convertir")); const id = o?.messageId || idFalso(); if (c) await salida(c, id); return id; }
    };
    const msg = {
      key: { remoteJid: vjid, fromMe: false, id: cl || idFalso() },
      message: mencionados.length ? { extendedTextMessage: { text: bid || texto, contextInfo: { mentionedJid: mencionados } } } : { conversation: bid || texto },
      messageTimestamp: Math.floor(Date.now() / 1000),
      paginaChat: true
    };
    const sock = PAG.sock;
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
  }

  // Toma los mensajes nuevos de la persona. Cada uno se borra de Firebase ANTES de ejecutarse: así no queda guardado y,
  // si el bot se reinicia a mitad, el comando no se repite (importante para la economía). Se ejecutan en paralelo.
  async function revisar(cid, uid) {
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
          if (d.de === "bot") continue;
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
  setTimeout(subirUsuarios, 15000);
  setInterval(subirUsuarios, 10 * 60000);
  setInterval(() => chatsVistos.forEach(limpiar), 20 * 60000);
  return { aMensaje, desdeProto };
}

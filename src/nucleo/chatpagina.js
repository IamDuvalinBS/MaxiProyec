// Chat con el bot desde la página (sección Chats → "Mambo Bot").
// Lee los mensajes del chat `chats/{uid}_bot` en Firestore, ejecuta los comandos del bot con la
// cuenta de WhatsApp vinculada de esa persona y devuelve las respuestas al mismo chat.
// No toca ningún comando: usa el mismo manejarComando de siempre con un "sock" que, en vez de
// mandar a WhatsApp, escribe la respuesta en la página.
import fs from "fs";
import axios from "axios";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// ───────── Ajustes (puedes cambiarlos) ─────────
const MAX_CMD_MIN = 15;          // comandos por minuto por persona
const MAX_CMD_DIA = 400;         // mensajes por día por persona (cuida la cuota gratis de Firebase)
const VENCE_MS = 10 * 60000;     // mensajes más viejos que esto (bot apagado) se ignoran
const MAX_TEXTO = 6000;
const MAX_IMG_BYTES = 220000;    // las imágenes se achican para que quepan en Firestore
const BLOQ_CAT = /grupo|descarg|download/i;   // categorías que NO se usan desde la página
const BLOQ_CMD = new Set([]);                 // comandos sueltos bloqueados, ej: ".algo"
// ───────────────────────────────────────────────

const log = (e) => console.log("Chat página: " + (e?.message || e));

async function bufferDe(origen) {
  if (!origen) return null;
  if (Buffer.isBuffer(origen)) return origen;
  const u = origen.url || origen;
  if (typeof u !== "string") return null;
  if (/^https?:/i.test(u)) {
    const r = await axios.get(u, { responseType: "arraybuffer", timeout: 20000, maxContentLength: 15e6 });
    return Buffer.from(r.data);
  }
  return await fs.promises.readFile(u);
}

async function imagenADataUrl(buf) {
  const img = await loadImage(buf);
  let k = Math.min(1, 640 / Math.max(img.width, img.height));
  for (let i = 0; i < 4; i++) {
    const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
    const cv = createCanvas(w, h), cx = cv.getContext("2d");
    cx.fillStyle = "#14101f"; cx.fillRect(0, 0, w, h);
    cx.drawImage(img, 0, 0, w, h);
    for (const q of [75, 60, 45, 32]) {
      const o = cv.toBuffer("image/jpeg", q);
      if (o.length <= MAX_IMG_BYTES) return "data:image/jpeg;base64," + o.toString("base64");
    }
    k *= 0.75;
  }
  return null;
}

// Saca los botones/listas de un mensaje de WhatsApp para mostrarlos como botones tocables en la página
function extraerBotones(c) {
  const bt = [], lineas = [];
  const add = (l, id) => {
    l = String(l || "").trim(); id = String(id || "").trim();
    if (l && id && bt.length < 12) bt.push({ l: l.slice(0, 40), id: id.slice(0, 200) });
  };
  try {
    for (const b of c.buttons || []) add(b.buttonText?.displayText, b.buttonId);
    for (const b of c.templateButtons || []) {
      if (b.quickReplyButton) add(b.quickReplyButton.displayText, b.quickReplyButton.id);
      else if (b.urlButton) lineas.push(`${b.urlButton.displayText}: ${b.urlButton.url}`);
    }
    for (const s of c.sections || []) for (const r of s.rows || []) add(r.title, r.rowId);
    const nf = c.interactiveMessage?.nativeFlowMessage?.buttons || c.nativeFlowMessage?.buttons || [];
    for (const b of nf) {
      let p = {};
      try { p = JSON.parse(b.buttonParamsJson || "{}"); } catch (_) {}
      if (b.name === "quick_reply") add(p.display_text, p.id);
      else if (b.name === "cta_url") lineas.push(`${p.display_text}: ${p.url}`);
      else if (b.name === "cta_copy") lineas.push(`${p.display_text}: ${p.copy_code}`);
      else if (b.name === "single_select") for (const s of p.sections || []) for (const r of s.rows || []) add(r.title, r.id);
    }
  } catch (_) {}
  return { bt, lineas };
}

function textoDe(c) {
  const im = c.interactiveMessage;
  return [c.title || im?.header?.title, c.text ?? c.caption ?? im?.body?.text, c.footer || im?.footer?.text]
    .filter((x) => typeof x === "string" && x.trim())
    .join("\n\n");
}

// Convierte lo que el bot "mandaría a WhatsApp" en un mensaje para la página
async function aMensaje(c) {
  if (!c || typeof c !== "object") return null;
  if (c.react || c.delete || c.edit) return null;
  const { bt, lineas } = extraerBotones(c);
  let tx = [textoDe(c), ...lineas].filter(Boolean).join("\n");
  let tp = "t", src = null;
  const med = c.image || c.sticker;
  if (med) {
    try { const b = await bufferDe(med); if (b) src = await imagenADataUrl(b); }
    catch (e) { log("no pude preparar la imagen: " + e.message); }
    if (src) tp = "i";
    else tx = (tx ? tx + "\n\n" : "") + "(imagen no disponible en la página)";
  } else if (c.video || c.audio || c.document) {
    const que = c.video ? "video" : c.audio ? "audio" : "archivo";
    tx = (tx ? tx + "\n\n" : "") + `(${que} no disponible en la página; úsalo desde WhatsApp)`;
  }
  if (!tx && !src) return null;
  const m = { tp, tx: tx.slice(0, MAX_TEXTO) };
  if (src) m.src = src;
  if (bt.length) m.bt = bt;
  return m;
}

async function escribir(PAG, cid, m) {
  const ref = PAG.fs.collection("chats").doc(cid), t = PAG.FV.serverTimestamp();
  const b = PAG.fs.batch();
  b.set(ref.collection("msgs").doc(), { de: "bot", t, ...m });
  b.set(ref, { ultimo: { tx: String(m.tx || "Imagen").slice(0, 80), tp: "t", t, de: "bot" } }, { merge: true });
  await b.commit();
}

export function iniciarChatPagina({ PAG, Timestamp, config, commandRegistry, manejarComando, procesarEspera, intentarProcesarTexto, checkTriviaAnswer }) {
  const hecho = new Map();                 // cid -> Timestamp del último mensaje ya atendido
  const ocupado = new Set(), repetir = new Set();
  const usos = new Map();                  // uid -> { t: [...], dia, n }

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

  // "sock" que usan los comandos: lo que iría a este WhatsApp se escribe en la página; lo demás sigue normal
  function crearSock(real, jid, salida) {
    return new Proxy(real, {
      get(t, p) {
        if (p === "sendMessage") {
          return async (to, c, o) => {
            if (to !== jid) return t.sendMessage(to, c, o);
            await salida(c);
            return { key: { remoteJid: jid, fromMe: true, id: "PAG" + Date.now().toString(36) }, message: { conversation: typeof c?.text === "string" ? c.text : "" }, status: 1 };
          };
        }
        if (p === "sendPresenceUpdate" || p === "presenceSubscribe" || p === "readMessages") return async () => {};
        const v = t[p];
        return typeof v === "function" ? v.bind(t) : v;
      }
    });
  }

  async function atender(cid, uid, d) {
    const resp = (tx) => escribir(PAG, cid, { tp: "t", tx });
    const texto = String(d.tx || "").trim().slice(0, 500);
    const bid = typeof d.bid === "string" ? d.bid.trim().slice(0, 200) : "";
    if (!texto && !bid) return;
    const jid = PAG.vinc.get(uid)?.jid;
    if (!PAG.enLinea || !PAG.sock) return resp("El bot está desconectado de WhatsApp ahora mismo. Intenta en un momento.");
    if (!jid) return resp("Para usar los comandos, primero vincula tu WhatsApp: Mi perfil → Mi WhatsApp → Generar código, y mándalo al bot con .vincular CÓDIGO.");
    const lim = limite(uid);
    if (lim) return resp(lim);

    let cola = Promise.resolve(), salio = 0;
    const salida = (c) => (cola = cola.then(async () => {
      const m = await aMensaje(c);
      if (m) { salio++; await escribir(PAG, cid, m); }
    }).catch(log));
    const sock = crearSock(PAG.sock, jid, salida);
    const msg = {
      key: { remoteJid: jid, fromMe: false, id: "PAG" + Math.random().toString(36).slice(2, 12).toUpperCase() },
      message: { conversation: bid || texto },
      messageTimestamp: Math.floor(Date.now() / 1000)
    };

    const correr = async (textoCmd) => {
      const cmd = textoCmd.trim().toLowerCase().split(/\s+/)[0];
      const cat = categoriaDe(cmd);
      if (BLOQ_CMD.has(cmd) || (cat && BLOQ_CAT.test(cat))) {
        await resp("Ese comando no está disponible en el chat de la página. Úsalo desde WhatsApp.");
        return true;
      }
      return await manejarComando(sock, jid, jid, textoCmd, msg);
    };

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
          manejado = await procesarEspera(`${jid}:${jid}`, texto, { sock, from: jid, sender: jid, msg });
          if (!manejado) manejado = await intentarProcesarTexto(sock, jid, jid, texto, msg);
          if (!manejado) {
            const c = comoComando(texto);
            if (c && nombresCmd().has(c.split(/\s+/)[0])) manejado = await correr(c);
          }
          if (!manejado) { try { await checkTriviaAnswer(sock, jid, jid, texto, msg); } catch (e) { log(e); } }
          await cola;
          if (!manejado && !salio) await resp("Escribe un comando para empezar, por ejemplo .menu");
        }
      }
      await cola;
    } catch (e) {
      log(e);
      await resp("Ocurrió un error ejecutando eso. Intenta de nuevo.").catch(log);
    }
  }

  // Atiende, en orden, los mensajes nuevos de la persona. Se marca cada uno ANTES de ejecutarlo:
  // si algo falla o el bot se reinicia, el comando no se repite (importante para la economía).
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
          await PAG.fs.collection("chats").doc(cid).set({ vistos: { bot: d.t } }, { merge: true }).catch(log);
          if (Date.now() - d.t.toMillis() > VENCE_MS) continue;
          await atender(cid, uid, d).catch(log);
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
        if (!hecho.has(cid)) {
          const v = data.vistos && data.vistos.bot;
          hecho.set(cid, v && v.toMillis && v.toMillis() > Date.now() - VENCE_MS ? v : Timestamp.fromMillis(Date.now() - VENCE_MS));
        }
        revisar(cid, uid);
      }
    }, (e) => { log(e); setTimeout(escuchar, 30000); });
  }

  escuchar();
}

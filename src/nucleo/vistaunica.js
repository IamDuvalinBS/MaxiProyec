import { downloadMediaMessage } from "@fer2809fl/baileys";
import fs from "fs";
import path from "path";

const CARPETA = path.join(process.cwd(), "datos", "vistaunica");
const VIDA_MS = 48 * 60 * 60 * 1000;
const MAX_ARCHIVOS = 300;
const TIPOS = ["imageMessage", "videoMessage", "audioMessage"];
const ENVOLTURAS = ["ephemeralMessage", "viewOnceMessage", "viewOnceMessageV2", "viewOnceMessageV2Extension", "deviceSentMessage", "documentWithCaptionMessage"];

const memoria = new Map();
const enCurso = new Set();

try { fs.mkdirSync(CARPETA, { recursive: true }); } catch {}

function desenvolver(message) {
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

function limpiar() {
  try {
    const ahora = Date.now();
    let lista = fs.readdirSync(CARPETA).filter((f) => f.endsWith(".json")).map((f) => {
      const ruta = path.join(CARPETA, f);
      return { f, ruta, t: fs.statSync(ruta).mtimeMs };
    });
    lista.sort((a, b) => a.t - b.t);
    for (const it of lista) {
      if (ahora - it.t > VIDA_MS || lista.length > MAX_ARCHIVOS) {
        try { fs.unlinkSync(it.ruta); } catch {}
        try { fs.unlinkSync(it.ruta.replace(/\.json$/, ".bin")); } catch {}
        memoria.delete(it.f.replace(/\.json$/, ""));
        lista = lista.filter((x) => x !== it);
      }
    }
  } catch {}
}

setInterval(limpiar, 30 * 60 * 1000).unref?.();
limpiar();

function nombreSeguro(id) {
  return String(id).replace(/[^A-Za-z0-9_-]/g, "_");
}

export async function guardarVistaUnica(sock, msg) {
  try {
    if (!msg?.message || !msg.key?.id) return;
    if (!esVistaUnica(msg.message)) return;
    const interno = desenvolver(msg.message);
    const tipo = TIPOS.find((t) => interno?.[t]);
    if (!tipo) return;
    const id = nombreSeguro(msg.key.id);
    if (memoria.has(id) || enCurso.has(id)) return;
    enCurso.add(id);
    try {
      const buffer = await downloadMediaMessage({ key: msg.key, message: interno }, "buffer", {});
      const media = interno[tipo];
      const meta = {
        tipo,
        mimetype: media.mimetype || null,
        caption: media.caption || "",
        ptt: media.ptt ?? null,
        guardado: Date.now()
      };
      memoria.set(id, { buffer, ...meta });
      fs.writeFileSync(path.join(CARPETA, id + ".bin"), buffer);
      fs.writeFileSync(path.join(CARPETA, id + ".json"), JSON.stringify(meta));
      console.log(`👁️ Vista única guardada (${tipo}) id=${id}`);
    } finally {
      enCurso.delete(id);
    }
  } catch (e) {
    console.log("👁️ No se pudo guardar vista única: " + e.message);
  }
}

export function buscarVistaUnica(idOriginal) {
  const id = nombreSeguro(idOriginal);
  if (memoria.has(id)) return memoria.get(id);
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(CARPETA, id + ".json"), "utf8"));
    const buffer = fs.readFileSync(path.join(CARPETA, id + ".bin"));
    const datos = { buffer, ...meta };
    memoria.set(id, datos);
    return datos;
  } catch {
    return null;
  }
}

export async function guardarDesdeHistorial(sock, mensajes) {
  try {
    const ahora = Date.now() / 1000;
    const lista = (mensajes || [])
      .filter((m) => m?.message && m.key?.id && esVistaUnica(m.message))
      .filter((m) => {
        const bruto = m.messageTimestamp;
        const seg = typeof bruto === "object" && bruto ? (bruto.toNumber ? bruto.toNumber() : Number(bruto.low)) : Number(bruto);
        return !seg || ahora - seg < 30 * 24 * 3600;
      })
      .slice(-150);
    if (!lista.length) return;
    console.log(`👁️ Historial: ${lista.length} vistas únicas encontradas, intentando guardarlas...`);
    for (const m of lista) {
      await guardarVistaUnica(sock, m);
      await new Promise((r) => setTimeout(r, 150));
    }
  } catch (e) {
    console.log("👁️ Error con el historial: " + e.message);
  }
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function esperarGuardado(id, ms) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    const g = buscarVistaUnica(id);
    if (g) return g;
    await esperar(500);
  }
  return null;
}

export async function recuperarVistaUnica(sock, msg, info) {
  const id = info?.stanzaId;
  if (!id) return null;
  const from = msg.key.remoteJid;
  const esGrupo = from.endsWith("@g.us");
  const participante = info.participant || (esGrupo ? msg.key.participant : undefined);

  if (typeof sock.requestPlaceholderResend === "function") {
    try {
      await sock.requestPlaceholderResend({ remoteJid: from, id, fromMe: false, participant: participante });
      const g = await esperarGuardado(id, 10000);
      if (g) return g;
    } catch (e) {
      console.log("👁️ requestPlaceholderResend falló: " + e.message);
    }
  }

  if (typeof sock.fetchMessageHistory === "function") {
    const bruto = msg.messageTimestamp;
    const seg = typeof bruto === "object" && bruto ? (bruto.toNumber ? bruto.toNumber() : Number(bruto.low)) : Number(bruto);
    for (const cantidad of [50, 200]) {
      try {
        await sock.fetchMessageHistory(cantidad, { remoteJid: from, id: msg.key.id, fromMe: Boolean(msg.key.fromMe), participant: msg.key.participant }, seg || Math.floor(Date.now() / 1000));
        const g = await esperarGuardado(id, 15000);
        if (g) return g;
      } catch (e) {
        console.log("👁️ fetchMessageHistory falló: " + e.message);
      }
    }
  }

  return null;
}

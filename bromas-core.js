
import { conseguirGif, tieneGif } from "./bromas-gifs.js";

export const BLOQUES = 10;
export const ESPERA_MS = 1800;

export const numero = (jid) => String(jid || "").split("@")[0].split(":")[0];

export const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const azar = (n) => Math.floor(Math.random() * n);

export const elegir = (lista) => lista[azar(lista.length)];

export const mezclar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = azar(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

export const porcentaje = () => Math.round(Math.random() * 1000) / 10;

export const barra = (pct) => {
  const llenos = Math.round((pct / 100) * BLOQUES);
  return "█".repeat(llenos) + "▒".repeat(BLOQUES - llenos) + " " + pct + "%";
};

export const tramo = (pct, frases) => frases[pct < 25 ? 0 : pct < 50 ? 1 : pct < 75 ? 2 : 3];

export const contextoDe = (msg) => {
  const m = msg.message || {};
  return Object.values(m).find((v) => v?.contextInfo)?.contextInfo || {};
};

export const personasDe = (msg) => {
  const info = contextoDe(msg);
  const lista = [...(info.mentionedJid || []), ...(info.participant ? [info.participant] : [])];
  const vistos = new Set();
  return lista.filter((jid) => {
    const n = numero(jid);
    if (vistos.has(n)) return false;
    vistos.add(n);
    return true;
  });
};

export const argumentos = (cleanText) => String(cleanText || "").split(/\s+/).slice(1).join(" ").trim();

export const sinMenciones = (texto) => String(texto || "").replace(/@\d{5,}/g, "").replace(/\s+/g, " ").trim();

export async function enviarConEdicion(sock, from, msg, { inicio, mentions, texto, espera = ESPERA_MS, etiqueta = "bromas" }) {
  const enviado = await sock.sendMessage(from, { text: inicio, mentions }, { quoted: msg });
  await esperar(espera);
  try {
    await sock.sendMessage(from, { text: texto, mentions, edit: enviado.key });
  } catch (e) {
    console.log("❌ Error editando el mensaje de " + etiqueta + ": " + e.message);
    await sock.sendMessage(from, { text: texto, mentions }, { quoted: msg });
  }
}

export async function enviarTexto(sock, from, msg, texto, mentions = []) {
  await sock.sendMessage(from, { text: texto, mentions }, { quoted: msg });
}

export const soloGrupo = (from) => from.endsWith("@g.us");

export async function participantesDelGrupo(sock, from) {
  const meta = await sock.groupMetadata(from);
  const propios = new Set([numero(sock.user?.id), numero(sock.user?.lid)]);
  return meta.participants.map((p) => p.id).filter((id) => !propios.has(numero(id)));
}

export async function enviarConGif(sock, from, msg, { clave, texto, mentions = [] }) {
  const buffer = tieneGif(clave) ? await conseguirGif(clave) : null;
  if (!buffer) return enviarTexto(sock, from, msg, texto, mentions);
  try {
    await sock.sendMessage(from, { video: buffer, mimetype: "video/mp4", gifPlayback: true, caption: texto, mentions }, { quoted: msg });
  } catch (e) {
    console.log("❌ Error enviando el gif de " + clave + ": " + e.message);
    await enviarTexto(sock, from, msg, texto, mentions);
  }
}

export async function enviarResultado(sock, from, msg, { clave, inicio, mentions, texto, espera = ESPERA_MS, etiqueta = "bromas" }) {
  if (!tieneGif(clave)) return enviarConEdicion(sock, from, msg, { inicio, mentions, texto, espera, etiqueta });
  try { await sock.sendPresenceUpdate("composing", from); } catch {}
  const [buffer] = await Promise.all([conseguirGif(clave), esperar(espera)]);
  if (!buffer) return enviarConEdicion(sock, from, msg, { inicio, mentions, texto, espera: 1200, etiqueta });
  try {
    await sock.sendMessage(from, { video: buffer, mimetype: "video/mp4", gifPlayback: true, caption: texto, mentions }, { quoted: msg });
  } catch (e) {
    console.log("❌ Error enviando el gif de " + etiqueta + ": " + e.message);
    await enviarTexto(sock, from, msg, texto, mentions);
  }
}

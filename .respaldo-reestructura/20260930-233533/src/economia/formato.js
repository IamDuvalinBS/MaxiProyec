import { CURRENCY } from "../../motores/db.js";
import { formatTime } from "../../motores/ui.js";

export const SEPARADOR = "╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦╾";

export function fmt(n) {
  return Math.round(n).toLocaleString("en-US");
}

export function monto(n) {
  return `${fmt(n)} ${CURRENCY}`;
}

export function montoConSigno(n) {
  return `${n < 0 ? "-" : "+"}${monto(Math.abs(n))}`;
}

export function tarjeta({ emoji, titulo, subtitulo, relato, lineas = [], tip }) {
  if (subtitulo === undefined && tip === undefined) {
    const partes = [`「${emoji}」 *${titulo}*`, SEPARADOR];
    if (relato) partes.push(`> ${relato}`, "");
    partes.push(...lineas);
    return partes.join("\n").trimEnd();
  }

  const partes = [`⧼${emoji}⧽ *${titulo}*`];
  if (subtitulo) partes.push(`     ➥ ${subtitulo}`);
  partes.push("");
  if (relato) partes.push(`> ${relato}`, "");
  partes.push(...lineas);
  if (tip) partes.push("", `> ${tip}`);
  return partes.join("\n").trimEnd();
}

export function textoEspera(ms) {
  return `⏳ Este comando se encuentra en espera. Tiempo restante: *${formatTime(ms)}*.`;
}

export function avisoNivel(nivel) {
  return `🎉 *¡NUEVO NIVEL!* Se alcanzó el nivel *${nivel}*.`;
}

export function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

export function entre(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pausa(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function leerMonto(texto, disponible) {
  if (!texto) return null;
  const limpio = texto.trim().toLowerCase().replace(/,/g, "");
  if (["todo", "all", "max"].includes(limpio)) return disponible > 0 ? disponible : null;
  let valor = null;
  if (/^\d+$/.test(limpio)) {
    valor = parseInt(limpio, 10);
  } else {
    const m = limpio.match(/^(\d+(?:\.\d+)?)(k|m)$/);
    if (m) valor = Math.floor(parseFloat(m[1]) * (m[2] === "k" ? 1000 : 1000000));
  }
  return valor && valor > 0 ? valor : null;
}

export function jidMencionado(msg) {
  const lista = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  return lista && lista.length ? lista[0] : null;
}

export async function enviarYEditar({ sock, from, reply, inicial, final, espera = 1800, mentions }) {
  const enviado = await reply({ text: inicial });
  await pausa(espera);
  try {
    await sock.sendMessage(from, { text: final, edit: enviado.key, ...(mentions ? { mentions } : {}) });
  } catch (e) {
    await reply({ text: final, ...(mentions ? { mentions } : {}) });
  }
}

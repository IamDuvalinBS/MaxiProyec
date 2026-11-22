import { getAccount } from "../../../motores/db.js";
import { formatTime } from "../../../motores/ui.js";
import { tarjeta, monto, leerMonto, jidObjetivo } from "../../economia/formato.js";
import { asegurarKarma, karmaListo, apodoDe } from "../../../motores/karma.js";
import {
  asegurarFiados, fiadosListo, FIADO_MIN, FIADO_MAX, INTERES, PLAZO_MIN_DIAS, PLAZO_MAX_DIAS, plazoDe, DIA_MS, OFERTA_MS, APODO_DEUDOR, KARMA_MOROSO,
  MAX_OFERTAS_ABIERTAS, crearOferta, aceptarOferta, pagarDeuda, ofertasPara, ofertasDe, deudasDe, prestadosDe,
  deudoresDelChat, tieneDeudaFiado, estaMoroso, restanteDe, mismaPersona, registrarSock
} from "../../../motores/fiados.js";

const CAT = "Economía";

const tag = (jid) => `@${String(jid || "").split("@")[0].split(":")[0]}`;
const partes = (cleanText) => cleanText.trim().split(/\s+/).slice(1);
const sinMenciones = (cleanText) => partes(cleanText).filter((p) => !p.startsWith("@"));
const textoDias = (n) => `${n} ${n === 1 ? "día" : "días"}`;

// Acepta "2dias", "2 dias", "2d", "2días" en cualquier posición; lo que sobra es la cantidad.
function leerDiasYCantidad(cleanText) {
  const tokens = sinMenciones(cleanText);
  const resto = [];
  let dias = null;
  for (let i = 0; i < tokens.length; i++) {
    const p = tokens[i].toLowerCase();
    const pegado = p.match(/^(\d+)(?:d|dia|dias|día|días)$/);
    if (pegado) { dias = parseInt(pegado[1], 10); continue; }
    if (/^\d+$/.test(p) && /^(?:d|dia|dias|día|días)$/.test((tokens[i + 1] || "").toLowerCase())) { dias = parseInt(p, 10); i++; continue; }
    resto.push(tokens[i]);
  }
  return { dias, cantidad: leerMonto(resto[0], 0) };
}

const hora = (ms) => new Date(ms).toLocaleString("es-MX", { timeZone: "America/Mexico_City", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

async function listo(reply) {
  await Promise.all([asegurarKarma(), asegurarFiados()]);
  if (karmaListo() && fiadosListo()) return true;
  await reply({ text: "⏳ Mambo Fiado todavía está iniciando, intenta de nuevo en unos segundos." });
  return false;
}

function tiempoDe(f) {
  if (f.estado === "vencido") return "🚨 VENCIDO";
  const resta = f.vence - Date.now();
  return resta > 0 ? `⏳ vence en ${formatTime(resta)}` : "⏳ por vencer";
}

// ───────────── .fiado ─────────────

const cmdFiado = {
  names: [".fiado"],
  usage: ".fiado @usuario <días>dias <cantidad>",
  desc: "Presta dinero con el plazo que elijas; Mambo Bot lo cobra si no pagan",
  category: CAT,
  handler: async ({ sock, from, sender, cleanText, msg, reply }) => {
    if (!(await listo(reply))) return;
    registrarSock(from, sock);
    const deudor = jidObjetivo(msg);
    const { dias: diasElegidos, cantidad } = leerDiasYCantidad(cleanText);
    const dias = diasElegidos ?? 1;

    if (!deudor || !cantidad) {
      return reply({
        text: tarjeta({
          emoji: "🎲",
          titulo: "MAMBO FIADO",
          relato: "Mambo Bot es el banco y el cobrador del grupo: presta, cobra y no perdona.",
          lineas: [
            "💬 *USO::* *.fiado @usuario <días>dias <cantidad>*",
            `💰 *LÍMITES::* ${monto(FIADO_MIN)} a ${monto(FIADO_MAX)}`,
            `📈 *INTERÉS::* ${Math.round(INTERES * 100)}% para Mambo Bot`,
            `⏱️ *PLAZO::* de ${PLAZO_MIN_DIAS} a ${PLAZO_MAX_DIAS} días que eliges tú (si no pones, 1 día)`
          ],
          tip: ["Ejemplo: *.fiado @Juan 2dias 1000*", "Juan acepta con *.aceptarfiado* y paga con *.pagarfiado @tú*."]
        })
      });
    }
    if (mismaPersona(deudor, sender)) return reply({ text: "⚠️ No puedes fiarte a ti mismo." });
    if (!Number.isInteger(dias) || dias < PLAZO_MIN_DIAS || dias > PLAZO_MAX_DIAS) {
      return reply({ text: `⚠️ El plazo debe ser de ${PLAZO_MIN_DIAS} a ${PLAZO_MAX_DIAS} días. Ejemplo: *.fiado @Juan 2dias 1000*` });
    }
    if (cantidad < FIADO_MIN) return reply({ text: `⚠️ El fiado mínimo es de *${monto(FIADO_MIN)}*.` });
    if (cantidad > FIADO_MAX) return reply({ text: `⚠️ El fiado máximo es de *${monto(FIADO_MAX)}*.` });

    const enMano = getAccount(sender).wallet;
    if (enMano < cantidad) return reply({ text: `⚠️ No tienes tanto en mano. Tienes *${monto(Math.max(0, enMano))}*. Usa *.retirar* si lo tienes en el banco.` });

    if (estaMoroso(deudor)) {
      return reply({ text: `🚫 ${tag(deudor)} tiene un fiado vencido y no puede pedir otro hasta pagarlo.`, mentions: [deudor] });
    }
    if (tieneDeudaFiado(deudor)) {
      return reply({ text: `🚫 ${tag(deudor)} ya tiene un fiado activo. Solo se puede deber uno a la vez.`, mentions: [deudor] });
    }
    if (ofertasDe(sender).length >= MAX_OFERTAS_ABIERTAS) {
      return reply({ text: `⚠️ Ya tienes *${MAX_OFERTAS_ABIERTAS}* ofertas esperando respuesta. Espera a que las acepten o expiren.` });
    }

    const f = crearOferta({ prestamista: sender, deudor, cantidad, chat: from, dias });
    await reply({
      text: tarjeta({
        emoji: "🎲",
        titulo: `¡MAMBO FIADO! #${f.n}`,
        subtitulo: `${tag(sender)} ➜ ${tag(deudor)}`,
        lineas: [
          `💸 *PRESTA::* ${tag(sender)}`,
          `👤 *RECIBE::* ${tag(deudor)}`,
          `💰 *MONTO::* ${monto(f.monto)}`,
          `📈 *INTERÉS::* +${monto(f.interes)} (para Mambo Bot)`,
          `🧾 *A PAGAR::* ${monto(f.deuda)}`,
          `⏱️ *PLAZO::* ${textoDias(f.dias)} desde que acepta`
        ],
        tip: [
          `${tag(deudor)} escribe *.aceptarfiado* para recibir el dinero (la oferta dura ${Math.round(OFERTA_MS / 60000)} min).`,
          `Si no paga a tiempo: Mambo le cobra a la fuerza, ${KARMA_MOROSO} de karma y apodo "${APODO_DEUDOR}".`
        ]
      }),
      mentions: [sender, deudor]
    });
  }
};

// ───────────── .aceptarfiado ─────────────

const ERRORES_ACEPTAR = {
  cerrada: () => "⚠️ Esa oferta ya no está disponible.",
  moroso: () => "🚫 Tienes un fiado vencido. Págalo con *.pagarfiado* antes de aceptar otro.",
  deuda_activa: () => "🚫 Ya tienes un fiado activo. Págalo con *.pagarfiado* antes de aceptar otro.",
  sin_fondos_prestamista: (f) => `⚠️ ${tag(f.prestamistaJid)} ya no tiene ese dinero en mano; la oferta se canceló.`
};

const cmdAceptar = {
  names: [".aceptarfiado", ".afiado"],
  usage: ".aceptarfiado [@usuario | número]",
  desc: "Aceptar el fiado que te ofrecieron",
  category: CAT,
  handler: async ({ sock, from, sender, cleanText, msg, reply }) => {
    if (!(await listo(reply))) return;
    registrarSock(from, sock);
    const prestamista = jidObjetivo(msg);
    const numero = parseInt((sinMenciones(cleanText)[0] || "").replace(/\D/g, ""), 10) || null;

    let ofertas = ofertasPara(sender);
    if (numero) ofertas = ofertas.filter((f) => f.n === numero);
    if (prestamista) ofertas = ofertas.filter((f) => mismaPersona(f.prestamistaJid, prestamista));
    if (!ofertas.length) return reply({ text: "⚠️ No tienes ofertas de fiado pendientes. Alguien debe escribirte *.fiado @tú <cantidad>*." });

    const f = ofertas[ofertas.length - 1];
    const r = aceptarOferta(f);
    if (r.error) return reply({ text: ERRORES_ACEPTAR[r.error](f), mentions: [f.prestamistaJid] });

    await reply({
      text: tarjeta({
        emoji: "🤝",
        titulo: `FIADO #${f.n} ACEPTADO`,
        subtitulo: `${tag(f.prestamistaJid)} ➜ ${tag(f.deudorJid)}`,
        relato: "Mambo Bot entregó el dinero y ya anotó la deuda.",
        lineas: [
          `💰 *RECIBISTE::* ${monto(f.monto)}`,
          `🧾 *DEBES::* ${monto(f.deuda)}`,
          `⏱️ *VENCE::* ${hora(f.vence)} (${textoDias(Math.round(plazoDe(f) / DIA_MS))})`
        ],
        tip: [`Paga con *.pagarfiado ${tag(f.prestamistaJid)}*`, `Si no pagas, Mambo te cobra a la fuerza, ${KARMA_MOROSO} de karma y el apodo "${APODO_DEUDOR}".`]
      }),
      mentions: [f.prestamistaJid, f.deudorJid]
    });
  }
};

// ───────────── .pagarfiado ─────────────

const cmdPagar = {
  names: [".pagarfiado", ".pfiado"],
  usage: ".pagarfiado [@usuario]",
  desc: "Pagar tu deuda de Mambo Fiado",
  category: CAT,
  handler: async ({ sock, from, sender, msg, reply }) => {
    if (!(await listo(reply))) return;
    registrarSock(from, sock);
    const prestamista = jidObjetivo(msg);

    let deudas = deudasDe(sender);
    if (prestamista) deudas = deudas.filter((f) => mismaPersona(f.prestamistaJid, prestamista));
    if (!deudas.length) {
      return reply({ text: prestamista ? `✅ No le debes ningún fiado a ${tag(prestamista)}.` : "✅ No debes ningún fiado. Estás limpio.", mentions: prestamista ? [prestamista] : [] });
    }

    const f = deudas[0];
    const r = pagarDeuda(f);
    if (r.error === "fondos") {
      return reply({ text: `⚠️ Te faltan *${monto(r.falta - r.total)}*. Debes *${monto(r.falta)}* y tienes *${monto(r.total)}* entre mano y banco.` });
    }

    const lineas = [`💸 *PAGASTE::* ${monto(r.falta)}`];
    if (r.alPrestamista > 0) lineas.push(`📥 *RECIBIÓ ${tag(f.prestamistaJid)}::* ${monto(r.alPrestamista)}`);
    if (r.aMambo > 0) lineas.push(`🏦 *INTERÉS PARA MAMBO::* ${monto(r.aMambo)}`);
    if (r.karma && r.karma.cambio > 0) lineas.push(`⭐ *KARMA::* ${r.karma.antes} ➜ *${r.karma.despues}* (+${r.karma.cambio})`);
    if (r.aTiempo) lineas.push("🤝 *REPUTACIÓN::* queda como CONFIABLE");

    await reply({
      text: tarjeta({
        emoji: r.aTiempo ? "✅" : "🧾",
        titulo: r.aTiempo ? `FIADO #${f.n} PAGADO` : `DEUDA #${f.n} SALDADA`,
        subtitulo: `${tag(f.deudorJid)} ➜ ${tag(f.prestamistaJid)}`,
        relato: r.aTiempo ? "Pagó a tiempo, así se hace." : "Pagó tarde: se acabó la deuda y ya puede pedir fiados otra vez, pero el castigo se queda.",
        lineas,
        tip: r.aTiempo ? "Pagar a tiempo suma karma." : `El apodo "${APODO_DEUDOR}" dura 3 días desde el cobro.`
      }),
      mentions: [f.deudorJid, f.prestamistaJid]
    });
  }
};

// ───────────── .misfiados ─────────────

const cmdMisFiados = {
  names: [".misfiados", ".mifiado"],
  usage: ".misfiados",
  desc: "Ver cuánto debes y cuánto te deben",
  category: CAT,
  handler: async ({ sender, reply }) => {
    if (!(await listo(reply))) return;
    const debes = deudasDe(sender);
    const tedeben = prestadosDe(sender);
    const ofertas = ofertasPara(sender);
    const mentions = new Set([sender]);
    const lineas = [];

    if (debes.length) {
      lineas.push("*📉 LO QUE DEBES*");
      for (const f of debes) {
        mentions.add(f.prestamistaJid);
        lineas.push(`*#${f.n}* a ${tag(f.prestamistaJid)}: *${monto(restanteDe(f))}* · ${tiempoDe(f)}`);
      }
    }
    if (tedeben.length) {
      if (lineas.length) lineas.push("");
      lineas.push("*📈 LO QUE TE DEBEN*");
      for (const f of tedeben) {
        mentions.add(f.deudorJid);
        lineas.push(`*#${f.n}* ${tag(f.deudorJid)}: *${monto(restanteDe(f))}* · ${tiempoDe(f)}`);
      }
    }
    if (ofertas.length) {
      if (lineas.length) lineas.push("");
      lineas.push("*📨 OFERTAS PARA TI*");
      for (const f of ofertas) {
        mentions.add(f.prestamistaJid);
        lineas.push(`*#${f.n}* ${tag(f.prestamistaJid)} te ofrece *${monto(f.monto)}* (pagas ${monto(f.deuda)})`);
      }
    }

    if (!lineas.length) {
      return reply({ text: tarjeta({ emoji: "🧼", titulo: "ESTÁS LIMPIO", relato: "No debes nada ni te deben nada. Mambo no tiene nada contra ti... por ahora." }) });
    }

    const apodo = apodoDe(sender);
    await reply({
      text: tarjeta({
        emoji: "🎲",
        titulo: "TUS FIADOS",
        subtitulo: apodo ? `🏷️ ${apodo}` : undefined,
        lineas,
        tip: debes.length ? `Paga con *.pagarfiado ${tag(debes[0].prestamistaJid)}*` : ofertas.length ? "Acepta con *.aceptarfiado*" : undefined
      }),
      mentions: [...mentions]
    });
  }
};

// ───────────── .deudores ─────────────

const cmdDeudores = {
  names: [".deudores", ".morosos"],
  usage: ".deudores",
  desc: "Lista de los que deben en el grupo",
  category: CAT,
  handler: async ({ sock, from, reply }) => {
    if (!(await listo(reply))) return;
    registrarSock(from, sock);
    const lista = deudoresDelChat(from);
    if (!lista.length) {
      return reply({ text: tarjeta({ emoji: "🎉", titulo: "SIN DEUDORES", relato: "Nadie le debe nada a nadie en este chat. Mambo está aburrido." }) });
    }

    const mentions = new Set();
    const mostrados = lista.slice(0, 15);
    const lineas = mostrados.map((f, i) => {
      mentions.add(f.deudorJid);
      mentions.add(f.prestamistaJid);
      const apodo = apodoDe(f.deudorJid);
      return `*${i + 1}.* ${tag(f.deudorJid)} debe *${monto(restanteDe(f))}* a ${tag(f.prestamistaJid)}\n> ${tiempoDe(f)}${f.estado === "vencido" ? ` · 🏷️ ${apodo || APODO_DEUDOR}` : ""}`;
    });

    await reply({
      text: tarjeta({
        emoji: "📜",
        titulo: "LISTA DE DEUDORES",
        subtitulo: `${lista.length} ${lista.length === 1 ? "deuda abierta" : "deudas abiertas"}${lista.length > mostrados.length ? ` (se muestran ${mostrados.length})` : ""}`,
        relato: "Mambo Bot no olvida.",
        lineas,
        tip: "Para salir de esta lista: *.pagarfiado*"
      }),
      mentions: [...mentions]
    });
  }
};

export default [cmdFiado, cmdAceptar, cmdPagar, cmdMisFiados, cmdDeudores];

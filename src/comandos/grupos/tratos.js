import { tarjeta, jidObjetivo } from "../../economia/formato.js";
import { formatTime } from "../../../motores/ui.js";
import {
  asegurarKarma, karmaListo, PUNTOS, estadisticasDe, cambiarKarma, buenaAccion,
  puedeGanarPorCumplir, anotarCumplido, crearTrato, getTrato, guardarTrato, tratosDe,
  esParte, esCreador, esDestino, mismaPersona, MAX_CUMPLIDOS_CON_KARMA_POR_DIA
} from "../../../motores/karma.js";

const CAT = "Grupos";
const MAX_ABIERTOS = 10;
const MAX_TEXTO = 250;
const MIN_TEXTO = 5;

const numeroDe = (jid) => String(jid || "").split("@")[0].split(":")[0];
const tag = (jid) => `@${numeroDe(jid)}`;

const fechaHora = (ms) =>
  new Date(ms).toLocaleString("es-MX", { timeZone: "America/Mexico_City", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

const ESTADOS = {
  pendiente: "⏳ Pendiente de aceptar",
  vigente: "🤝 Vigente",
  cumplido: "✅ Cumplido",
  incumplido: "❌ No cumplido"
};

const partes = (cleanText) => cleanText.trim().split(/\s+/).slice(1);

function leerNumero(cleanText) {
  const n = parseInt((partes(cleanText)[0] || "").replace(/\D/g, ""), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function barra(karma) {
  const llenos = Math.round(karma / 10);
  return `${"█".repeat(llenos)}${"░".repeat(10 - llenos)}`;
}

function lineaKarma(r, jid) {
  if (!r) return null;
  const lineas = [`⭐ *KARMA ${tag(jid)}::* ${r.antes} ➜ *${r.despues}* (${r.nivelAhora.emoji} ${r.nivelAhora.nombre})`];
  if (r.cambioNivel) {
    const sube = r.despues > r.antes;
    lineas.push(`${sube ? "📈" : "📉"} *NIVEL::* ${r.nivelAntes.emoji} ${r.nivelAntes.nombre} ➜ ${r.nivelAhora.emoji} ${r.nivelAhora.nombre}`);
  }
  return lineas;
}

async function listo(reply) {
  await asegurarKarma();
  if (karmaListo()) return true;
  await reply({ text: "⏳ El sistema de tratos todavía está iniciando, intenta de nuevo en unos segundos." });
  return false;
}

function cargarTrato(n, reply) {
  if (!n) { reply({ text: "⚠️ Indica el número del trato. Ejemplo: *.aceptar 12*" }); return null; }
  const trato = getTrato(n);
  if (!trato) { reply({ text: `⚠️ No existe el trato *#${n}*.` }); return null; }
  return trato;
}

const otroDe = (trato, sender) => (esCreador(trato, sender) ? trato.destinoJid : trato.creadorJid);

// ───────────── .trato ─────────────

const cmdTrato = {
  names: [".trato", ".tratos"],
  usage: ".trato @usuario <lo que prometes>",
  desc: "Deja un trato registrado con número, fecha y hora; la otra persona lo acepta con .aceptar",
  category: CAT,
  handler: async ({ sender, from, cleanText, msg, reply }) => {
    if (!(await listo(reply))) return;
    const destino = jidObjetivo(msg);
    const texto = partes(cleanText).filter((p, i, todo) => !(p.startsWith("@") && todo.slice(0, i).every((x) => x.startsWith("@")))).join(" ").trim();

    if (!destino || texto.length < MIN_TEXTO) {
      return reply({ text: "⚠️ Uso correcto: *.trato @usuario <lo que prometes>*\nEjemplo: *.trato @Juan Si pierdo te doy 1000*\n\nTambién puedes responder al mensaje de la persona." });
    }
    if (mismaPersona(destino, sender)) return reply({ text: "⚠️ No puedes hacer un trato contigo mismo." });
    if (texto.length > MAX_TEXTO) return reply({ text: `⚠️ El trato es muy largo (máximo ${MAX_TEXTO} caracteres).` });

    const abiertos = tratosDe(sender, (t) => esCreador(t, sender) && (t.estado === "pendiente" || t.estado === "vigente"));
    if (abiertos.length >= MAX_ABIERTOS) {
      return reply({ text: `⚠️ Ya tienes *${MAX_ABIERTOS}* tratos abiertos. Espera a que cierren alguno con *.cumplido* o *.nocumplio* antes de crear otro.` });
    }

    const trato = crearTrato({ creador: sender, destino, texto, grupo: from.endsWith("@g.us") ? from : null });
    const rep = estadisticasDe(sender);
    const lineas = [
      `🗣️ *PROMETE::* ${tag(sender)}`,
      `🤝 *CON::* ${tag(destino)}`,
      `📝 *TRATO::* ${texto}`,
      `🕒 *FECHA::* ${fechaHora(trato.creadoEn)}`,
      `📌 *ESTADO::* ${ESTADOS.pendiente}`
    ];
    if (rep.karma < 50) lineas.push(`⚠️ *REPUTACIÓN DE ${tag(sender)}::* ${rep.nivel.emoji} ${rep.nivel.nombre} (${rep.karma}/100)`);

    await reply({
      text: tarjeta({
        emoji: "📜",
        titulo: `TRATO #${trato.n}`,
        subtitulo: "Registrado por el testigo del grupo",
        lineas,
        tip: [`${tag(destino)} debe escribir *.aceptar ${trato.n}* para que valga.`, "Quien crea el trato es quien se compromete a cumplirlo."]
      }),
      mentions: [sender, destino]
    });
  }
};

// ───────────── .aceptar ─────────────

const cmdAceptar = {
  names: [".aceptar", ".aceptartrato"],
  usage: ".aceptar <número>",
  desc: "Aceptar un trato que te hicieron para que quede vigente",
  category: CAT,
  handler: async ({ sender, cleanText, reply }) => {
    if (!(await listo(reply))) return;
    const trato = cargarTrato(leerNumero(cleanText), reply);
    if (!trato) return;
    if (!esDestino(trato, sender)) return reply({ text: `⚠️ El trato *#${trato.n}* no es contigo, solo ${tag(trato.destinoJid)} puede aceptarlo.`, mentions: [trato.destinoJid] });
    if (trato.estado !== "pendiente") return reply({ text: `⚠️ El trato *#${trato.n}* ya está: ${ESTADOS[trato.estado]}.` });

    trato.estado = "vigente";
    trato.aceptadoEn = Date.now();
    guardarTrato(trato);

    await reply({
      text: tarjeta({
        emoji: "🤝",
        titulo: `TRATO #${trato.n} ACEPTADO`,
        subtitulo: "Ahora vale",
        lineas: [
          `🗣️ *PROMETE::* ${tag(trato.creadorJid)}`,
          `✅ *ACEPTA::* ${tag(trato.destinoJid)}`,
          `📝 *TRATO::* ${trato.texto}`,
          `🕒 *ACEPTADO::* ${fechaHora(trato.aceptadoEn)}`
        ],
        tip: [`Si se cumple, ${tag(trato.destinoJid)} escribe *.cumplido ${trato.n}*`, `Si no se cumple: *.nocumplio ${trato.n}*`]
      }),
      mentions: [trato.creadorJid, trato.destinoJid]
    });
  }
};

// ───────────── .cumplido ─────────────

const cmdCumplido = {
  names: [".cumplido"],
  usage: ".cumplido <número>",
  desc: "Confirmar que te cumplieron un trato (+10 de karma para quien lo prometió)",
  category: CAT,
  handler: async ({ sender, cleanText, reply }) => {
    if (!(await listo(reply))) return;
    const trato = cargarTrato(leerNumero(cleanText), reply);
    if (!trato) return;
    if (!esDestino(trato, sender)) {
      return reply({ text: `⚠️ Solo ${tag(trato.destinoJid)} (quien aceptó el trato *#${trato.n}*) puede confirmar que se cumplió.`, mentions: [trato.destinoJid] });
    }
    if (trato.estado !== "vigente") return reply({ text: `⚠️ El trato *#${trato.n}* está: ${ESTADOS[trato.estado]}. Solo se cierra un trato vigente.` });

    trato.estado = "cumplido";
    trato.cerradoEn = Date.now();
    guardarTrato(trato);

    const gana = puedeGanarPorCumplir(trato.creadorJid, trato.destinoJid);
    const r = cambiarKarma(trato.creadorJid, gana ? PUNTOS.cumplir : 0, { cuenta: "cumplido" });
    if (gana) anotarCumplido(trato.creadorJid, trato.destinoJid);

    const lineas = [`📝 *TRATO::* ${trato.texto}`, `🕒 *CERRADO::* ${fechaHora(trato.cerradoEn)}`, ...lineaKarma(r, trato.creadorJid)];
    const tip = gana
      ? (r.cambio > 0 ? `${tag(trato.creadorJid)} cumplió y gana +${r.cambio} de karma.` : `${tag(trato.creadorJid)} cumplió y ya tiene el karma al máximo.`)
      : `Sin karma extra: máximo ${MAX_CUMPLIDOS_CON_KARMA_POR_DIA} tratos con karma por día y uno cada 24 h con la misma persona.`;

    await reply({
      text: tarjeta({ emoji: "✅", titulo: `TRATO #${trato.n} CUMPLIDO`, subtitulo: "Cerrado", lineas, tip }),
      mentions: [trato.creadorJid, trato.destinoJid]
    });
  }
};

// ───────────── .nocumplio ─────────────

const cmdNoCumplio = {
  names: [".nocumplio", ".incumplido"],
  usage: ".nocumplio <número>",
  desc: "Marcar un trato como no cumplido (-25 de karma para quien lo prometió)",
  category: CAT,
  handler: async ({ sender, cleanText, reply }) => {
    if (!(await listo(reply))) return;
    const trato = cargarTrato(leerNumero(cleanText), reply);
    if (!trato) return;
    if (!esParte(trato, sender)) return reply({ text: `⚠️ Solo ${tag(trato.creadorJid)} y ${tag(trato.destinoJid)} pueden cerrar el trato *#${trato.n}*.`, mentions: [trato.creadorJid, trato.destinoJid] });
    if (trato.estado !== "vigente") return reply({ text: `⚠️ El trato *#${trato.n}* está: ${ESTADOS[trato.estado]}. Solo se marca un trato vigente.` });

    trato.estado = "incumplido";
    trato.cerradoEn = Date.now();
    guardarTrato(trato);

    const r = cambiarKarma(trato.creadorJid, PUNTOS.incumplir, { cuenta: "incumplido" });
    const lineas = [`📝 *TRATO::* ${trato.texto}`, `🕒 *MARCADO::* ${fechaHora(trato.cerradoEn)}`, ...lineaKarma(r, trato.creadorJid)];
    if (r.nivelAhora.apodo) lineas.push(`🏷️ *APODO::* ${r.nivelAhora.apodo}`);

    await reply({
      text: tarjeta({
        emoji: "❌",
        titulo: `TRATO #${trato.n} NO CUMPLIDO`,
        subtitulo: "Queda marcado",
        lineas,
        tip: `${tag(trato.creadorJid)} puede pedir perdón con *.perdon ${tag(trato.destinoJid)}*.`
      }),
      mentions: [trato.creadorJid, trato.destinoJid]
    });
  }
};

// ───────────── .mistratos ─────────────

const cmdMisTratos = {
  names: [".mistratos"],
  usage: ".mistratos",
  desc: "Ver tus tratos pendientes y vigentes",
  category: CAT,
  handler: async ({ sender, reply }) => {
    if (!(await listo(reply))) return;
    const abiertos = tratosDe(sender, (t) => t.estado === "pendiente" || t.estado === "vigente");
    if (!abiertos.length) {
      return reply({ text: tarjeta({ emoji: "📭", titulo: "SIN TRATOS PENDIENTES", relato: "No tienes tratos abiertos.", tip: "Crea uno con *.trato @usuario <lo que prometes>*" }) });
    }

    const mostrados = abiertos.slice(-15);
    const mentions = new Set([sender]);
    const lineas = mostrados.map((t) => {
      const yoPrometo = esCreador(t, sender);
      const otroJid = otroDe(t, sender);
      mentions.add(otroJid);
      const accion = t.estado === "pendiente" ? (yoPrometo ? "esperando que acepte" : `escribe *.aceptar ${t.n}*`) : ESTADOS.vigente;
      return `*#${t.n}* ${yoPrometo ? "➜" : "⬅️"} ${tag(otroJid)} · ${accion}\n> ${t.texto}`;
    });

    await reply({
      text: tarjeta({
        emoji: "📜",
        titulo: "TUS TRATOS",
        subtitulo: `${abiertos.length} ${abiertos.length === 1 ? "abierto" : "abiertos"}${abiertos.length > mostrados.length ? ` (se muestran los últimos ${mostrados.length})` : ""}`,
        lineas,
        tip: ["➜ lo prometes tú · ⬅️ te lo prometen a ti", "Se cierran con *.cumplido <n>* (lo confirma quien aceptó) o *.nocumplio <n>*"]
      }),
      mentions: [...mentions]
    });
  }
};

// ───────────── .reputacion ─────────────

const cmdReputacion = {
  names: [".reputacion", ".reputación", ".karma"],
  usage: ".reputacion [@usuario]",
  desc: "Ver el karma y el nivel de confianza de alguien",
  category: CAT,
  handler: async ({ sender, msg, reply }) => {
    if (!(await listo(reply))) return;
    const objetivo = jidObjetivo(msg) || sender;
    const e = estadisticasDe(objetivo);
    const n = e.nivel;

    const lineas = [
      `⭐ *KARMA::* ${e.karma}/100`,
      `\`${barra(e.karma)}\``,
      `${n.emoji} *NIVEL::* ${n.nombre}`,
      `✅ *CUMPLIDOS::* ${e.cumplidos}   ❌ *NO CUMPLIDOS::* ${e.incumplidos}`,
      `🎁 *EFECTOS::* ${n.extra}`,
      `🪙 *DAILY::* x${n.daily}`
    ];
    if (n.apodo) lineas.splice(3, 0, `🏷️ *APODO::* ${n.apodo}`);

    await reply({
      text: tarjeta({
        emoji: "⭐",
        titulo: "REPUTACIÓN",
        subtitulo: tag(objetivo),
        lineas,
        tip: "Cumple tus tratos para subir. Todos empiezan en 100."
      }),
      mentions: [objetivo]
    });
  }
};

// ───────────── .perdon y .perdonar ─────────────

const cmdPerdon = {
  names: [".perdon", ".perdón"],
  usage: ".perdon @usuario",
  desc: "Pedirle perdón a alguien a quien le incumpliste un trato (si te perdona, +15 de karma)",
  category: CAT,
  handler: async ({ sender, msg, reply }) => {
    if (!(await listo(reply))) return;
    const ofendido = jidObjetivo(msg);
    if (!ofendido) return reply({ text: "⚠️ Uso correcto: *.perdon @usuario*\nSolo funciona con alguien a quien le incumpliste un trato." });
    if (mismaPersona(ofendido, sender)) return reply({ text: "⚠️ No puedes pedirte perdón a ti mismo." });

    const pendientes = tratosDe(sender, (t) => esCreador(t, sender) && esDestino(t, ofendido) && t.estado === "incumplido" && !t.perdonado);
    if (!pendientes.length) {
      return reply({ text: `⚠️ No tienes tratos incumplidos con ${tag(ofendido)} que puedan perdonarse.`, mentions: [ofendido] });
    }

    const trato = pendientes[0];
    trato.perdonSolicitadoEn = Date.now();
    guardarTrato(trato);

    await reply({
      text: tarjeta({
        emoji: "🕊️",
        titulo: "PIDE PERDÓN",
        subtitulo: `${tag(sender)} ➜ ${tag(ofendido)}`,
        lineas: [`📝 *TRATO #${trato.n}::* ${trato.texto}`],
        tip: [`${tag(ofendido)}, si lo perdonas escribe *.perdonar*.`, `Si lo perdonas, ${tag(sender)} recupera +${PUNTOS.perdon} de karma.`]
      }),
      mentions: [sender, ofendido]
    });
  }
};

const cmdPerdonar = {
  names: [".perdonar"],
  usage: ".perdonar [@usuario]",
  desc: "Perdonar a quien te pidió perdón con .perdon (le devuelves +15 de karma)",
  category: CAT,
  handler: async ({ sender, msg, reply }) => {
    if (!(await listo(reply))) return;
    const quien = jidObjetivo(msg);
    const solicitudes = tratosDe(sender, (t) => esDestino(t, sender) && t.estado === "incumplido" && !t.perdonado && t.perdonSolicitadoEn && (!quien || esCreador(t, quien)));
    if (!solicitudes.length) {
      return reply({ text: "⚠️ Nadie te está pidiendo perdón ahora mismo. Quien quiera tu perdón debe usar *.perdon @tú*." });
    }

    solicitudes.sort((a, b) => b.perdonSolicitadoEn - a.perdonSolicitadoEn);
    const trato = solicitudes[0];
    trato.perdonado = true;
    guardarTrato(trato);

    const r = cambiarKarma(trato.creadorJid, PUNTOS.perdon);
    const lineas = [`📝 *TRATO #${trato.n}::* ${trato.texto}`, ...lineaKarma(r, trato.creadorJid)];
    if (solicitudes.length > 1) lineas.push(`🕊️ *PERDONES PENDIENTES::* ${solicitudes.length - 1}`);

    await reply({
      text: tarjeta({
        emoji: "🕊️",
        titulo: "PERDONADO",
        subtitulo: `${tag(sender)} perdonó a ${tag(trato.creadorJid)}`,
        lineas,
        tip: `Un trato solo se puede perdonar una vez.`
      }),
      mentions: [sender, trato.creadorJid]
    });
  }
};

// ───────────── .buenaaccion ─────────────

const cmdBuenaAccion = {
  names: [".buenaaccion", ".buenaacción"],
  usage: ".buenaaccion",
  desc: "Gana +5 de karma una vez al día",
  category: CAT,
  handler: async ({ sender, reply }) => {
    if (!(await listo(reply))) return;
    const r = buenaAccion(sender);
    if (r.espera) return reply({ text: `⏳ Ya hiciste tu buena acción de hoy. Vuelve en *${formatTime(r.espera)}*.` });
    if (r.maximo) return reply({ text: "👑 Ya tienes el karma al máximo (100), no hace falta." });

    await reply({
      text: tarjeta({
        emoji: "🌟",
        titulo: "BUENA ACCIÓN",
        lineas: lineaKarma(r.resultado, sender),
        tip: "Puedes hacer una buena acción cada 24 horas."
      }),
      mentions: [sender]
    });
  }
};

// ───────────── .reportar ─────────────

const TIPOS_REPORTE = {
  mentira: { puntos: PUNTOS.mentira, texto: "mentir" },
  estafa: { puntos: PUNTOS.estafa, texto: "intentar estafar" }
};

const cmdReportar = {
  names: [".reportar"],
  usage: ".reportar <número> mentira|estafa",
  desc: "Reportar a la otra persona de un trato por mentir (-15) o intentar estafar (-30)",
  category: CAT,
  handler: async ({ sender, cleanText, reply }) => {
    if (!(await listo(reply))) return;
    const [numTxt, tipoTxt = ""] = partes(cleanText);
    const trato = cargarTrato(parseInt((numTxt || "").replace(/\D/g, ""), 10) || null, reply);
    if (!trato) return;
    const tipo = TIPOS_REPORTE[tipoTxt.toLowerCase()];
    if (!tipo) return reply({ text: "⚠️ Uso correcto: *.reportar <número> mentira* o *.reportar <número> estafa*" });
    if (!esParte(trato, sender)) return reply({ text: `⚠️ Solo quienes participan en el trato *#${trato.n}* pueden reportar.` });
    if (trato.estado === "pendiente") return reply({ text: `⚠️ El trato *#${trato.n}* todavía no fue aceptado, no se puede reportar.` });
    if (trato.reportes.some((x) => mismaPersona(x.por, sender))) return reply({ text: `⚠️ Ya reportaste en el trato *#${trato.n}*.` });

    const acusadoJid = otroDe(trato, sender);
    trato.reportes.push({ por: sender, tipo: tipoTxt.toLowerCase(), en: Date.now() });
    guardarTrato(trato);

    const r = cambiarKarma(acusadoJid, tipo.puntos);
    const lineas = [`📝 *TRATO #${trato.n}::* ${trato.texto}`, `🚨 *MOTIVO::* ${tipo.texto}`, ...lineaKarma(r, acusadoJid)];
    if (r.nivelAhora.apodo) lineas.push(`🏷️ *APODO::* ${r.nivelAhora.apodo}`);

    await reply({
      text: tarjeta({
        emoji: "🚨",
        titulo: "REPORTE REGISTRADO",
        subtitulo: `${tag(sender)} reportó a ${tag(acusadoJid)}`,
        lineas,
        tip: "Cada persona puede reportar una sola vez por trato."
      }),
      mentions: [sender, acusadoJid]
    });
  }
};

export default [cmdTrato, cmdAceptar, cmdCumplido, cmdNoCumplio, cmdMisTratos, cmdReputacion, cmdPerdon, cmdPerdonar, cmdBuenaAccion, cmdReportar];

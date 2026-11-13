import { formatTime } from "../../../motores/ui.js";
import { T } from "../../../motores/gacha-tema.js";
import { fmt } from "../../economia/formato-evento.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo-evento.js";
import {
  misionesDiarias, cadenasDe, cobrarTodo, lineasDeEntrega, premioEnTexto, bonoTexto
} from "../../economia/logros.js";

function barra(avance, meta) {
  const llenos = Math.max(0, Math.min(10, Math.floor((avance / meta) * 10)));
  return "▰".repeat(llenos) + "▱".repeat(10 - llenos);
}

function vistaDiarias(sender) {
  const { lista, restante, bono, todasCobradas } = misionesDiarias(sender);
  const lineas = [];
  lista.forEach((m, i) => {
    const estado = m.cobrada ? "✅ Cobrada" : m.completa ? "🎁 Lista, cóbrala" : `${barra(m.avance, m.meta)} ${fmt(m.avance)}/${fmt(m.meta)}`;
    lineas.push(`${i + 1}. *${m.texto}*`);
    lineas.push(`> ${estado}`);
    if (!m.cobrada && !m.completa && m.como) lineas.push(`> 👉 Hazlo con: ${m.como}`);
    lineas.push(`> ${T("🎁", "🍬")} ${premioEnTexto({ dinero: m.dinero, xp: m.xp })}`, "");
  });
  const listas = lista.filter((m) => m.completa && !m.cobrada).length;
  const estadoBono = bono ? "✅ Cobrado" : todasCobradas ? "🎁 Disponible al cobrar" : "🔒 Completa las 3 misiones";
  lineas.push(`🎟️ *Bono por completar las 3* ›› ${estadoBono}`, `> ${T("🎁", "🍬")} ${bonoTexto()}`);
  return tarjetaMarcada({
    emoji: "📋",
    titulo: T("MISIONES DE HOY", "MISIONES DE LA NOCHE"),
    relato: `Tienes 3 misiones y se renuevan en *${formatTime(restante)}*. Se cumplen solas al usar los comandos indicados.`,
    lineas,
    tip: [
      listas ? `Tienes ${listas} ${listas === 1 ? "misión lista" : "misiones listas"}: reclámalas con *.tareas cobrar*.` : "Cuando termines una, reclama el premio con *.tareas cobrar*.",
      "Metas permanentes con premios grandes: *.tareas fijas*."
    ]
  });
}

function vistaFijas(sender) {
  const lineas = [];
  for (const c of cadenasDe(sender)) {
    if (c.completa) {
      lineas.push(`${c.emoji} *${c.nombre}* ›› ✅ Completada`, "");
      continue;
    }
    const estado = c.lista ? "🎁 Lista, cóbrala" : `${barra(c.progreso, c.tramo.meta)} ${fmt(Math.min(c.progreso, c.tramo.meta))}/${fmt(c.tramo.meta)}`;
    lineas.push(`${c.emoji} *${c.nombre}* ›› Nivel ${c.cobrados + 1}/${c.total}`);
    lineas.push(`> ${c.texto(c.tramo.meta)}`);
    lineas.push(`> ${estado}`);
    if (!c.lista && c.como) lineas.push(`> 👉 Hazlo con: ${c.como}`);
    lineas.push(`> ${T("🎁", "🍬")} ${premioEnTexto(c.tramo)}`, "");
  }
  return tarjetaMarcada({
    emoji: "🧭",
    titulo: T("METAS PERMANENTES", "MISIONES ETERNAS"),
    relato: "Son metas a largo plazo: tu avance se acumula siempre y cada nivel da un premio más grande.",
    lineas: lineas.slice(0, -1),
    tip: "Reclama lo completado con *.tareas cobrar*."
  });
}

function vistaCobro(sender) {
  const r = cobrarTodo(sender);
  if (!r.diarias.length && !r.fijas.length && !r.bono) {
    const extra = r.esperandoGacha || r.bonoPendiente
      ? " Hay premios con tickets pendientes: el gacha aún está cargando, intenta de nuevo en un momento."
      : "";
    return { text: `❌ No tienes misiones completadas por cobrar. Revisa tu avance con *.tareas*.${extra}` };
  }
  const lineas = [];
  if (r.diarias.length) lineas.push(`📋 *Misiones diarias* ›› ${r.diarias.length}`);
  if (r.fijas.length) lineas.push(`🧭 *Misiones fijas* ›› ${r.fijas.join(", ")}`);
  if (r.bono) lineas.push(`🎟️ *Bono por completar las tres misiones* ›› incluido`);
  lineas.push("", ...lineasDeEntrega(r.total));
  const tip = [];
  if (r.bonoPendiente || r.esperandoGacha) tip.push("Algunos premios con tickets quedaron pendientes porque el gacha está cargando. Vuelve a usar *.tareas cobrar*.");
  else tip.push("Tus insignias de monedas están en *.hitos*.");
  return {
    text: tarjetaMarcada({
      emoji: "🎁",
      titulo: T("RECOMPENSA COBRADA", "BOTÍN COBRADO"),
      relato: `${mencion(sender)} cobró sus misiones de economía.`,
      lineas,
      tip
    }),
    mentions: [sender]
  };
}

export default {
  names: [".tareas"],
  desc: "Misiones del día con recompensa: .tareas | .tareas fijas | .tareas cobrar",
  category: "Economía",
  usage: ".tareas [fijas|cobrar]",
  handler: async ({ sender, cleanText, reply }) => {
    const opcion = (cleanText.trim().split(/\s+/)[1] || "").toLowerCase();
    if (/^(cobrar|cobra|reclamar|claim)$/.test(opcion)) return reply(vistaCobro(sender));
    if (/^(fijas|fijo|permanentes|eternas)$/.test(opcion)) return reply({ text: vistaFijas(sender) });
    return reply({ text: vistaDiarias(sender) });
  }
};

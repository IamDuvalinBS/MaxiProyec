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
    const estado = m.cobrada ? "✅ Cobrada" : m.completa ? "🎁 Lista para cobrar" : "⏳ En curso";
    lineas.push(`${i + 1}. *${m.texto}*`);
    lineas.push(`> ${estado} ›› ${fmt(m.avance)}/${fmt(m.meta)}`);
    lineas.push(`> ${T("🎁 Recompensa", "🍬 Botín")}: ${premioEnTexto({ dinero: m.dinero, xp: m.xp })}`);
  });
  const listas = lista.filter((m) => m.completa && !m.cobrada).length;
  const estadoBono = bono ? "✅ Cobrado" : todasCobradas ? "🎁 Disponible al cobrar" : "🔒 Completa las tres misiones";
  return tarjetaMarcada({
    emoji: "📋",
    titulo: T("MISIONES DE ECONOMÍA", "MISIONES DE LA NOCHE"),
    relato: `Tienes tres misiones nuevas cada 24 horas. Se renuevan en *${formatTime(restante)}*. El avance se cuenta solo al usar los comandos de economía.`,
    lineas: [...lineas, "", `🎟️ *Bono diario* ›› ${estadoBono}`, `> ${T("🎁 Recompensa", "🍬 Botín")}: ${bonoTexto()}`],
    tip: [
      listas ? `Tienes ${listas} ${listas === 1 ? "misión lista" : "misiones listas"}. Cóbralas con *.misioneseco cobrar*.` : "Usa *.misioneseco fijas* para ver las misiones permanentes.",
    ]
  });
}

function vistaFijas(sender) {
  const lineas = [];
  for (const c of cadenasDe(sender)) {
    if (c.completa) {
      lineas.push(`${c.emoji} *${c.nombre}* ›› ✅ Completada (${c.total}/${c.total})`, "");
      continue;
    }
    const estado = c.lista ? "🎁 Lista para cobrar" : "⏳ En curso";
    lineas.push(`${c.emoji} *${c.nombre}* ›› Tramo ${c.cobrados + 1}/${c.total}`);
    lineas.push(`> ${c.texto(c.tramo.meta)}`);
    lineas.push(`> ${estado} ›› ${barra(c.progreso, c.tramo.meta)} ${fmt(Math.min(c.progreso, c.tramo.meta))}/${fmt(c.tramo.meta)}`);
    lineas.push(`> ${T("🎁 Recompensa", "🍬 Botín")}: ${premioEnTexto(c.tramo)}`, "");
  }
  return tarjetaMarcada({
    emoji: "🧭",
    titulo: T("MISIONES FIJAS", "MISIONES ETERNAS"),
    relato: "Son misiones permanentes que se cumplen una sola vez por tramo. Su avance se acumula con todo lo que hagas en economía.",
    lineas: lineas.slice(0, -1),
    tip: "Cobra todo lo completado con *.misioneseco cobrar*."
  });
}

function vistaCobro(sender) {
  const r = cobrarTodo(sender);
  if (!r.diarias.length && !r.fijas.length && !r.bono) {
    const extra = r.esperandoGacha || r.bonoPendiente
      ? " Hay premios con tickets pendientes: el gacha aún está cargando, intenta de nuevo en un momento."
      : "";
    return { text: `❌ No tienes misiones completadas por cobrar. Revisa tu avance con *.misioneseco*.${extra}` };
  }
  const lineas = [];
  if (r.diarias.length) lineas.push(`📋 *Misiones diarias* ›› ${r.diarias.length}`);
  if (r.fijas.length) lineas.push(`🧭 *Misiones fijas* ›› ${r.fijas.join(", ")}`);
  if (r.bono) lineas.push(`🎟️ *Bono por completar las tres misiones* ›› incluido`);
  lineas.push("", ...lineasDeEntrega(r.total));
  const tip = [];
  if (r.bonoPendiente || r.esperandoGacha) tip.push("Algunos premios con tickets quedaron pendientes porque el gacha está cargando. Vuelve a usar *.misioneseco cobrar*.");
  else tip.push("Usa *.hitos* para ver tus insignias de monedas.");
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
  names: [".misioneseco", ".misioneseconomia", ".mecon", ".tareas"],
  desc: "Misiones diarias y fijas de economía con recompensas: .misioneseco [fijas|cobrar]",
  category: "Economía",
  usage: ".misioneseco [fijas|cobrar]",
  handler: async ({ sender, cleanText, reply }) => {
    const opcion = (cleanText.trim().split(/\s+/)[1] || "").toLowerCase();
    if (/^(cobrar|reclamar|claim)$/.test(opcion)) return reply(vistaCobro(sender));
    if (/^(fijas|fijo|permanentes|eternas)$/.test(opcion)) return reply({ text: vistaFijas(sender) });
    return reply({ text: vistaDiarias(sender) });
  }
};

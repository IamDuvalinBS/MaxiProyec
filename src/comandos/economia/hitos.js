import { T } from "../../../motores/gacha-tema.js";
import { fmt, monto, jidObjetivo } from "../../economia/formato-evento.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo-evento.js";
import { hitosDe, patrimonio, premioEnTexto, fechaCorta, revisarHitos } from "../../economia/logros.js";

function barra(actual, meta) {
  const llenos = Math.max(0, Math.min(10, Math.floor((actual / meta) * 10)));
  return "▰".repeat(llenos) + "▱".repeat(10 - llenos);
}

export default {
  names: [".hitos", ".elogros", ".metas"],
  desc: "Insignias por llegar a ciertas cantidades de dinero: .hitos [@usuario]",
  category: "Economía",
  usage: ".hitos [@usuario]",
  handler: async ({ sender, msg, reply }) => {
    const objetivo = jidObjetivo(msg) || sender;
    const propio = objetivo === sender;
    if (propio) revisarHitos(sender);

    const actual = patrimonio(objetivo);
    const lista = hitosDe(objetivo);
    const logrados = lista.filter((h) => h.logrado).length;
    const siguiente = lista.find((h) => !h.logrado);

    const lineas = lista.map((h) => (
      h.logrado
        ? `✅ ${h.emoji} *${h.nombre}* ›› ${fmt(h.meta)} · ${fechaCorta(h.logrado)}`
        : `🔒 ${h.emoji} ${h.nombre} ›› ${fmt(h.meta)}`
    ));

    if (siguiente) {
      lineas.push(
        "",
        `🎯 *Próxima meta* ›› ${siguiente.emoji} ${siguiente.nombre}`,
        `> ${barra(actual, siguiente.meta)} ${fmt(actual)}/${fmt(siguiente.meta)}`,
        `> ${T("🎁 Recompensa", "🍬 Botín")}: ${premioEnTexto(siguiente)}`
      );
    } else {
      lineas.push("", "🌌 *Completaste todas las insignias de monedas.*");
    }

    return reply({
      text: tarjetaMarcada({
        emoji: "🏅",
        titulo: T("INSIGNIAS DE MONEDAS", "INSIGNIAS DE LA NOCHE"),
        relato: `Patrimonio de ${mencion(objetivo)} (mano + banco): *${monto(actual)}*. Insignias: *${logrados}/${lista.length}*. Cada meta entrega una recompensa una sola vez.`,
        lineas,
        tip: "Usa *.tareas* para ver tus misiones de economía."
      }),
      mentions: [objetivo]
    });
  }
};

import { monto, jidObjetivo } from "../../economia/formato-evento.js";
import { tarjetaMarcada, tiempoLargo } from "../../economia/estilo-evento.js";
import { estilo } from "../../economia/temas.js";
import { CATALOGO, maximoDe, pagoSemanalDe, pendienteDe, estaVencido, negociosDe } from "../../economia/negocios.js";

const ESTILOS = {
  normal: {
    emoji: "🏪",
    titulo: "MIS NEGOCIOS",
    sinNegocios: "🏪 Aún no posees ningún negocio. Usa *.negocios* para ver la tienda.",
    acumulado: (a, max) => `> Acumulado: *${a}* de *${max}*`,
    vencido: (pago) => `> ⚠️ Mantenimiento vencido (*${pago}*). La producción está detenida.`,
    mantenimiento: (pago, t) => `> Mantenimiento: *${pago}* en *${t}*`,
    tip: ["Usa *.ngreclamar* para cobrar tus ganancias.", "Usa *.ngpagar* para pagar el mantenimiento semanal."]
  },
  halloween: {
    emoji: "🏚️",
    titulo: "MIS NEGOCIOS MACABROS",
    sinNegocios: "🏚️ Aún no posees ningún negocio embrujado. Usa *.negocios* para ver la tienda. 🕸️",
    acumulado: (a, max) => `> Acumulado: *${a}* de *${max}* 🎃`,
    vencido: (pago) => `> ⚠️ 💀 Conjuro de mantenimiento vencido (*${pago}*). Las catrinas detuvieron la producción.`,
    mantenimiento: (pago, t) => `> Conjuro de mantenimiento: *${pago}* en *${t}* 🕯️`,
    tip: ["Usa *.ngreclamar* para cobrar tus ganancias malditas. 🕯️", "Usa *.ngpagar* para renovar el conjuro de mantenimiento semanal. 🔮"]
  }
};

export default {
  names: [".minegocios", ".misnegocios", ".ngmis"],
  usage: ".minegocios [@usuario]",
  desc: "Ver el estado de tus negocios o los de otra persona",
  category: "Economía",
  handler: async ({ sender, msg, reply }) => {
    const E = estilo(ESTILOS);
    const objetivo = jidObjetivo(msg) || sender;
    const propio = objetivo === sender;
    const poseidos = negociosDe(objetivo);
    const ahora = Date.now();
    const lineas = [];

    for (const def of CATALOGO) {
      const negocio = poseidos[def.clave];
      if (!negocio) continue;
      const vencido = estaVencido(negocio, ahora);
      lineas.push(`${def.emoji} *${def.nombre}*`);
      lineas.push(E.acumulado(monto(pendienteDe(negocio, def, ahora)), monto(maximoDe(def))));
      lineas.push(
        vencido
          ? E.vencido(monto(pagoSemanalDe(def)))
          : E.mantenimiento(monto(pagoSemanalDe(def)), tiempoLargo(negocio.vence - ahora))
      );
      lineas.push("");
    }

    if (!lineas.length) {
      return reply(propio ? { text: E.sinNegocios } : { text: `🏪 @${objetivo.split("@")[0]} no posee ningún negocio.`, mentions: [objetivo] });
    }

    await reply({
      text: tarjetaMarcada({
        emoji: E.emoji,
        titulo: propio ? E.titulo : `${E.titulo.replace(/^MIS /, "")} DE @${objetivo.split("@")[0]}`,
        lineas,
        tip: propio ? E.tip : undefined
      }),
      ...(propio ? {} : { mentions: [objetivo] })
    });
  }
};

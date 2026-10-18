import { monto } from "../../economia/formato-evento.js";
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
    vencido: (pago) => `> ⚠️ 💀 Conjuro de mantenimiento vencido (*${pago}*). Los fantasmas detuvieron la producción.`,
    mantenimiento: (pago, t) => `> Conjuro de mantenimiento: *${pago}* en *${t}* 🕯️`,
    tip: ["Usa *.ngreclamar* para cobrar tus ganancias malditas. 🎃", "Usa *.ngpagar* para renovar el conjuro de mantenimiento semanal. 🔮"]
  }
};

export default {
  names: [".minegocios", ".misnegocios", ".ngmis"],
  usage: ".minegocios",
  desc: "Ver el estado de tus negocios",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
    const poseidos = negociosDe(sender);
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
      return reply({ text: E.sinNegocios });
    }

    await reply({
      text: tarjetaMarcada({
        emoji: E.emoji,
        titulo: E.titulo,
        lineas,
        tip: E.tip
      })
    });
  }
};

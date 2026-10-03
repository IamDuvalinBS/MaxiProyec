import { monto } from "../../economia/formato.js";
import { tarjetaMarcada, tiempoLargo } from "../../economia/estilo.js";
import { CATALOGO, maximoDe, pagoSemanalDe, pendienteDe, estaVencido, negociosDe } from "../../economia/negocios.js";

export default {
  names: [".minegocios", ".misnegocios", ".ngmis"],
  usage: ".minegocios",
  desc: "Ver el estado de tus negocios",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const poseidos = negociosDe(sender);
    const ahora = Date.now();
    const lineas = [];

    for (const def of CATALOGO) {
      const negocio = poseidos[def.clave];
      if (!negocio) continue;
      const vencido = estaVencido(negocio, ahora);
      lineas.push(`${def.emoji} *${def.nombre}*`);
      lineas.push(`> Acumulado: *${monto(pendienteDe(negocio, def, ahora))}* de *${monto(maximoDe(def))}*`);
      lineas.push(
        vencido
          ? `> ⚠️ Mantenimiento vencido (*${monto(pagoSemanalDe(def))}*). La producción está detenida.`
          : `> Mantenimiento: *${monto(pagoSemanalDe(def))}* en *${tiempoLargo(negocio.vence - ahora)}*`
      );
      lineas.push("");
    }

    if (!lineas.length) {
      return reply({ text: "🏪 Aún no posees ningún negocio. Usa *.negocios* para ver la tienda." });
    }

    await reply({
      text: tarjetaMarcada({
        emoji: "🏪",
        titulo: "MIS NEGOCIOS",
        lineas,
        tip: ["Usa *.ngreclamar* para cobrar tus ganancias.", "Usa *.ngpagar* para pagar el mantenimiento semanal."]
      })
    });
  }
};

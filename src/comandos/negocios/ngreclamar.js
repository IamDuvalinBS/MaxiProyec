import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato-evento.js";
import { tarjetaMarcada } from "../../economia/estilo-evento.js";
import { estilo } from "../../economia/temas.js";
import { reclamarNegocios, negociosDe } from "../../economia/negocios.js";

const ESTILOS = {
  normal: {
    sinNegocios: "🏪 Aún no posees ningún negocio. Usa *.negocios* para ver la tienda.",
    nada: (aviso) => `⏳ Tus negocios todavía no han acumulado dinero.${aviso ? " Algunos negocios tienen el mantenimiento vencido; usa *.ngpagar* para reactivarlos." : ""}`,
    total: (n) => `🪙 *TOTAL*:: +${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA*:: ${monto(n)}`,
    tipBase: "Usa *.dep* para guardar tu dinero.",
    tipVencido: "Tienes negocios con el mantenimiento vencido. Usa *.ngpagar*.",
    emoji: "💰",
    titulo: "GANANCIAS RECLAMADAS!",
    relato: "Cobraste el dinero acumulado de tus negocios."
  },
  halloween: {
    sinNegocios: "🏚️ Aún no posees ningún negocio embrujado. Usa *.negocios* para ver la tienda. 🕸️",
    nada: (aviso) => `⏳ 🕯️ Tus negocios todavía no han acumulado calabazas.${aviso ? " Algunos tienen el conjuro vencido; usa *.ngpagar* para reactivarlos. 🔮" : ""}`,
    total: (n) => `🎃 *TOTAL*:: +${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO*:: ${monto(n)}`,
    tipBase: "Usa *.dep* para esconder tus calabazas en la cripta. ⚰️",
    tipVencido: "Tienes negocios con el conjuro de mantenimiento vencido. Usa *.ngpagar*. 💀",
    emoji: "🎃",
    titulo: "BOTÍN MALDITO RECLAMADO!",
    relato: "Cobraste las calabazas acumuladas de tus negocios embrujados. 🦇"
  }
};

export default {
  names: [".ngreclamar", ".ngcobrar", ".ngclaim", ".reclamarnegocios", ".cobrarnegocios"],
  usage: ".ngreclamar",
  desc: "Cobrar el dinero acumulado de tus negocios",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
    if (!Object.keys(negociosDe(sender)).length) {
      return reply({ text: E.sinNegocios });
    }

    const { total, detalle, vencidos } = reclamarNegocios(sender);

    if (total <= 0) {
      return reply({ text: E.nada(vencidos.length > 0) });
    }

    const lineas = detalle.map(({ def, monto: ganado }) => `${def.emoji} *${def.nombre}* ›› +${monto(ganado)}`);
    lineas.push("", E.total(total), E.cartera(getAccount(sender).wallet));

    const tip = [E.tipBase];
    if (vencidos.length) tip.push(E.tipVencido);

    await reply({
      text: tarjetaMarcada({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas,
        tip
      })
    });
  }
};

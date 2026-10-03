import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato.js";
import { tarjetaMarcada } from "../../economia/estilo.js";
import { reclamarNegocios, negociosDe } from "../../economia/negocios.js";

export default {
  names: [".ngreclamar", ".ngcobrar", ".ngclaim", ".reclamarnegocios", ".cobrarnegocios"],
  usage: ".ngreclamar",
  desc: "Cobrar el dinero acumulado de tus negocios",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    if (!Object.keys(negociosDe(sender)).length) {
      return reply({ text: "🏪 Aún no posees ningún negocio. Usa *.negocios* para ver la tienda." });
    }

    const { total, detalle, vencidos } = reclamarNegocios(sender);

    if (total <= 0) {
      const aviso = vencidos.length
        ? " Algunos negocios tienen el mantenimiento vencido; usa *.ngpagar* para reactivarlos."
        : "";
      return reply({ text: `⏳ Tus negocios todavía no han acumulado dinero.${aviso}` });
    }

    const lineas = detalle.map(({ def, monto: ganado }) => `${def.emoji} *${def.nombre}* ›› +${monto(ganado)}`);
    lineas.push("", `🪙 *TOTAL*:: +${monto(total)}`, `⛁ *CARTERA*:: ${monto(getAccount(sender).wallet)}`);

    const tip = ["Usa *.dep* para guardar tu dinero."];
    if (vencidos.length) tip.push("Tienes negocios con el mantenimiento vencido. Usa *.ngpagar*.");

    await reply({
      text: tarjetaMarcada({
        emoji: "💰",
        titulo: "GANANCIAS RECLAMADAS!",
        relato: "Cobraste el dinero acumulado de tus negocios.",
        lineas,
        tip
      })
    });
  }
};

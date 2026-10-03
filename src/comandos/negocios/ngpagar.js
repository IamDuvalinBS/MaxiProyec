import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato.js";
import { tarjetaMarcada } from "../../economia/estilo.js";
import { pagarMantenimiento, negociosDe } from "../../economia/negocios.js";

export default {
  names: [".ngpagar", ".pagarnegocios", ".ngmantenimiento"],
  usage: ".ngpagar",
  desc: "Pagar el mantenimiento semanal de tus negocios",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    if (!Object.keys(negociosDe(sender)).length) {
      return reply({ text: "🏪 Aún no posees ningún negocio. Usa *.negocios* para ver la tienda." });
    }

    const resultado = pagarMantenimiento(sender);

    if (!resultado.exito && resultado.motivo === "sin_pagos") {
      return reply({ text: "✅ Ninguno de tus negocios requiere mantenimiento por ahora. El pago se habilita 3 días antes del vencimiento." });
    }

    if (!resultado.exito) {
      return reply({
        text: `⚠️ Fondos insuficientes. El mantenimiento total es de *${monto(resultado.total)}* y tienes *${monto(getAccount(sender).wallet)}* en mano. Usa *.retirar* para sacar dinero del banco.`
      });
    }

    const lineas = resultado.pagados.map((def) => `${def.emoji} *${def.nombre}*`);
    lineas.push("", `💸 *PAGADO*:: -${monto(resultado.total)}`, `⛁ *CARTERA*:: ${monto(getAccount(sender).wallet)}`);

    await reply({
      text: tarjetaMarcada({
        emoji: "🧾",
        titulo: "MANTENIMIENTO PAGADO!",
        relato: "Se pagó el mantenimiento semanal. Tus negocios continúan operando durante *7 días* más.",
        lineas,
        tip: "Usa *.minegocios* para consultar el estado de tus negocios."
      })
    });
  }
};

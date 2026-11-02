import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato-evento.js";
import { tarjetaMarcada } from "../../economia/estilo-evento.js";
import { estilo } from "../../economia/temas.js";
import { pagarMantenimiento, negociosDe } from "../../economia/negocios.js";

const ESTILOS = {
  normal: {
    sinNegocios: "🏪 Aún no posees ningún negocio. Usa *.negocios* para ver la tienda.",
    sinPagos: "✅ Ninguno de tus negocios requiere mantenimiento por ahora. El pago se habilita 3 días antes del vencimiento.",
    sinFondos: (total, cartera) => `⚠️ Fondos insuficientes. El mantenimiento total es de *${monto(total)}* y tienes *${monto(cartera)}* en mano. Usa *.retirar* para sacar dinero del banco.`,
    emoji: "🧾",
    titulo: "MANTENIMIENTO PAGADO!",
    relato: "Se pagó el mantenimiento semanal. Tus negocios continúan operando durante *7 días* más.",
    pagado: (n) => `💸 *PAGADO*:: -${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA*:: ${monto(n)}`,
    tip: "Usa *.minegocios* para consultar el estado de tus negocios."
  },
  halloween: {
    sinNegocios: "🏚️ Aún no tienes ningún negocio en el pueblo de los difuntos. Usa *.negocios* para visitar el mercado. 🏵️",
    sinPagos: "✅ 🕯️ Tus negocios siguen protegidos por las ofrendas. Ninguno necesita renovar su protección por ahora. El pago se habilita 3 días antes del vencimiento.",
    sinFondos: (total, cartera) => `⚠️ 💀 La ofrenda para mantener tus negocios cuesta *${monto(total)}* y solo tienes *${monto(cartera)}* en tu altar. Usa *.retirar* para recuperar monedas de tu cripta.`,
    emoji: "🏵️",
    titulo: "¡OFRENDA RENOVADA!",
    relato: "Renovaste la ofrenda de protección de tus negocios. Los espíritus cuidarán tus establecimientos durante *7 noches* más. 🕯️",
    pagado: (n) => `🏵️ *OFRENDA ENTREGADA::* -${monto(n)}`,
    cartera: (n) => `🪙 *MONEDAS DEL ALTAR::* ${monto(n)}`,
    tip: "Usa *.minegocios* para consultar el estado de tus negocios y comprobar que los espíritus sigan cuidándolos. 💀"
  }
};

export default {
  names: [".ngpagar", ".pagarnegocios", ".ngmantenimiento"],
  usage: ".ngpagar",
  desc: "Pagar el mantenimiento semanal de tus negocios",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
    if (!Object.keys(negociosDe(sender)).length) {
      return reply({ text: E.sinNegocios });
    }

    const resultado = pagarMantenimiento(sender);

    if (!resultado.exito && resultado.motivo === "sin_pagos") {
      return reply({ text: E.sinPagos });
    }

    if (!resultado.exito) {
      return reply({
        text: E.sinFondos(resultado.total, getAccount(sender).wallet)
      });
    }

    const lineas = resultado.pagados.map((def) => `${def.emoji} *${def.nombre}*`);
    lineas.push("", E.pagado(resultado.total), E.cartera(getAccount(sender).wallet));

    await reply({
      text: tarjetaMarcada({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas,
        tip: E.tip
      })
    });
  }
};

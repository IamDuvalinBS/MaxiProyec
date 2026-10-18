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
    sinNegocios: "🏚️ Aún no posees ningún negocio embrujado. Usa *.negocios* para ver la tienda. 🕸️",
    sinPagos: "✅ 🕯️ Ninguno de tus negocios necesita renovar su conjuro por ahora. El pago se habilita 3 días antes del vencimiento.",
    sinFondos: (total, cartera) => `⚠️ 💀 El conjuro total cuesta *${monto(total)}* y solo tienes *${monto(cartera)}* en el caldero. Usa *.retirar* para desenterrar calabazas de la cripta.`,
    emoji: "🔮",
    titulo: "CONJURO RENOVADO!",
    relato: "Renovaste el conjuro de mantenimiento semanal. Tus negocios siguen operando durante *7 noches* más. 🌙",
    pagado: (n) => `💀 *PAGADO*:: -${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO*:: ${monto(n)}`,
    tip: "Usa *.minegocios* para consultar el estado de tus negocios embrujados. 🦇"
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

import { gachaListo, monto } from "../../../motores/gacha-core.js";
import { getAccount } from "../../../motores/db.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { estilo } from "../../../src/economia/temas.js";

const ESTILOS = {
  normal: {
    titulo: "COMPRA REALIZADA",
    falta: (n) => `❌ Necesitas *${n}* en mano y no te alcanza. Usa *.retirar* para sacar dinero del banco.`,
    dinero: "⛁ *Dinero en mano*"
  },
  halloween: {
    titulo: "COMPRA MALDITA REALIZADA",
    falta: (n) => `❌ Necesitas *${n}* en el caldero y no te alcanza. Usa *.retirar* para desenterrar calabazas de la cripta.`,
    dinero: "🧙‍♀️ *Caldero*"
  }
};
import { PRECIO_CUBITO, comprarCubitos } from "../../../motores/gacha-niveles.js";

export default {
  names: [".comprarcubitos", ".cubitoscomprar"],
  desc: "Compra cubitos de fuerza: .comprarcubitos <cantidad>",
  category: "Gacha",
  usage: ".comprarcubitos <cantidad>",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const E = estilo(ESTILOS);
    const cantidad = parseInt(cleanText.split(/\s+/)[1] || "", 10);

    if (!cantidad || cantidad < 1) {
      return reply({ text: `❌ Indica cuántos cubitos quieres comprar. Ejemplo: *.comprarcubitos 10*. Cada cubito cuesta *${monto(PRECIO_CUBITO)}*.` });
    }

    const r = comprarCubitos(sender, cantidad);
    if (r.error) {
      return reply({ text: E.falta(monto(r.total)) });
    }

    return reply({
      text: [
        encabezado("⚡", E.titulo),
        "",
        `🟪 *Compraste* ›› ${cantidad} cubitos`,
        `> Pagaste ${monto(r.total)}.`,
        `🎒 *Ahora tienes* ›› ${r.tiene} cubitos`,
        `${E.dinero} ›› ${monto(getAccount(sender).wallet)}`,
        "",
        "> Úsalos con *.subirbrawler [ID] [cantidad|max]*."
      ].join("\n")
    });
  }
};

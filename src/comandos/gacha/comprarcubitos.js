import { gachaListo, monto } from "../../../motores/gacha-core.js";
import { getAccount } from "../../../motores/db.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { PRECIO_CUBITO, comprarCubitos } from "../../../motores/gacha-niveles.js";

export default {
  names: [".comprarcubitos", ".cubitoscomprar"],
  desc: "Compra cubitos de fuerza: .comprarcubitos <cantidad>",
  category: "Gacha",
  usage: ".comprarcubitos <cantidad>",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const cantidad = parseInt(cleanText.split(/\s+/)[1] || "", 10);

    if (!cantidad || cantidad < 1) {
      return reply({ text: `❌ Indica cuántos cubitos quieres comprar. Ejemplo: *.comprarcubitos 10*. Cada cubito cuesta *${monto(PRECIO_CUBITO)}*.` });
    }

    const r = comprarCubitos(sender, cantidad);
    if (r.error) {
      return reply({ text: `❌ Necesitas *${monto(r.total)}* en mano y no te alcanza. Usa *.retirar* para sacar dinero del banco.` });
    }

    return reply({
      text: [
        encabezado("⚡", "COMPRA REALIZADA"),
        "",
        `🟪 *Compraste* ›› ${cantidad} cubitos`,
        `> Pagaste ${monto(r.total)}.`,
        `🎒 *Ahora tienes* ›› ${r.tiene} cubitos`,
        `⛁ *Dinero en mano* ›› ${monto(getAccount(sender).wallet)}`,
        "",
        "> Úsalos con *.subirbrawler [ID] [cantidad|max]*."
      ].join("\n")
    });
  }
};

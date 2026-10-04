import { gachaListo, monto } from "../../../motores/gacha-core.js";
import { getAccount } from "../../../motores/db.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { PRECIO_CUBITO, cubitosDe, cubitosParaSubir, NIVEL_MAX } from "../../../motores/gacha-niveles.js";

export default {
  names: [".cubitos", ".cubitosdefuerza"],
  desc: "Muestra la tienda de cubitos de fuerza para subir de nivel a tus Brawlers",
  category: "Gacha",
  usage: ".cubitos",
  handler: async ({ sender, reply }) => {
    await gachaListo;
    const texto = [
      encabezado("⚡", "SHOP - CUBITOS DE FUERZA"),
      "",
      `🟪 *Cubito de fuerza* ›› *${monto(PRECIO_CUBITO)}*`,
      "> Se gastan para subir de nivel a tus brawlers. El costo depende del nivel.",
      "",
      "📈 *Cubitos necesarios por nivel*",
      `> · Del nivel 1 al 10: ${cubitosParaSubir(1)} por nivel.`,
      `> · Del nivel 10 al 20: ${cubitosParaSubir(10)} por nivel.`,
      `> · Del nivel 20 al ${NIVEL_MAX.brawler}: ${cubitosParaSubir(20)} por nivel.`,
      "",
      `⛁ *DINERO*:: ${monto(getAccount(sender).wallet)}`,
      `🎒 *Tus cubitos*:: ${cubitosDe(sender)}`,
      `✿ *Nivel Max.*:: ${NIVEL_MAX.brawler} Niveles`,
      "",
      "> Para comprar usa *.comprarcubitos <cantidad>*.",
      "> Para usarlos en un brawler usa *.subirbrawler [ID] [cantidad|max]*."
    ].join("\n");
    return reply({ text: texto });
  }
};

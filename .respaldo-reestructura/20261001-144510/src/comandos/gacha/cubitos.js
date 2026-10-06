import { gachaListo, tarjeta, monto } from "../../../motores/gacha-core.js";
import { getAccount } from "../../../motores/db.js";
import { PRECIO_CUBITO, comprarCubitos, cubitosDe, cubitosParaSubir, NIVEL_MAX } from "../../../motores/gacha-niveles.js";

export default {
  names: [".cubitos", ".cubitosdefuerza"],
  desc: "Cubitos de fuerza para subir de nivel a tus Brawlers (nivel fijo, máximo 30)",
  category: "Gacha",
  usage: ".cubitos [comprar] <cantidad>",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1);
    const cantidad = parseInt(partes.find((x) => /^\d+$/.test(x)) || "", 10);

    if (!cantidad) {
      return reply({
        text: tarjeta({
          emoji: "⚡", titulo: "CUBITOS DE FUERZA",
          lineas: [
            `🟪 *Precio* ›› ${monto(PRECIO_CUBITO)} por cubito`,
            `🎒 *Tenés* ›› ${cubitosDe(sender)} cubitos`,
            `💰 *Dinero en mano* ›› ${monto(getAccount(sender).wallet)}`,
            "",
            "📈 *Cubitos por nivel (fijo)*",
            `• Nv. 1 → 10 ›› ${cubitosParaSubir(1)} por nivel`,
            `• Nv. 10 → 20 ›› ${cubitosParaSubir(10)} por nivel`,
            `• Nv. 20 → ${NIVEL_MAX.brawler} ›› ${cubitosParaSubir(20)} por nivel`,
            "",
            "⚙️ *Comprar* ›› .cubitos comprar <cantidad>",
            "🚀 *Subir de nivel* ›› .subirbrawler [#id] [cantidad|max]"
          ]
        })
      });
    }

    const r = comprarCubitos(sender, cantidad);
    if (r.error) return reply({ text: `❌ Necesitás ${monto(r.total)} en mano y no te alcanza.` });
    return reply({
      text: tarjeta({
        emoji: "⚡", titulo: "COMPRA REALIZADA",
        lineas: [
          `🟪 *Compraste* ›› ${cantidad} cubitos por ${monto(r.total)}`,
          `🎒 *Ahora tenés* ›› ${r.tiene} cubitos`,
          `💰 *Te quedan* ›› ${monto(getAccount(sender).wallet)}`
        ]
      })
    });
  }
};

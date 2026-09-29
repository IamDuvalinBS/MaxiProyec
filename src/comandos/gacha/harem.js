import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".harem", ".miswaifus"],
  desc: "Muestra tu colección de waifus",
  category: "Gacha",
  usage: ".harem [página]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({ categoria: "waifu", titulo: "Tu harem", emoji: "🎴", sender, cleanText, reply });
  }
};

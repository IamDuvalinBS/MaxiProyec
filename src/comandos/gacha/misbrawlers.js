import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".misbrawlers"],
  desc: "Muestra tus Brawlers",
  category: "Gacha",
  usage: ".misbrawlers [página]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({ categoria: "brawler", titulo: "Tus Brawlers", emoji: "⭐", sender, cleanText, reply });
  }
};

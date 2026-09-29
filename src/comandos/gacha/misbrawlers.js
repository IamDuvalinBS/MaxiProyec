import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".misbrawlers"],
  desc: "Muestra tus Brawlers con su nivel",
  category: "Gacha",
  usage: ".misbrawlers [página]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({
      categoria: "brawler", titulo: "Tus Brawlers", sender, cleanText, reply,
      pista: "⚡ Subilos de nivel con *.cubitos* y *.subirbrawler* (usá #id para elegir cuál)."
    });
  }
};

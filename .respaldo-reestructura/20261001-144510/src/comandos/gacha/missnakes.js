import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".missnakes", ".misgusanitos"],
  desc: "Muestra tus Snakes",
  category: "Gacha",
  usage: ".missnakes [página]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({
      categoria: "snake", titulo: "Tus Snakes", sender, cleanText, reply,
      pista: "🔮 Subilos de nivel con *.orbes* (usá #id para elegir cuál)."
    });
  }
};

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
      pista: "🔮 Súbelos de nivel con *.orbes* (usa #id para elegir cuál)."
    });
  }
};

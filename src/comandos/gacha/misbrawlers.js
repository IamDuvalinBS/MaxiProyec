import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".misbrawlers"],
  desc: "Muestra tus Brawlers con su nivel",
  category: "Gacha",
  usage: ".misbrawlers [página]",
  handler: async ({ sock, from, msg, sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({
      sock, from, msg, categoria: "brawler", titulo: "Tus Brawlers", sender, cleanText, reply,
      pista: "⚡ Súbelos de nivel con *.cubitos* y *.subirbrawler* (usa #id para elegir cuál)."
    });
  }
};

import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".harem", ".miswaifus"],
  desc: "Muestra tu colección de waifus",
  category: "Gacha",
  usage: ".harem [página]",
  handler: async ({ sock, from, msg, sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({ sock, from, msg, categoria: "waifu", titulo: "Tu harem", sender, cleanText, reply });
  }
};

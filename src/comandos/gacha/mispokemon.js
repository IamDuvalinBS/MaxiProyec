import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".mispokemon"],
  desc: "Muestra tus Pokémon",
  category: "Gacha",
  usage: ".mispokemon [página]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({ categoria: "pokemon", titulo: "Tus Pokémon", emoji: "🔴", sender, cleanText, reply });
  }
};

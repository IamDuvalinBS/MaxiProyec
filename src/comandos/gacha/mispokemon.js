import { gachaListo, mostrarColeccion } from "../../../motores/gacha-core.js";

export default {
  names: [".mispokemon"],
  desc: "Muestra tus Pokémon con su nivel",
  category: "Gacha",
  usage: ".mispokemon [página]",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    await mostrarColeccion({
      categoria: "pokemon", titulo: "Tus Pokémon", sender, cleanText, reply,
      pista: "🍖 Súbelos de nivel con *.pokecomida* (usa #id para elegir cuál)."
    });
  }
};

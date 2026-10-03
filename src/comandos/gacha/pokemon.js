import { pokemonAleatorio } from "../../../motores/gacha-pokemon.js";
import { hacerRoll, gachaListo } from "../../../motores/gacha-core.js";

const COOLDOWN_MS = 10 * 60 * 1000;

export default {
  names: [".pokemon"],
  desc: "Genera un Pokémon al azar para reclamar con .claim (cada 10 minutos)",
  category: "Gacha",
  handler: async ({ from, sender, reply }) => {
    await gachaListo;
    await hacerRoll({
      categoria: "pokemon",
      obtener: pokemonAleatorio,
      reply, sender, from,
      cooldownMs: COOLDOWN_MS,
      titulo: "POKÉMON SALVAJE",
      textoVacio: "❌ No pude consultar PokeAPI ahora mismo, prueba de nuevo en un momento."
    });
  }
};

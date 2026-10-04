import { gachaListo } from "../../../motores/gacha-core.js";
import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

const pvp = crearHandlerPvp({ categoria: "pokemon", comando: "pokemonpvp", nombreLuchador: "Pokémon" });

export default {
  names: [".pokemonpvp"],
  desc: "Desafía a otro usuario con tu Pokémon: .pokemonpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
  category: "Gacha",
  usage: ".pokemonpvp <@usuario> <apuesta> <ID>",
  handler: async (ctx) => {
    await gachaListo;
    return pvp(ctx);
  }
};

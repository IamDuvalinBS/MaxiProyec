import { gachaListo } from "../../../motores/gacha-core.js";
import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

const pvp = crearHandlerPvp({ categoria: "pokemon", comando: "pokemonpvp", nombreLuchador: "Pokémon" });

export default {
  names: [".pokemonpvp"],
  desc: "Pelea tu mejor Pokémon contra el de otro usuario apostando dinero",
  category: "Gacha",
  usage: ".pokemonpvp @usuario <apuesta> [#id]",
  handler: async (ctx) => {
    await gachaListo;
    return pvp(ctx);
  }
};

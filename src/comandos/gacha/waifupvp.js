import { gachaListo } from "../../../motores/gacha-core.js";
import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

const pvp = crearHandlerPvp({ categoria: "waifu", comando: "waifupvp", nombreLuchador: "waifu" });

export default {
  names: [".waifupvp"],
  desc: "Desafía a otro usuario con tu waifu: .waifupvp <@usuario> <apuesta> <ID> (también por equipos)",
  category: "Gacha",
  usage: ".waifupvp <@usuario> <apuesta> <ID>",
  handler: async (ctx) => {
    await gachaListo;
    return pvp(ctx);
  }
};

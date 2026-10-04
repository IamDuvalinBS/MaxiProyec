import { gachaListo } from "../../../motores/gacha-core.js";
import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

const pvp = crearHandlerPvp({ categoria: "snake", comando: "snakepvp", nombreLuchador: "Snake" });

export default {
  names: [".snakepvp"],
  desc: "Desafía a otro usuario con tu Snake: .snakepvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
  category: "Gacha",
  usage: ".snakepvp <@usuario> <apuesta> <ID>",
  handler: async (ctx) => {
    await gachaListo;
    return pvp(ctx);
  }
};

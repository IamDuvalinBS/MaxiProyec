import { gachaListo, crearHandlerPvp } from "../../../motores/gacha-core.js";

const pvp = crearHandlerPvp({ categoria: "snake", comando: "snakepvp", nombreLuchador: "Snake" });

export default {
  names: [".snakepvp"],
  desc: "Pelea tu mejor Snake contra el de otro usuario apostando dinero",
  category: "Gacha",
  usage: ".snakepvp @usuario <apuesta> [#id]",
  handler: async (ctx) => {
    await gachaListo;
    return pvp(ctx);
  }
};

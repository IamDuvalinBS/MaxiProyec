import { gachaListo } from "../../../motores/gacha-core.js";
import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

const pvp = crearHandlerPvp({ categoria: "brawler", comando: "brawlstarspvp", nombreLuchador: "Brawler" });

export default {
  names: [".brawlstarspvp", ".brawlpvp"],
  desc: "Pelea tu mejor Brawler contra el de otro usuario apostando dinero",
  category: "Gacha",
  usage: ".brawlstarspvp @usuario <apuesta> [#id]",
  handler: async (ctx) => {
    await gachaListo;
    return pvp(ctx);
  }
};

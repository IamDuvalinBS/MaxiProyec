import { gachaListo } from "../../../motores/gacha-core.js";
import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

const pvp = crearHandlerPvp({ categoria: "brawler", comando: "brawlstarspvp", nombreLuchador: "Brawler" });

export default {
  names: [".brawlstarspvp", ".brawlpvp"],
  desc: "Desafía a otro usuario con tu Brawler: .brawlstarspvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
  category: "Gacha",
  usage: ".brawlstarspvp <@usuario> <apuesta> <ID>",
  handler: async (ctx) => {
    await gachaListo;
    return pvp(ctx);
  }
};

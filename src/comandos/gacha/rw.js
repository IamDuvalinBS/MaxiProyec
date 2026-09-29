import { personajeAleatorio } from "../../../motores/gacha-db.js";
import { hacerRoll, gachaListo } from "../../../motores/gacha-core.js";

const COOLDOWN_MS = 10 * 60 * 1000;

export default {
  names: [".rw", ".rollwaifu"],
  desc: "Genera una waifu al azar para reclamar con .claim (cada 10 minutos)",
  category: "Gacha",
  handler: async ({ from, sender, reply }) => {
    await gachaListo;
    await hacerRoll({
      categoria: "waifu",
      obtener: async () => personajeAleatorio("waifu", { soloLibres: true }),
      reply, sender, from,
      cooldownMs: COOLDOWN_MS,
      titulo: "ROLL WAIFU",
      textoVacio: "❌ Todavía no hay waifus en la base. Un owner tiene que usar *.yanderandom* para cargar algunas."
    });
  }
};

import { personajeAleatorio } from "../../../motores/gacha-db.js";
import { asegurarSnakes } from "../../../motores/gacha-snake.js";
import { hacerRoll, gachaListo } from "../../../motores/gacha-core.js";

const COOLDOWN_MS = 10 * 60 * 1000;

export default {
  names: [".snake", ".gusanito"],
  desc: "Genera un gusanito (skin de Snake) al azar para adoptar con .adoptar (cada 10 minutos)",
  category: "Gacha",
  handler: async ({ from, sender, reply }) => {
    await gachaListo;
    await asegurarSnakes();
    await hacerRoll({
      categoria: "snake",
      obtener: async () => personajeAleatorio("snake"),
      reply, sender, from,
      cooldownMs: COOLDOWN_MS,
      titulo: "SNAKE SALVAJE",
      textoVacio: "❌ No hay skins cargadas todavía."
    });
  }
};

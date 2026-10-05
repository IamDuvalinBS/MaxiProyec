import { personajeAleatorioPonderado } from "../../../motores/gacha-db.js";
import { asegurarSnakes, PESOS_SNAKE } from "../../../motores/gacha-snake.js";
import { hacerRoll, gachaListo } from "../../../motores/gacha-core.js";

const COOLDOWN_MS = 20 * 60 * 1000;

export default {
  names: [".snake", ".gusanito"],
  desc: "Genera un gusanito (skin de Snake) al azar para adoptar con .adoptar (cada 10 minutos)",
  category: "Gacha",
  handler: async ({ from, sender, reply }) => {
    await gachaListo;
    await asegurarSnakes();
    await hacerRoll({
      categoria: "snake",
      obtener: async () => personajeAleatorioPonderado("snake", PESOS_SNAKE),
      reply, sender, from,
      cooldownMs: COOLDOWN_MS,
      textoVacio: "❌ No hay skins cargadas todavía."
    });
  }
};

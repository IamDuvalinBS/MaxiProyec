// juegos/puntaje.js - recibe el puntaje de un juego HTML y paga si superas tu record
import { reclamar } from "../motores/juegos-records.js";

export default {
  names: [".puntaje", ".score"],
  desc: "Reclama el premio de tu récord en los juegos HTML (lo genera el propio juego)",
  category: "Juegos",
  usage: ".puntaje <sesion> <puntos>",
  handler: async ({ sender, cleanText, reply }) => {
    const [, id, puntos] = cleanText.trim().split(/\s+/);
    if (!id || !puntos) {
      await reply({ text: "Uso: *.puntaje <sesión> <puntos>*\nNo lo escribas a mano: toca el botón que te sale al terminar el juego." });
      return;
    }
    const r = await reclamar(sender, id.toLowerCase(), puntos);
    await reply({ text: r.texto });
  },
};

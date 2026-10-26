import { getProfile } from "../motores/profile.js";
import { validarYGuardar } from "../motores/juegos-records.js";

export default {
  names: [".grecord"],
  desc: "Guarda tu récord de un juego en la base de datos (uso interno)",
  category: "Juegos",
  usage: ".grecord <juego> <puntos> <seg> <pase>",
  handler: async ({ sender, cleanText, msg, reply }) => {
    const [, juego, puntos, segs, token] = String(cleanText || "").trim().split(/\s+/);
    const nombre = msg?.pushName || getProfile(sender)?.name || "Jugador";
    const r = await validarYGuardar({ juego, token, nombre, score: puntos, secs: segs });
    await reply({ text: r.texto });
  }
};

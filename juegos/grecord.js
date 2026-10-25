import { idCanonico } from "../motores/db.js";
import { getProfile } from "../motores/profile.js";
import { validarYGuardar } from "../motores/juegos-records.js";

export default {
  names: [".grecord"],
  desc: "Guarda tu récord de un juego en la base de datos (uso interno)",
  category: "Juegos",
  usage: ".grecord <juego> <puntos> <seg> <t> <firma>",
  handler: async ({ sender, cleanText, msg, reply }) => {
    const [, juego, puntos, segs, t, firma] = cleanText.trim().split(/\s+/);
    const nombre = msg?.pushName || getProfile(sender)?.name || String(sender).split("@")[0];
    const r = await validarYGuardar({
      juego,
      uid: idCanonico(sender),
      nombre,
      score: Number(puntos),
      secs: Number(segs),
      t: Number(t),
      firma
    });
    await reply({ text: r.texto });
  }
};

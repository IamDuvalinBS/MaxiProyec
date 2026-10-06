import { buscarStickersTenor, descargarBuffer, crearStickerConMetaFijo } from "../sticker.js";
import { delayAleatorio } from "../core.js";

export default {
  names: [".spack", ".stickers"],
  desc: "Manda 10 stickers de una busqueda especifica",
  category: "Stickers",
  usage: ".spack <busqueda>",
  handler: async ({ cleanText, from, sock, reply }) => {
    const query = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!query) {
      await reply({ text: "✏️ Usá: *.spack <búsqueda>* (ejemplo: .spack Goku)" });
      return;
    }

    let urls;
    try {
      urls = await buscarStickersTenor(query, 10);
    } catch (e) {
      await reply({ text: "❌ No se pudo buscar en Tenor: " + e.message });
      return;
    }

    if (!urls.length) {
      await reply({ text: `🔎 No encontré resultados para "${query}".` });
      return;
    }

    for (const url of urls) {
      try {
        const buffer = await descargarBuffer(url);
        const stickerBuffer = await crearStickerConMetaFijo(buffer);
        await sock.sendMessage(from, { sticker: stickerBuffer });
        // Pausa corta entre stickers para no mandar 10 mensajes de golpe
        // (mismo criterio anti-spam que usa el resto del bot).
        await delayAleatorio(500, 1200);
      } catch (e) {
        console.log(`❌ Error mandando un sticker de .spack (${query}): ` + e.message);
      }
    }
  }
};


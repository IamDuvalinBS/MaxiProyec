import {
  buscarStickersTenor,
  descargarBuffer,
  crearSticker,
  contextoMeta,
  enviarPaqueteStickers
} from "../../nucleo/sticker.js";
import { delayAleatorio } from "../../../core.js";

const FIRMA = "ByDuvalinBS";
const MINIMO_PAQUETE = 3;
const SIMULTANEOS = 3;

const aTitulo = (texto) =>
  texto
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30)
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

export default {
  names: [".spack", ".stickers"],
  desc: "Manda un paquete de stickers animados (hasta 10) de una búsqueda",
  category: "Stickers",
  usage: ".spack <busqueda>",
  handler: async ({ cleanText, from, sender, msg, sock, reply }) => {
    const query = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!query) {
      await reply({ text: "✏️ Usa: *.spack <búsqueda>* (ejemplo: .spack Goku)" });
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

    const contexto = await contextoMeta({ sock, from, sender, msg });
    const stickers = [];
    for (let i = 0; i < urls.length; i += SIMULTANEOS) {
      const lote = await Promise.all(
        urls.slice(i, i + SIMULTANEOS).map(async (url) => {
          try {
            return await crearSticker(await descargarBuffer(url), sender, contexto);
          } catch (e) {
            console.log(`❌ Error preparando un sticker de .spack (${query}): ` + e.message);
            return null;
          }
        })
      );
      stickers.push(...lote.filter(Boolean));
    }

    if (!stickers.length) {
      await reply({ text: `❌ No se pudo preparar ningún sticker de "${query}".` });
      return;
    }

    if (stickers.length >= MINIMO_PAQUETE) {
      try {
        await enviarPaqueteStickers({
          sock,
          from,
          msg,
          nombre: `${aTitulo(query)} ≛ ${FIRMA}`,
          publisher: FIRMA,
          descripcion: `Stickers de ${aTitulo(query)}`,
          stickers
        });
        return;
      } catch (e) {
        console.log(`[spack] No se pudo mandar como paquete, se mandan sueltos: ${e.stack || e.message}`);
      }
    }

    for (const sticker of stickers) {
      try {
        await sock.sendMessage(from, { sticker });
        await delayAleatorio(500, 1200);
      } catch (e) {
        console.log(`❌ Error mandando un sticker de .spack (${query}): ` + e.message);
      }
    }
  }
};

import {
  descargarBuffer,
  crearSticker,
  contextoMeta,
  enviarPaqueteStickers
} from "../../nucleo/sticker.js";
import { elegirStickers } from "../../nucleo/sticker-busqueda.js";
import { delayAleatorio } from "../../../core.js";

const FIRMA = "ByDuvalinBS";
const MINIMO_PAQUETE = 3;
const SIMULTANEOS = 3;
const CANTIDAD_BASE = 10;
const CANTIDAD_MAXIMA = 20;

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
  desc: "Manda un paquete de stickers distinto en cada búsqueda (Sticker.ly y Tenor)",
  category: "Stickers",
  usage: ".spack <búsqueda> • <cantidad opcional, hasta 20>",
  handler: async ({ cleanText, from, sender, msg, sock, reply }) => {
    const [bruto, extra] = cleanText.split(/\s+/).slice(1).join(" ").split("•").map((p) => p.trim());
    const query = bruto || "";
    if (!query) {
      await reply({ text: "✏️ Usa: *.spack <búsqueda>* (ejemplo: .spack Goku)\nPuedes indicar la cantidad así: *.spack Goku • 15*" });
      return;
    }

    const pedida = parseInt(extra, 10);
    const cantidad = Number.isFinite(pedida) ? Math.min(CANTIDAD_MAXIMA, Math.max(MINIMO_PAQUETE, pedida)) : CANTIDAD_BASE;

    let seleccion;
    try {
      seleccion = await elegirStickers(query, { cantidad, clave: from });
    } catch (e) {
      await reply({ text: "❌ No se pudo buscar stickers: " + e.message });
      return;
    }

    if (!seleccion.urls.length) {
      await reply({ text: `🔎 No encontré resultados para "${query}".` });
      return;
    }

    const contexto = await contextoMeta({ sock, from, sender, msg });
    const stickers = [];
    for (let i = 0; i < seleccion.urls.length && stickers.length < cantidad; i += SIMULTANEOS) {
      const lote = await Promise.all(
        seleccion.urls.slice(i, i + SIMULTANEOS).map(async (url) => {
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
    stickers.length = Math.min(stickers.length, cantidad);

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

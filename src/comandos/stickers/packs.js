import {
  extraerMediaDeMensaje,
  crearStickerConMeta,
  enviarPaqueteStickers,
  claveMeta,
  esStickerAnimado,
  MAX_SEGUNDOS_STICKER
} from "../../nucleo/sticker.js";
import { ERROR_PREMIUM, MENSAJE_PREMIUM } from "../../nucleo/premium.js";
import { getStickerMeta, delayAleatorio } from "../../../core.js";
import {
  MAX_STICKERS,
  crearPack,
  borrarPack,
  obtenerPack,
  listarPacks,
  agregarSticker,
  cambiarMeta
} from "../../../motores/packs-stickers.js";

const FIRMA = "ByDuvalinBS";
const MINIMO_PAQUETE = 3;

// Quita SOLO el comando; lo demás se conserva tal cual.
const textoCrudo = (cleanText) => String(cleanText || "").replace(/^\S+[ \t]*\r?\n?/, "").trim();

// "nombre • pack • autor" -> partes (vacías si no vienen)
const partes = (texto) => texto.split("•").map((p) => p.trim());

const USO_NUEVO = "✏️ Usa: *.newpack <nombre> • <pack> • <autor>*\n> Ejemplo: *.newpack goku • Stickers de Goku • Atte: Duva*\n> Pack y autor son opcionales: si los omites se usa el nombre y tu autor de *.setmeta*.";

const reestampar = (sticker, pack, autor) => crearStickerConMeta(sticker, pack, autor);

export default [
  {
    names: [".newpack", ".crearpack"],
    usage: ".newpack <nombre> • <pack> • <autor>",
    desc: "Crea un pack de stickers vacío con su propio meta",
    category: "Stickers",
    handler: async ({ cleanText, sender, reply }) => {
      const [nombre, pack, autor] = partes(textoCrudo(cleanText));
      if (!nombre) return reply({ text: USO_NUEVO });

      const meta = getStickerMeta(claveMeta(sender)) || getStickerMeta(sender);
      const resultado = crearPack(sender, nombre, pack || nombre, autor || meta?.author || FIRMA);
      if (resultado.error) return reply({ text: `❌ ${resultado.error}` });

      const p = resultado.pack;
      await reply({
        text:
          `✅ Pack *${p.nombre}* creado (vacío).\n\n*Pack:* ${p.pack}\n*Autor:* ${p.autor}\n\n` +
          `> Agrega stickers respondiendo a uno (o a una imagen/video) con *.addpack ${p.nombre}*.\n` +
          `> Todos recibirán este meta automáticamente.`
      });
    }
  },
  {
    names: [".addpack", ".agregarpack"],
    usage: ".addpack <nombre>  (respondiendo a un sticker, imagen o video)",
    desc: "Agrega un sticker a tu pack y le pone el meta del pack",
    category: "Stickers",
    handler: async ({ cleanText, sender, msg, reply }) => {
      const nombre = textoCrudo(cleanText);
      if (!nombre) return reply({ text: "✏️ Usa: *.addpack <nombre>* respondiendo a un sticker, imagen o video." });

      const p = obtenerPack(sender, nombre);
      if (!p) return reply({ text: `❌ No tienes un pack llamado *${nombre}*. Créalo con *.newpack ${nombre}*.` });

      let media;
      try {
        media = await extraerMediaDeMensaje(msg, sender);
      } catch (e) {
        if (e.message === ERROR_PREMIUM) return reply({ text: MENSAJE_PREMIUM });
        return reply({ text: "❌ No se pudo descargar el archivo. Intenta nuevamente." });
      }
      if (!media) return reply({ text: "🖼️ Responde a un sticker, imagen o video con *.addpack " + p.nombre + "*." });
      if (media.segundos > MAX_SEGUNDOS_STICKER) {
        return reply({ text: `❌ El video dura ${media.segundos} segundos. Máximo ${MAX_SEGUNDOS_STICKER} segundos.` });
      }

      try {
        const sticker = await crearStickerConMeta(media.buffer, p.pack, p.autor);
        const estado = agregarSticker(sender, nombre, sticker);
        if (estado === "lleno") return reply({ text: `❌ El pack *${p.nombre}* ya tiene ${MAX_STICKERS} stickers (el máximo).` });
        if (estado === "repetido") return reply({ text: `ℹ️ Ese sticker ya estaba en *${p.nombre}*.` });
        await reply({ text: `✅ Agregado a *${p.nombre}* con su meta. Ahora tiene ${p.stickers.length} sticker${p.stickers.length === 1 ? "" : "s"}.` });
      } catch (e) {
        console.log(`❌ Error en .addpack: ${e.message}`);
        await reply({ text: "❌ No se pudo agregar ese archivo al pack." });
      }
    }
  },
  {
    names: [".pack", ".mipack"],
    usage: ".pack <nombre>",
    desc: "Manda uno de tus packs de stickers",
    category: "Stickers",
    handler: async ({ cleanText, sender, from, msg, sock, reply }) => {
      const nombre = textoCrudo(cleanText);
      if (!nombre) return reply({ text: "✏️ Usa: *.pack <nombre>*. Mira tus packs con *.packs*." });

      const p = obtenerPack(sender, nombre);
      if (!p) return reply({ text: `❌ No tienes un pack llamado *${nombre}*.` });
      if (!p.stickers.length) return reply({ text: `ℹ️ El pack *${p.nombre}* está vacío. Agrega stickers con *.addpack ${p.nombre}*.` });

      if (p.stickers.length >= MINIMO_PAQUETE) {
        try {
          await enviarPaqueteStickers({
            sock,
            from,
            msg,
            nombre: p.pack,
            publisher: p.autor,
            descripcion: p.nombre,
            stickers: p.stickers
          });
          return;
        } catch (e) {
          console.log(`[packs] No se pudo mandar como paquete, se mandan sueltos: ${e.stack || e.message}`);
        }
      }

      for (const sticker of p.stickers) {
        try {
          await sock.sendMessage(from, { sticker, isAnimated: esStickerAnimado(sticker) });
          await delayAleatorio(500, 1200);
        } catch (e) {
          console.log(`❌ Error mandando un sticker de .pack: ${e.message}`);
        }
      }
    }
  },
  {
    names: [".packs", ".mispacks"],
    usage: ".packs",
    desc: "Lista tus packs de stickers",
    category: "Stickers",
    handler: async ({ sender, reply }) => {
      const lista = listarPacks(sender);
      if (!lista.length) return reply({ text: "ℹ️ Todavía no tienes packs.\n\n> Crea uno con *.newpack <nombre> • <pack> • <autor>*." });
      const filas = lista.map((p) => `✿ *${p.nombre}* — ${p.stickers.length}/${MAX_STICKERS}\n> ${p.pack} • ${p.autor}`);
      await reply({ text: `✿ *Tus packs de stickers* (${lista.length})\n\n${filas.join("\n\n")}` });
    }
  },
  {
    names: [".setpackmeta", ".metapack"],
    usage: ".setpackmeta <nombre> • <pack> • <autor>",
    desc: "Cambia el meta de un pack (y de todos sus stickers)",
    category: "Stickers",
    handler: async ({ cleanText, sender, reply }) => {
      const [nombre, pack, autor] = partes(textoCrudo(cleanText));
      if (!nombre || (!pack && !autor)) {
        return reply({ text: "✏️ Usa: *.setpackmeta <nombre> • <pack> • <autor>*\n> Ejemplo: *.setpackmeta goku • Goku Pack • Atte: Duva*" });
      }
      const actual = obtenerPack(sender, nombre);
      if (!actual) return reply({ text: `❌ No tienes un pack llamado *${nombre}*.` });

      try {
        const p = await cambiarMeta(sender, nombre, pack || actual.pack, autor || actual.autor, reestampar);
        await reply({ text: `✅ Meta de *${p.nombre}* actualizado en ${p.stickers.length} sticker${p.stickers.length === 1 ? "" : "s"}.\n\n*Pack:* ${p.pack}\n*Autor:* ${p.autor}` });
      } catch (e) {
        console.log(`❌ Error en .setpackmeta: ${e.message}`);
        await reply({ text: "❌ No se pudo actualizar el meta del pack." });
      }
    }
  },
  {
    names: [".delpack", ".borrarpack"],
    usage: ".delpack <nombre>",
    desc: "Borra uno de tus packs de stickers",
    category: "Stickers",
    handler: async ({ cleanText, sender, reply }) => {
      const nombre = textoCrudo(cleanText);
      if (!nombre) return reply({ text: "✏️ Usa: *.delpack <nombre>*." });
      if (!borrarPack(sender, nombre)) return reply({ text: `❌ No tienes un pack llamado *${nombre}*.` });
      await reply({ text: `✅ Pack *${nombre}* borrado.` });
    }
  }
];

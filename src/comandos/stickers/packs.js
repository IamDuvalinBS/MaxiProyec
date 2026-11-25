import {
  extraerMediaDeMensaje,
  crearStickerConMeta,
  crearMarcadorPack,
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
  idDePack,
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

const USO_NUEVO =
  "✏️ Usa: *.newpack* (crea \"Pack N\" con tu meta de *.setmeta*)\n" +
  "> Opcional: *.newpack <nombre> • <pack> • <autor>*\n" +
  "> Ejemplo: *.newpack goku • Stickers de Goku • Atte: Duva*";

const reestampar = (sticker, pack, autor) => crearStickerConMeta(sticker, pack, autor);

// El pack se elige por número (el de *.packs*); por compatibilidad también acepta el nombre.
function resolverPack(sender, texto) {
  const t = String(texto || "").trim();
  if (!t) return null;
  if (/^\d+$/.test(t)) return listarPacks(sender)[Number(t) - 1] || null;
  return obtenerPack(sender, t);
}

// Lista numerada de packs. `comando` es lo que se escribe para elegir (ej. "pack" → *.pack 2*).
function listaNumerada(sender, comando) {
  const lista = listarPacks(sender);
  const filas = lista.map((p, i) => `*${i + 1}.* ${p.nombre} — ${p.stickers.length}/${MAX_STICKERS}\n> ${p.pack} • ${p.autor}`);
  return `✿ *Tus packs de stickers* (${lista.length})\n\n${filas.join("\n\n")}\n\n> Elige con *.${comando} <número>*, por ejemplo *.${comando} 1*.`;
}

const SIN_PACKS = "ℹ️ Todavía no tienes packs.\n\n> Crea uno con *.newpack*.";

// Si no hay número válido: no hay packs → aviso; un solo pack → ese; varios → lista para elegir.
// Devuelve { pack } o { texto } (mensaje a responder).
function elegirOPreguntar(sender, arg, comando, { autoUnico = false } = {}) {
  const lista = listarPacks(sender);
  if (!lista.length) return { texto: SIN_PACKS };
  if (arg) {
    const p = resolverPack(sender, arg);
    return p ? { pack: p } : { texto: `❌ No encontré el pack *${arg}*.\n\n${listaNumerada(sender, comando)}` };
  }
  if (autoUnico && lista.length === 1) return { pack: lista[0] };
  return { texto: listaNumerada(sender, comando) };
}

// Manda el pack como pack real de WhatsApp (para verlo y guardarlo). WhatsApp pide mínimo 3 stickers:
// si faltan, se completa con stickers de relleno "Tu sticker aquí" (no se guardan en el pack).
// Devuelve true si se pudo mandar como pack.
async function mandarPack({ sock, from, msg, p }) {
  try {
    const stickers = [...p.stickers];
    for (let n = 1; stickers.length < MINIMO_PAQUETE; n++) stickers.push(await crearMarcadorPack(n, p.pack, p.autor));
    await enviarPaqueteStickers({
      sock,
      from,
      msg,
      nombre: p.pack,
      publisher: p.autor,
      descripcion: p.nombre,
      stickers,
      idPaquete: idDePack(p)
    });
    return true;
  } catch (e) {
    console.log(`[packs] No se pudo mandar como paquete: ${e.stack || e.message}`);
    return false;
  }
}

export default [
  {
    names: [".newpack", ".crearpack"],
    usage: ".newpack  (o .newpack <nombre> • <pack> • <autor>)",
    desc: "Crea un pack de stickers con tu meta y te lo manda para guardarlo",
    category: "Stickers",
    handler: async ({ cleanText, sender, from, msg, sock, reply }) => {
      const [nombreDado, packDado, autorDado] = partes(textoCrudo(cleanText));
      const meta = getStickerMeta(claveMeta(sender)) || getStickerMeta(sender);

      // Primera vez: sin meta propio ni pack/autor en el comando, hay que configurarlo antes.
      if (!meta?.pack && !packDado) {
        return reply({
          text:
            "📌 Antes de crear tu primer pack configura tu meta (nombre del pack y autor):\n\n" +
            "*.setmeta <pack> • <autor>*\n> Ejemplo: *.setmeta Stickers Goku • Atte: Duva*\n\n" +
            "Luego vuelve a escribir *.newpack*.\n" + USO_NUEVO
        });
      }

      let nombre = nombreDado;
      if (!nombre) {
        let n = listarPacks(sender).length + 1;
        while (obtenerPack(sender, `Pack ${n}`)) n++;
        nombre = `Pack ${n}`;
      }

      const resultado = crearPack(sender, nombre, packDado || meta?.pack || nombre, autorDado || meta?.author || FIRMA);
      if (resultado.error) return reply({ text: `❌ ${resultado.error}` });

      const p = resultado.pack;
      const numero = listarPacks(sender).indexOf(p) + 1;
      await reply({
        text:
          `✅ Pack *${numero}. ${p.nombre}* creado (vacío).\n\n*Pack:* ${p.pack}\n*Autor:* ${p.autor}\n\n` +
          `> Te mando el pack: guárdalo desde el mensaje de abajo.\n` +
          `> Agrega stickers respondiendo a uno (o a una imagen/video) con *.addpack ${numero}*.\n` +
          `> Ver tus packs: *.packs*`
      });
      if (!(await mandarPack({ sock, from, msg, p }))) {
        await reply({ text: `⚠️ No pude mandarte el pack para guardarlo ahora. Inténtalo después con *.pack ${numero}*.` });
      }
    }
  },
  {
    names: [".addpack", ".agregarpack"],
    usage: ".addpack <número>  (respondiendo a un sticker, imagen o video)",
    desc: "Agrega un sticker al pack que elijas (por número) con el meta del pack",
    category: "Stickers",
    handler: async ({ cleanText, sender, msg, reply }) => {
      const elegido = elegirOPreguntar(sender, textoCrudo(cleanText), "addpack", { autoUnico: true });
      if (!elegido.pack) {
        return reply({ text: `${elegido.texto}${listarPacks(sender).length ? "\n> Responde a un sticker, imagen o video con ese comando." : ""}` });
      }
      const p = elegido.pack;
      const numero = listarPacks(sender).indexOf(p) + 1;

      let media;
      try {
        media = await extraerMediaDeMensaje(msg, sender);
      } catch (e) {
        if (e.message === ERROR_PREMIUM) return reply({ text: MENSAJE_PREMIUM });
        return reply({ text: "❌ No se pudo descargar el archivo. Intenta nuevamente." });
      }
      if (!media) return reply({ text: `🖼️ Responde a un sticker, imagen o video con *.addpack ${numero}*.` });
      if (media.segundos > MAX_SEGUNDOS_STICKER) {
        return reply({ text: `❌ El video dura ${media.segundos} segundos. Máximo ${MAX_SEGUNDOS_STICKER} segundos.` });
      }

      try {
        const sticker = await crearStickerConMeta(media.buffer, p.pack, p.autor);
        const estado = agregarSticker(sender, p.nombre, sticker);
        if (estado === "lleno") return reply({ text: `❌ El pack *${numero}. ${p.nombre}* ya tiene ${MAX_STICKERS} stickers (el máximo).` });
        if (estado === "repetido") return reply({ text: `ℹ️ Ese sticker ya estaba en *${numero}. ${p.nombre}*.` });
        await reply({ text: `✅ Agregado a *${numero}. ${p.nombre}* con su meta. Ahora tiene ${p.stickers.length} sticker${p.stickers.length === 1 ? "" : "s"}.\n> Mira y guarda el pack con *.pack ${numero}*.` });
      } catch (e) {
        console.log(`❌ Error en .addpack: ${e.message}`);
        await reply({ text: "❌ No se pudo agregar ese archivo al pack." });
      }
    }
  },
  {
    names: [".pack", ".mipack"],
    usage: ".pack <número>",
    desc: "Te manda el pack que elijas (por número de .packs)",
    category: "Stickers",
    handler: async ({ cleanText, sender, from, msg, sock, reply }) => {
      const elegido = elegirOPreguntar(sender, textoCrudo(cleanText), "pack");
      if (!elegido.pack) return reply({ text: elegido.texto });
      const p = elegido.pack;

      if (await mandarPack({ sock, from, msg, p })) return;
      if (!p.stickers.length) return reply({ text: `ℹ️ El pack *${p.nombre}* está vacío. Agrega stickers con *.addpack ${listarPacks(sender).indexOf(p) + 1}*.` });

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
    desc: "Lista numerada de tus packs de stickers",
    category: "Stickers",
    handler: async ({ sender, reply }) => {
      if (!listarPacks(sender).length) return reply({ text: SIN_PACKS });
      await reply({
        text:
          listaNumerada(sender, "pack") +
          "\n> Agregar un sticker: *.addpack <número>* · Borrar: *.delpack <número>*"
      });
    }
  },
  {
    names: [".setpackmeta", ".metapack"],
    usage: ".setpackmeta <número> • <pack> • <autor>",
    desc: "Cambia el meta de un pack (y de todos sus stickers)",
    category: "Stickers",
    handler: async ({ cleanText, sender, from, msg, sock, reply }) => {
      const [ref, pack, autor] = partes(textoCrudo(cleanText));
      if (!ref || (!pack && !autor)) {
        const lista = listarPacks(sender).length ? `\n\n${listaNumerada(sender, "setpackmeta")}` : "";
        return reply({ text: `✏️ Usa: *.setpackmeta <número> • <pack> • <autor>*\n> Ejemplo: *.setpackmeta 1 • Goku Pack • Atte: Duva*${lista}` });
      }
      const actual = resolverPack(sender, ref);
      if (!actual) return reply({ text: `❌ No encontré el pack *${ref}*.\n\n${listaNumerada(sender, "setpackmeta")}` });

      try {
        const p = await cambiarMeta(sender, actual.nombre, pack || actual.pack, autor || actual.autor, reestampar);
        await reply({ text: `✅ Meta de *${p.nombre}* actualizado en ${p.stickers.length} sticker${p.stickers.length === 1 ? "" : "s"}.\n\n*Pack:* ${p.pack}\n*Autor:* ${p.autor}` });
        await mandarPack({ sock, from, msg, p });
      } catch (e) {
        console.log(`❌ Error en .setpackmeta: ${e.message}`);
        await reply({ text: "❌ No se pudo actualizar el meta del pack." });
      }
    }
  },
  {
    names: [".delpack", ".borrarpack"],
    usage: ".delpack <número>",
    desc: "Borra uno de tus packs de stickers (por número)",
    category: "Stickers",
    handler: async ({ cleanText, sender, reply }) => {
      const elegido = elegirOPreguntar(sender, textoCrudo(cleanText), "delpack");
      if (!elegido.pack) return reply({ text: elegido.texto });
      const p = elegido.pack;
      borrarPack(sender, p.nombre);
      await reply({ text: `✅ Pack *${p.nombre}* borrado. Los números de tus packs se reacomodan: mira *.packs*.` });
    }
  }
];

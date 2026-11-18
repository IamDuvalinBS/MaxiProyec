import { setStickerMeta, getStickerMeta } from "../../../core.js";
import { claveMeta, contextoMeta, metaPredeterminada } from "../../nucleo/sticker.js";

// Tope de seguridad por campo (en caracteres). WhatsApp acepta textos larguísimos en el pack y el autor,
// pero el meta viaja DENTRO del archivo del sticker y un sticker muy pesado lo rechaza WhatsApp.
// 3000 caracteres por campo deja de sobra para decoraciones con saltos de línea, símbolos y emojis.
const MAX_CAMPO = 3000;

const cortar = (texto) => {
  const letras = [...texto];
  return letras.length > MAX_CAMPO ? letras.slice(0, MAX_CAMPO).join("") : texto;
};

// Quita SOLO el comando; lo que va después se conserva exacto (dobles espacios, espacios invisibles, saltos de línea).
const textoCrudo = (cleanText) => String(cleanText || "").replace(/^\S+[ \t]*\r?\n?/, "");

export default {
  names: [".setmeta", ".meta"],
  desc: "Cambia el pack y el autor de tus stickers (.s)",
  category: "Stickers",
  usage: ".setmeta <pack> • <autor> | .setmeta reset  (respeta espacios y saltos de línea)",
  handler: async ({ sock, from, msg, cleanText, sender, reply }) => {
    const clave = claveMeta(sender);
    const crudo = textoCrudo(cleanText);
    const texto = crudo.trim();

    if (["reset", "del", "delete", "borrar"].includes(texto.toLowerCase())) {
      const guardado = getStickerMeta(clave) || getStickerMeta(sender);
      if (!guardado?.pack) {
        await reply({ text: "ℹ️ No tienes un meta personalizado, ya usas el predeterminado." });
        return;
      }
      setStickerMeta(clave, "", "");
      await reply({ text: "✅ Listo, tus stickers vuelven a usar el meta predeterminado." });
      return;
    }

    if (!texto) {
      const actual = getStickerMeta(clave) || getStickerMeta(sender);
      if (actual?.pack) {
        await reply({
          text:
            `📌 Tu meta actual es:\n*Pack:* ${actual.pack}\n*Autor:* ${actual.author || "Predeterminado"}\n\n` +
            `Para cambiarlo: *.setmeta <pack> • <autor>*\n` +
            `Para volver al predeterminado: *.setmeta reset*`
        });
      } else {
        const predeterminado = metaPredeterminada(await contextoMeta({ sock, from, sender, msg }));
        await reply({
          text:
            `📌 No tienes un meta personalizado. Se utiliza el predeterminado:\n\n` +
            `${predeterminado.pack}\n${predeterminado.autor}\n\n` +
            `Para configurar uno:\n*.setmeta <pack> • <autor>*\n` +
            `Ejemplo: .setmeta Stickers Goku • Atte: Duva`
        });
      }
      return;
    }

    // El primer "•" separa pack y autor. Todo lo demás se guarda TAL CUAL (sin colapsar espacios ni saltos de línea).
    const corte = crudo.indexOf("•");
    let pack = corte === -1 ? crudo : crudo.slice(0, corte);
    let author = corte === -1 ? "" : crudo.slice(corte + 1);

    // Solo se quita UN espacio pegado al separador (el de " • "); lo demás queda intacto.
    pack = pack.replace(/ $/, "");
    author = author.replace(/^ /, "");

    if (!pack.trim() && !author.trim()) {
      await reply({ text: "✏️ Usa: *.setmeta <pack> • <autor>* (ejemplo: .setmeta Stickers Goku • Atte: Duva)" });
      return;
    }

    const excedido = [...pack].length > MAX_CAMPO || [...author].length > MAX_CAMPO;
    pack = cortar(pack);
    author = cortar(author);

    setStickerMeta(clave, pack, author);
    await reply({
      text:
        `✅ Meta actualizado:\n*Pack:* ${pack}\n*Autor:* ${author || "Predeterminado"}\n\n` +
        `Se aplicará a todos los stickers que crees con *.s*, en cualquier chat.` +
        (excedido ? `\n\n⚠️ Se recortó a ${MAX_CAMPO} caracteres por campo para que WhatsApp acepte el sticker.` : "")
    });
  }
};

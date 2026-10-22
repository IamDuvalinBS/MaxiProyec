import { setStickerMeta, getStickerMeta } from "../../../core.js";
import { claveMeta, contextoMeta, metaPredeterminada } from "../../nucleo/sticker.js";

export default {
  names: [".setmeta", ".meta"],
  desc: "Cambia el pack y el autor de tus stickers (.s)",
  category: "Stickers",
  usage: ".setmeta <pack> • <autor>",
  handler: async ({ sock, from, msg, cleanText, sender, reply }) => {
    const clave = claveMeta(sender);
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();

    if (!texto) {
      const actual = getStickerMeta(clave) || getStickerMeta(sender);
      if (actual) {
        await reply({
          text:
            `📌 Tu meta actual es:\n*Pack:* ${actual.pack}\n*Autor:* ${actual.author || "Predeterminado"}\n\n` +
            `Para cambiarlo: *.setmeta <pack> • <autor>*`
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

    const partes = texto.split("•").map((p) => p.trim()).filter(Boolean);
    if (!partes.length) {
      await reply({ text: "✏️ Usa: *.setmeta <pack> • <autor>* (ejemplo: .setmeta Stickers Goku • Atte: Duva)" });
      return;
    }

    const pack = partes[0];
    const author = partes[1] || "";

    setStickerMeta(clave, pack, author);
    await reply({
      text:
        `✅ Meta actualizado:\n*Pack:* ${pack}\n*Autor:* ${author || "Predeterminado"}\n\n` +
        `Se aplicará a todos los stickers que crees con *.s*, en cualquier chat.`
    });
  }
};

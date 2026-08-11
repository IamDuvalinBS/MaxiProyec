import { setStickerMeta, getStickerMeta } from "../core.js";

export default {
  names: [".setmeta", ".meta"],
  desc: "Cambia el pack/autor de tus stickers (.s)",
  category: "Stickers",
  usage: ".setmeta <pack> • <autor>",
  handler: async ({ cleanText, sender, reply }) => {
    const texto = cleanText.split(/\s+/).slice(1).join(" ").trim();

    if (!texto) {
      const actual = getStickerMeta(sender);
      if (actual) {
        await reply({
          text:
            `📌 Tu meta actual es:\n*Pack:* ${actual.pack}\n*Autor:* ${actual.author}\n\n` +
            `Para cambiarlo: *.setmeta <pack> • <autor>*`
        });
      } else {
        await reply({
          text:
            `📌 No tenés un meta personalizado, se está usando el predeterminado ` +
            `(*MaxiBots • @vos*).\n\nPara ponerte uno:\n*.setmeta <pack> • <autor>*\n` +
            `Ejemplo: .setmeta Stickers Goku • Atte: Duva`
        });
      }
      return;
    }

    const partes = texto.split("•").map(p => p.trim()).filter(Boolean);
    const pack = partes[0] || "MaxiBots";
    const author = partes[1] || ("@" + sender.split("@")[0]);

    await setStickerMeta(sender, pack, author);
    await reply({ text: `✅ Meta actualizado:\n*Pack:* ${pack}\n*Autor:* ${author}` });
  }
};


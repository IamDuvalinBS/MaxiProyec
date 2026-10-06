import fs from "fs";
import { reactionCommand } from "../../reacciones/motor.js";
import { registrarBeso, getBesos, config, FOTO_PATH } from "../../../motores/db.js";

const enviarGif = reactionCommand({
  apiAction: "kiss",
  fraseConOtro: "le dio un beso a",
  fraseSolo: "se mandó un beso al aire."
});

export default {
  names: [".kiss", ".besar"],
  usage: ".kiss [@usuario]",
  desc: "Reacción de anime: kiss, con contador real de besos entre ambos",
  category: "Diversión",
  handler: async (ctx) => {
    const { sock, from, sender, msg } = ctx;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;

    await enviarGif(ctx);
    if (target === sender) return;

    const total = registrarBeso(sender, target);
    const miniatura = fs.existsSync(FOTO_PATH) ? fs.readFileSync(FOTO_PATH) : undefined;

    const nombreDe = `@${sender.split("@")[0]}`;
    const nombrePara = `@${target.split("@")[0]}`;
    const vecesTexto = total === 1 ? "1 vez" : `${total} veces`;

    await sock.sendMessage(
      from,
      {
        text: `💋 ${nombreDe} y ${nombrePara} se han besado *${vecesTexto}*.`,
        mentions: [sender, target],
        contextInfo: {
          isForwarded: true,
          forwardingScore: 999,
          externalAdReply: {
            title: `${total} beso${total === 1 ? "" : "s"} en total`,
            body: "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva",
            mediaType: 1,
            thumbnail: miniatura,
            renderLargerThumbnail: true,
            showAdAttribution: false,
            sourceUrl: config.channelLink
          }
        }
      },
      { quoted: msg }
    );
  }
};

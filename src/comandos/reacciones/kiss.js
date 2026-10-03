import { reactionCommand } from "../../reacciones/motor.js";
import { registrarBeso, getBesos, config } from "../../../motores/db.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const HEADERS = { "User-Agent": "MaxiProyecBot/1.0 (WhatsApp bot, contacto en GitHub IamDuvalinBS)" };

const enviarGif = reactionCommand({
  apiAction: "kiss",
  fraseConOtro: "le dio un beso a",
  fraseSolo: "se mandó un beso al aire."
});

const esBeso = (p) => {
  const tags = p.tag_string_general.split(" ");
  const personas = tags.includes("2girls") || tags.includes("2boys") || (tags.includes("1girl") && tags.includes("1boy"));
  const raro = tags.some((t) => t.includes("kiss") && /cheek|forehead|hand|blow|neck|foot/.test(t));
  return tags.includes("kiss") && personas && !raro;
};

const obtenerImagenBeso = async () => {
  for (let i = 0; i < 3; i++) {
    try {
      const pagina = 1 + Math.floor(Math.random() * 10);
      const res = await fetch(`https://safebooru.donmai.us/posts.json?tags=kiss&limit=100&page=${pagina}`, { headers: HEADERS });
      const posts = (await res.json()).filter((p) => p.rating === "g" && p.tag_count_character > 0 && p.large_file_url && /jpg|jpeg|png|webp/.test(p.file_ext) && esBeso(p));
      if (!posts.length) continue;
      const elegido = posts[Math.floor(Math.random() * posts.length)];
      const img = await loadImage(Buffer.from(await (await fetch(elegido.large_file_url, { headers: HEADERS })).arrayBuffer()));
      const s = Math.min(1, 800 / Math.max(img.width, img.height));
      const w = Math.round(img.width * s);
      const h = Math.round(img.height * s);
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toBuffer("image/jpeg", 80);
    } catch {}
  }
  return undefined;
};

export default {
  names: [".kiss", ".besar"],
  usage: ".kiss [@usuario]",
  desc: "Reacción de anime: kiss, con contador real de besos entre ambos",
  category: "Diversión",
  handler: async (ctx) => {
    const { sock, from, sender, msg } = ctx;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;

    if (target === sender) return enviarGif(ctx);

    const total = registrarBeso(sender, target);
    const miniatura = await obtenerImagenBeso();

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
            showAdAttribution: false
          }
        }
      },
      { quoted: msg }
    );
  }
};

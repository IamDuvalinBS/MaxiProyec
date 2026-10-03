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
  const raro = tags.some((t) => t.includes("kiss") && /cheek|forehead|hand|blow|neck|foot|imminent|almost|incoming|interrupt/.test(t));
  return personas && !raro;
};

const obtenerImagenBeso = async () => {
  for (let i = 0; i < 4; i++) {
    try {
      const pagina = 1 + Math.floor(Math.random() * 8);
      const res = await fetch(`https://safebooru.donmai.us/posts.json?tags=kiss&limit=100&page=${pagina}`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const todos = (await res.json()).filter((p) => p.rating === "g" && p.large_file_url && /jpg|jpeg|png|webp/.test(p.file_ext) && p.tag_string_general.split(" ").includes("kiss"));
      const buenos = todos.filter((p) => p.tag_count_character > 0 && esBeso(p));
      const base = buenos.length ? buenos : todos.filter(esBeso);
      const ancha = base.filter((p) => p.image_width / p.image_height >= 1.3);
      const conOjos = ancha.filter((p) => p.tag_string_general.split(" ").includes("closed_eyes"));
      const lista = conOjos.length ? conOjos : ancha.length ? ancha : base;
      if (!lista.length) continue;
      const elegido = lista[Math.floor(Math.random() * lista.length)];
      const archivo = await fetch(elegido.large_file_url, { headers: HEADERS });
      if (!archivo.ok) throw new Error(`HTTP ${archivo.status} al bajar la imagen`);
      const img = await loadImage(Buffer.from(await archivo.arrayBuffer()));
      const W = 640;
      const H = 360;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, W, H);
      const s = Math.min(W / img.width, H / img.height);
      const w = Math.round(img.width * s);
      const h = Math.round(img.height * s);
      ctx.drawImage(img, Math.round((W - w) / 2), Math.round((H - h) / 2), w, h);
      return canvas.toBuffer("image/jpeg", 70);
    } catch (e) {
      console.log("kiss: error obteniendo imagen: " + e.message);
    }
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

    await sock.sendMessage(
      from,
      {
        text: `> ${nombreDe} le dio un beso a ${nombrePara}.`,
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

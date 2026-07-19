import { getProfile, getAccount, pfpPath, box } from "../core.js";
import fs from "fs";

export default {
  names: [".perfil", ".profile"],
  desc: "Ver tu perfil o el de alguien mencionado",
  category: "Perfil",
  usage: ".perfil [@usuario]",
  handler: async ({ sock, from, sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;
    const p = getProfile(target);
    const acc = getAccount(target);

    let texto = "╔┅┉✦┉┅✦┅┉✦┉┅✦┉┅✦┅┅❥⧽\n";
    texto += `║✿ *Perfil de ›* ⊱@${target.split("@")[0]}⊰\n`;
    texto += "║\n";
    texto += `╰━⧽⧽ *Nombre ›* ${p.name || target.split("@")[0]}\n\n`;
    texto += `║ ✦ *Nivel*  ▸  *${p.level}*\n\n`;
    texto += "╠┅┉✦┉┅✦┅┉✦┉┅✦┉┅✦┅┅❥⧽\n";
    texto += "║\n";
    texto += "╠「⌕」`SOBRE MÍ  ٭  ૮꒰˵•ᵜ•˵꒱ა‧`\n";
    texto += "║\n";
    texto += `║ ฅ Cumpleaños » *${p.birthday || "No establecido"}*\n`;
    texto += `║ ☕︎︎ Pasatiempo » *${p.hobby || "No establecido"}*\n`;
    texto += `║ ☘︎ Biografía » *${p.bio || "Sin biografía"}*\n`;
    texto += `║ ✿ Casado con » *${p.marriedTo ? "@" + p.marriedTo.split("@")[0] : "Nadie"}*\n`;
    texto += `║ ⏳ Casados desde » *${p.marriedSince || "No aplica"}*\n`;
    texto += `║ 😎 Juego Favorito » *${p.favGame || "No establecido"}*\n`;
    texto += "╚┅┉✦┉┅✦┅┉✦┉┅✦┉┅✦┅┅❥⧽";

    const mentions = [target];
    if (p.marriedTo) mentions.push(p.marriedTo);

    let imageBuffer = null;
    if (fs.existsSync(pfpPath(target))) {
      imageBuffer = fs.readFileSync(pfpPath(target));
    } else {
      try {
        const url = await sock.profilePictureUrl(target, "image");
        const res = await fetch(url);
        imageBuffer = Buffer.from(await res.arrayBuffer());
      } catch (e) {
        imageBuffer = null;
      }
    }

    if (imageBuffer) {
      await sock.sendMessage(from, { image: imageBuffer, caption: texto, mentions }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: texto, mentions }, { quoted: msg });
    }
  }
};

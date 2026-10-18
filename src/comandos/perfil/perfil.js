import fs from "fs";
import { getProfile, pfpPath } from "../../../motores/profile.js";
import { getAccount } from "../../../motores/db.js";

const PIE_DE_PAGINA = "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva";
const NOMBRE_BOT = "𝑀𝑎𝑥𝑖𝑃𝑟𝑜𝑦𝑒𝑐";
const num = (jid) => jid.split("@")[0];

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

    const casadoCon = p.marriedTo ? "@" + num(p.marriedTo) : "Nadie";

    const texto = [
      `✦₊˚ 𓂃★ ⸝ *${NOMBRE_BOT}*⸝ ✦₊˚ 𓂃★ˊ˗`,
      "",
      "         /) /)",
      `      (｡•ㅅ•｡)〝₎₎ 𖥻 𝑃𝑒𝑟𝑓𝑖𝑙 𝑑𝑒 → @${num(target)} ! ꨄ ˊ˗`,
      ". .╭━∪━∪━⋅𖥔⋅ ━━━━━✶━━━━━ ⋅𖥔⋅ ━╮",
      `. .┊ ◟﹫ 𝑁𝑜𝑚𝑏𝑟𝑒 → ${p.name || num(target)} ! ꨄ`,
      "     · · ─────── ·✶· ──────── · ·‧₊˚✧",
      `. .┊◟♯ . / 𝑁𝑖𝑣𝑒𝑙 → ${p.level} (${p.xp || 0}/${p.level * 100} XP)`,
      "",
      "> ── - ̗̀ ᯠ _ ̫ _ᯄ੭ ¡ 𝑆𝑜𝑏𝑟𝑒 𝑚𝑖 !",
      "",
      `. .┊◟♯ . / 𝐶𝑢𝑚𝑝𝑙𝑒𝑎𝑛̃𝑜𝑠 → ${p.birthday || "No establecido"}`,
      `. .┊◟♯ . / 𝑃𝑎𝑠𝑎𝑡𝑖𝑒𝑚𝑝𝑜 → ${p.hobby || "No establecido"}`,
      `. .┊◟♯ . / 𝐵𝑖𝑜𝑔𝑟𝑎𝑓𝑖𝑎 → ${p.bio || "Sin biografía"}`,
      `. .┊◟♯ . / 𝐶𝑎𝑠𝑎𝑑𝑜 𝑐𝑜𝑛 → ${casadoCon}`,
      `. .┊◟♯ . / 𝐶𝑎𝑠𝑎𝑑𝑜𝑠 𝑑𝑒𝑠𝑑𝑒 → ${p.marriedSince || "No aplica"}`,
      `. .┊◟♯ . / 𝐽𝑢𝑒𝑔𝑜 𝑓𝑎𝑣𝑜𝑟𝑖𝑡𝑜 → ${p.favGame || "No establecido"}`,
      `. .┊◟♯ . / 𝑀𝑢𝑠𝑖𝑐𝑎 𝑓𝑎𝑣𝑜𝑟𝑖𝑡𝑎 → ${p.favMusic || "No establecido"}`,
      "   ╰━━ ⋅𖥔⋅ ━━━━━━✶━━━━━━ ⋅𖥔⋅ ━╯",
      "",
      `> ${PIE_DE_PAGINA}`
    ].join("\n");

    const mentions = [target];
    if (p.marriedTo) mentions.push(p.marriedTo);

    let buffer = null;
    let tipo = "image";

    if (fs.existsSync(pfpPath(target))) {
      buffer = fs.readFileSync(pfpPath(target));
      try {
        tipo = fs.readFileSync(pfpPath(target) + ".tipo", "utf8").trim();
      } catch (e) {}
    } else {
      try {
        const url = await sock.profilePictureUrl(target, "image");
        const res = await fetch(url);
        buffer = Buffer.from(await res.arrayBuffer());
      } catch (e) {
        buffer = null;
      }
    }

    let contenido;
    if (!buffer) {
      contenido = { text: texto, mentions };
    } else if (tipo === "video" || tipo === "gif") {
      contenido = {
        video: buffer,
        mimetype: "video/mp4",
        gifPlayback: tipo === "gif",
        caption: texto,
        mentions
      };
    } else {
      contenido = { image: buffer, caption: texto, mentions };
    }

    await sock.sendMessage(from, contenido, { quoted: msg });
  }
};

import fs from "fs";
import { getProfile, pfpPath } from "../../../motores/profile.js";
import { getAccount } from "../../../motores/db.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { FOTO_PATH } from "../../../core.js";

const FIRMA = "Bardera of style";
const NOMBRE_BOT = "𝑀𝑎𝑥𝑖𝑃𝑟𝑜𝑦𝑒𝑐";
const num = (jid) => jid.split("@")[0];

async function obtenerMedia(sock, target) {
  const ruta = pfpPath(target);

  if (fs.existsSync(ruta)) {
    let tipo = "image";
    try {
      tipo = fs.readFileSync(ruta + ".tipo", "utf8").trim();
    } catch (e) {}
    return { buffer: fs.readFileSync(ruta), tipo };
  }

  for (const calidad of ["image", "preview"]) {
    try {
      const url = await sock.profilePictureUrl(target, calidad);
      const res = await fetch(url);
      if (res.ok) return { buffer: Buffer.from(await res.arrayBuffer()), tipo: "image" };
    } catch (e) {
      console.log(`[perfil] profilePictureUrl (${calidad}) falló para ${target}: ${e.message}`);
    }
  }

  try {
    if (fs.existsSync(FOTO_PATH)) return { buffer: fs.readFileSync(FOTO_PATH), tipo: "image" };
  } catch (e) {}

  return { buffer: null, tipo: "image" };
}

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
      "> Este es tu perfil de WhatsApp en el bot, puedes ver cómo editarlo usando *.menu Perfil*"
    ].join("\n");

    const mentions = [target];
    if (p.marriedTo) mentions.push(p.marriedTo);

    const { buffer, tipo } = await obtenerMedia(sock, target);
    const esVideo = tipo === "video" || tipo === "gif";

    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto,
      footer: FIRMA,
      foto: esVideo ? null : buffer,
      video: esVideo ? buffer : null,
      gif: tipo === "gif",
      boton: null,
      mentions
    });

    if (enviado) return;

    let contenido;
    if (!buffer) {
      contenido = { text: `${texto}\n\n${FIRMA}`, mentions };
    } else if (esVideo) {
      contenido = {
        video: buffer,
        mimetype: "video/mp4",
        gifPlayback: tipo === "gif",
        caption: `${texto}\n\n${FIRMA}`,
        mentions
      };
    } else {
      contenido = { image: buffer, caption: `${texto}\n\n${FIRMA}`, mentions };
    }

    await sock.sendMessage(from, contenido, { quoted: msg });
  }
};

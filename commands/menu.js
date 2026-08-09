import fs from "fs";
import { config, formatUptime, getAllAccounts, box, commandRegistry, FOTO_PATH } from "../core.js";

export default {
  names: [".menu", ".help"],
  desc: "Ver todos los comandos disponibles",
  category: "General",
  handler: async ({ sock, from, sender, msg }) => {
    const categorias = {};
    for (const info of commandRegistry.values()) {
      if (!categorias[info.category]) categorias[info.category] = [];
      categorias[info.category].push(`▸ *${info.usage}* — ${info.desc}`);
    }

    const iconos = {
      "General": ["🍭", "🌟"],
      "Economía": ["🪙", "💰"],
      "Trabajos": ["🛠️", "⚙️"],
      "Utilidad": ["⚙️", "🛠️"],
      "Diversión": ["🎭", "🎉"],
      "Perfil": ["👤", "✨"]
    };

    const accounts = getAllAccounts();
    let texto = `✿ *¡Holaaa! . Mucho gusto* @${sender.split("@")[0]} . *Soy* 『 *${config.botNameLong}* 』 *, aquí tienes la lista de comandos (≧∇≦).*\n\n`;
    texto += `*==𑁍 INFORMACIÓN DEL BOT 𑁍==*\n\n`;
    texto += "╔╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽\n";
    texto += `║. .┊⩩ : *ᴏᴡɴᴇʀ* ›› ${config.ownerName}\n`;
    texto += `║. .┊⩩ : *ʙᴏᴛ ɴᴀᴍᴇ* ›› ${config.botNameShort}\n`;
    texto += "║. .┊⩩ : *ᴛʏᴘᴇ* ›› Multi-Device\n";
    texto += "║. .┊⩩ : *ᴜᴘᴅᴀᴛᴇ* ›› 1.0.0\n";
    texto += "║. .┊⩩ : *sʏsᴛᴇᴍ* ›› Node.js\n";
    texto += `║. .┊⩩ : *ᴜᴘᴛɪᴍᴇ* ›› ${formatUptime()}\n`;
    texto += `║. .┊⩩ : *ᴜsᴇʀ* ›› ${accounts.size}\n`;
    texto += "╚╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽\n\n";

    const ordenCategorias = ["General", "Utilidad", "Perfil", "Economía", "Trabajos", "Diversión"];
    for (const cat of ordenCategorias) {
      if (!categorias[cat]) continue;
      const [i1, i2] = iconos[cat] || ["📌", "•"];
      texto += `${i1} » ˚୨•(${i2})• ⊹  \`⧼⧼ ${cat.toUpperCase()} ⧽⧽\`⊹\n`;
      texto += categorias[cat].join("\n") + "\n\n";
    }

    let imageBuffer = null;
    if (fs.existsSync(FOTO_PATH)) imageBuffer = fs.readFileSync(FOTO_PATH);

    // Esto hace que el mensaje aparezca con la "firma" de un canal arriba,
    // y "Reenviado muchas veces" abajo - es solo un efecto visual, no manda
    // nada a ningun canal real.
    const contextInfo = {
      isForwarded: true,
      forwardingScore: 999,
      forwardedNewsletterMessageInfo: {
        newsletterJid: "120363000000000000@newsletter",
        newsletterName: `${config.botNameShort}-Bot Channel`,
        serverMessageId: 1
      }
    };

    if (imageBuffer) {
      await sock.sendMessage(from, { image: imageBuffer, caption: texto.trim(), mentions: [sender], contextInfo }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: texto.trim(), mentions: [sender], contextInfo }, { quoted: msg });
    }
  }
};

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
      categorias[info.category].push();
    }

    const iconos = {
      "General": ["🍭", "🌟"],
      "Economía": ["🪙", "💰"],
      "Trabajos": ["🛠️", "⚙️"],
      "Utilidad": ["⚙️", "🛠️"]
    };

    const accounts = getAllAccounts();
    let texto = ;
    texto += "╔┅┉✦┉┅✦┅┉✦┉┅✦┉┅┅❥⧽\n";
    texto += ;
    texto += ;
    texto += "║. .┊⩩﹕ *TYPE »* Multi-Device\n";
    texto += "║. .┊⩩﹕ *VERSION »* 1.0.0\n";
    texto += "║. .┊⩩﹕ *SISTEMA »* Node.js\n";
    texto += ;
    texto += ;
    texto += "╚┅┉✦┉┅✦┅┉✦┉┅✦┉┅┅❥⧽\n\n";

    const ordenCategorias = ["General", "Utilidad", "Economía", "Trabajos"];
    for (const cat of ordenCategorias) {
      if (!categorias[cat]) continue;
      const [i1, i2] = iconos[cat] || ["📌", "•"];
      texto += ;
      texto += categorias[cat].join("\n") + "\n\n";
    }

    let imageBuffer = null;
    if (fs.existsSync(FOTO_PATH)) imageBuffer = fs.readFileSync(FOTO_PATH);

    if (imageBuffer) {
      await sock.sendMessage(from, { image: imageBuffer, caption: texto.trim(), mentions: [sender] }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: texto.trim(), mentions: [sender] }, { quoted: msg });
    }
  }
};

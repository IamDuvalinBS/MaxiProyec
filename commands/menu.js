import fs from "fs";
import { config, formatUptime, getAllAccounts, box, commandRegistry, FOTO_PATH } from "../core.js";

// Nombre "bonito" de cada categoria + con que palabras (ES/EN) se puede
// pedir por separado con ".menu <categoria>" / ".help <categoria>".
const CATEGORIAS = [
  { nombre: "General", iconos: ["🍭", "🌟"], alias: ["general"] },
  { nombre: "Utilidad", iconos: ["⚙️", "🛠️"], alias: ["utilidad", "utility"] },
  { nombre: "Perfil", iconos: ["👤", "✨"], alias: ["perfil", "profile"] },
  { nombre: "Descargas", iconos: ["📥", "🎬"], alias: ["descargas", "downloads", "download"] },
  { nombre: "Economía", iconos: ["🪙", "💰"], alias: ["economia", "economía", "economy"] },
  { nombre: "Trabajos", iconos: ["🛠️", "⚙️"], alias: ["trabajos", "jobs", "job", "work", "trabajo"] },
  { nombre: "Juegos", iconos: ["🎮", "🕹️"], alias: ["juegos", "juego", "games", "game"] },
  { nombre: "Diversión", iconos: ["🎭", "🎉"], alias: ["diversion", "diversión", "fun"] },
  { nombre: "Stickers", iconos: ["🌱", "🪺"], alias: ["stickers", "sticker"] }
];

function buscarCategoria(palabra) {
  const w = palabra.trim().toLowerCase();
  return CATEGORIAS.find((c) => c.alias.includes(w)) || null;
}

function agruparComandos() {
  const categorias = {};
  for (const info of commandRegistry.values()) {
    if (!categorias[info.category]) categorias[info.category] = [];
    categorias[info.category].push(`▸ *${info.usage}* — ${info.desc}`);
  }
  return categorias;
}

function bloqueCategoria(cat, comandos) {
  const [i1, i2] = cat.iconos;
  return `${i1} ‹‹ ${cat.nombre.toUpperCase()} ›› ${i2}\n${comandos.join("\n")}`;
}

export default {
  names: [".menu", ".help"],
  desc: "Ver todos los comandos disponibles",
  category: "General",
  handler: async ({ sock, from, sender, msg }) => {
    // El texto original del mensaje (con el prefijo que haya usado la
    // persona), para sacarle el argumento despues del comando: ".menu
    // economia" -> "economia". No importa que prefijo/mayusculas haya
    // usado, solo nos interesa todo lo que viene despues de la primera
    // palabra.
    const rawText = (
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      ""
    ).trim();
    const argumento = rawText.replace(/^\S+\s*/, "").trim();

    const categorias = agruparComandos();
    const accounts = getAllAccounts();

    let texto;

    if (argumento) {
      // ".menu <categoria>" / ".help <categoria>" -> solo esa seccion
      const cat = buscarCategoria(argumento);
      if (!cat) {
        const nombres = CATEGORIAS.map((c) => c.nombre).join(", ");
        texto =
          `✿ No encontré la categoría *${argumento}*.\n` +
          `Categorías disponibles: ${nombres}.\n` +
          `Escribí *.menu* para ver todo.`;
      } else if (!categorias[cat.nombre] || !categorias[cat.nombre].length) {
        texto = `✿ Por ahora no hay comandos cargados en *${cat.nombre}*.`;
      } else {
        texto =
          `✿ Comandos de *${cat.nombre}* — 『 *${config.botNameLong}* 』\n\n` +
          bloqueCategoria(cat, categorias[cat.nombre]) +
          `\n\n・ Escribí *.menu* para ver todas las categorías.`;
      }
    } else {
      // ".menu" / ".help" sin nada mas -> menu completo
      let cuerpo = `✿ *¡Holaaa!* . Mucho gusto @${sender.split("@")[0]} . *Soy* 『 *${config.botNameLong}* 』 *, aquí tienes la lista de comandos (≧∇≦).*\n\n`;
      cuerpo += "━━━━━━━━━━━━━━\n";
      cuerpo += ` INFORMACIÓN DEL BOT\n`;
      cuerpo += "━━━━━━━━━━━━━━\n";
      cuerpo += `🏷️ Owner ›› ${config.ownerName}\n`;
      cuerpo += `🤖 Bot ›› ${config.botNameShort}\n`;
      cuerpo += `🔌 Tipo ›› Multi-Device\n`;
      cuerpo += `🔄 Update ›› 1.0.0\n`;
      cuerpo += `🖥️ Sistema ›› Node.js\n`;
      cuerpo += `⏱️ Uptime ›› ${formatUptime()}\n`;
      cuerpo += `👥 Usuarios ›› ${accounts.size}\n`;
      cuerpo += "━━━━━━━━━━━━━━\n\n";

      for (const cat of CATEGORIAS) {
        if (!categorias[cat.nombre] || !categorias[cat.nombre].length) continue;
        cuerpo += bloqueCategoria(cat, categorias[cat.nombre]) + "\n\n";
      }
      cuerpo += `・ Tip: escribí *.menu <categoría>* (ej: *.menu economia*, *.menu juegos*) para ver solo esa sección.`;
      texto = cuerpo;
    }

    let imageBuffer = null;
    if (fs.existsSync(FOTO_PATH)) imageBuffer = fs.readFileSync(FOTO_PATH);

    // Va todo como TEXTO con contextInfo, no como foto adjunta: la miniatura
    // aparece dentro de la tarjeta de enlace (externalAdReply), compacta,
    // en vez de mandar la imagen entera aparte.
    // - isForwarded + forwardingScore alto: da el aspecto "Reenviado muchas
    //   veces" sin necesitar un canal real (asi no aparece un boton "Ver
    //   canal" roto que tire error).
    // - externalAdReply: la tarjeta con la miniatura, el nombre del bot,
    //   la firma "Powered By ItsDuva" y el link del canal (real, funcional).
    const contextInfo = {
      isForwarded: true,
      forwardingScore: 999,
      externalAdReply: {
        title: config.botNameLong,
        body: "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva",
        mediaType: 1,
        thumbnail: imageBuffer || undefined,
        renderLargerThumbnail: true,
        showAdAttribution: false,
        sourceUrl: config.channelLink
      }
    };

    await sock.sendMessage(
      from,
      { text: texto.trim(), mentions: [sender], contextInfo },
      { quoted: msg }
    );
  }
};

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
    // Cada comando en su propio bloque: nombre en negrita, y la
    // descripcion en cita ("> texto") - el "citado" de WhatsApp que
    // resalta la linea completa.
    categorias[info.category].push(`✿ *${info.usage}*\n> ${info.desc}`);
  }
  return categorias;
}

function bloqueCategoria(cat, comandos) {
  const [i1, i2] = cat.iconos;
  return `${i1} » ˚୨•(${i2})• ⊹  \`⧼⧼ ${cat.nombre.toUpperCase()} ⧽⧽\`⊹\n\n${comandos.join("\n\n")}`;
}

// Intenta resolver el JID real del canal a partir del link de invitacion,
// para que "Ver canal" abra el canal de verdad en vez de tirar el error de
// "actualizacion reenviada no valida" que tiraba antes con un JID inventado.
// Si el metodo no existe en esta version de Baileys, o falla por lo que
// sea, simplemente no se agrega el boton (nunca rompe el .menu).
async function resolverCanal(sock) {
  try {
    const inviteCode = (config.channelLink || "").split("/channel/")[1];
    if (!inviteCode || typeof sock.newsletterMetadata !== "function") return null;
    const meta = await sock.newsletterMetadata("invite", inviteCode);
    if (!meta || !meta.id) return null;
    return {
      newsletterJid: meta.id,
      newsletterName: meta.name || `${config.botNameShort}-Bot Channel`,
      serverMessageId: 1
    };
  } catch (e) {
    return null;
  }
}

export default {
  names: [".menu", ".help"],
  usage: ".menu / .help",
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
          `Categorías disponibles: ${nombres}.`;
      } else if (!categorias[cat.nombre] || !categorias[cat.nombre].length) {
        texto = `✿ Por ahora no hay comandos cargados en *${cat.nombre}*.`;
      } else {
        texto =
          `✿ Comandos de *${cat.nombre}* — 『 *${config.botNameLong}* 』\n\n` +
          bloqueCategoria(cat, categorias[cat.nombre]);
      }
    } else {
      // ".menu" / ".help" sin nada mas -> menu completo
      let cuerpo = `✿ *¡Holaaa!* . Mucho gusto @${sender.split("@")[0]} . *Soy* 『 *${config.botNameLong}* 』 *, aquí tienes la lista de comandos (≧∇≦).*\n\n`;
      cuerpo += `*==𑁍 INFORMACIÓN DEL BOT 𑁍==*\n\n`;
      cuerpo += "╔╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽\n";
      cuerpo += `║. .┊⩩ : *ᴏᴡɴᴇʀ* ›› ${config.ownerName}\n`;
      cuerpo += `║. .┊⩩ : *ʙᴏᴛ ɴᴀᴍᴇ* ›› ${config.botNameShort}\n`;
      cuerpo += "║. .┊⩩ : *ᴛʏᴘᴇ* ›› Multi-Device\n";
      cuerpo += "║. .┊⩩ : *ᴜᴘᴅᴀᴛᴇ* ›› 1.0.0\n";
      cuerpo += "║. .┊⩩ : *sʏsᴛᴇᴍ* ›› Node.js\n";
      cuerpo += `║. .┊⩩ : *ᴜᴘᴛɪᴍᴇ* ›› ${formatUptime()}\n`;
      cuerpo += `║. .┊⩩ : *ᴜsᴇʀ* ›› @${sender.split("@")[0]}\n`;
      cuerpo += `║. .┊⩩ : *ᴛᴏᴛᴀʟ ᴜsᴇʀs* ›› ${accounts.size}\n`;
      cuerpo += "╚╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽\n\n";

      for (const cat of CATEGORIAS) {
        if (!categorias[cat.nombre] || !categorias[cat.nombre].length) continue;
        cuerpo += bloqueCategoria(cat, categorias[cat.nombre]) + "\n\n";
      }
      texto = cuerpo;
    }

    let imageBuffer = null;
    if (fs.existsSync(FOTO_PATH)) imageBuffer = fs.readFileSync(FOTO_PATH);

    const newsletterInfo = await resolverCanal(sock);

    // Va todo como TEXTO con contextInfo, no como foto adjunta: la miniatura
    // aparece dentro de la tarjeta de enlace (externalAdReply), compacta,
    // en vez de mandar la imagen entera aparte.
    // - isForwarded + forwardingScore alto: da el aspecto "Reenviado muchas
    //   veces".
    // - forwardedNewsletterMessageInfo: SOLO se agrega si se pudo resolver
    //   el JID real del canal (resolverCanal). Asi "Ver canal" abre el
    //   canal de verdad, y si no se puede resolver, no se agrega nada
    //   (para no repetir el error de "actualizacion reenviada no valida").
    // - externalAdReply: la tarjeta con la miniatura, el nombre del bot,
    //   la firma "Powered By ItsDuva" y el link del canal (real, funcional
    //   al tocar la tarjeta, sin depender de que se resuelva el JID).
    const contextInfo = {
      isForwarded: true,
      forwardingScore: 999,
      ...(newsletterInfo ? { forwardedNewsletterMessageInfo: newsletterInfo } : {}),
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

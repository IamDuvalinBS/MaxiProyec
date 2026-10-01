import fs from "fs";
import { config, formatUptime, getAllAccounts, commandRegistry, FOTO_PATH } from "../../../core.js";

let miniaturaCache = null;
let sharpNoDisponible = false; // en algunos Termux/Android el binario nativo de sharp no carga; si pasa, se usa la foto tal cual en vez de tirar abajo todo el .menu

async function miniaturaSegura() {
  if (!fs.existsSync(FOTO_PATH)) return undefined;
  const mtimeMs = fs.statSync(FOTO_PATH).mtimeMs;
  if (miniaturaCache && miniaturaCache.mtimeMs === mtimeMs) return miniaturaCache.buffer;

  const original = fs.readFileSync(FOTO_PATH);
  let buffer = original;

  if (!sharpNoDisponible) {
    try {
      const { default: sharp } = await import("sharp");
      buffer = await sharp(original).resize(300, 300, { fit: "cover" }).jpeg({ quality: 70 }).toBuffer();
    } catch (e) {
      sharpNoDisponible = true;
      console.log("[.menu] sharp no disponible en este dispositivo, se usa la foto sin comprimir: " + e.message);
      buffer = original;
    }
  }

  miniaturaCache = { mtimeMs, buffer };
  return buffer;
}

const CATEGORIAS = [
  { nombre: "General", icono: "🍭", alias: ["general"] },
  { nombre: "Utilidad", icono: "⚙️", alias: ["utilidad", "utility"] },
  { nombre: "Perfil", icono: "👤", alias: ["perfil", "profile"] },
  { nombre: "Descargas", icono: "📥", alias: ["descargas", "downloads", "download"] },
  { nombre: "Economía", icono: "🪙", alias: ["economia", "economía", "economy"] },
  { nombre: "Trabajos", icono: "🛠️", alias: ["trabajos", "trabajo", "jobs", "job", "work"] },
  { nombre: "Apuestas", icono: "🎰", alias: ["apuestas", "apuesta", "casino", "bets", "betting"] },
  { nombre: "Juegos", icono: "🎮", alias: ["juegos", "juego", "games", "game"] },
  { nombre: "Gacha", icono: "🎴", alias: ["gacha", "waifus", "rw", "pokemon", "brawl"] },
  { nombre: "Diversión", icono: "🎭", alias: ["diversion", "diversión", "fun"] },
  { nombre: "Stickers", icono: "🌱", alias: ["stickers", "sticker"] }
];

function buscarCategoria(palabra) {
  const w = palabra.trim().toLowerCase();
  return CATEGORIAS.find((c) => c.alias.includes(w)) || null;
}

function etiquetaDe(info) {
  const principal = info.names[0];
  const usage = info.usage || principal;
  const argumentos = usage.startsWith(principal) ? usage.slice(principal.length).trim() : "";
  const nombres = info.names.join(" / ");
  return argumentos ? `${nombres} ${argumentos}` : nombres;
}

function agruparComandos() {
  const categorias = {};
  const vistos = new Set();
  for (const info of commandRegistry.values()) {
    if (vistos.has(info)) continue;
    vistos.add(info);
    if (!categorias[info.category]) categorias[info.category] = [];
    categorias[info.category].push(`✿ *${etiquetaDe(info)}*\n> ${info.desc}`);
  }
  return categorias;
}

function bloqueCategoria(cat, comandos) {
  return `${cat.icono} ⧼⧼ ${cat.nombre.toUpperCase()} ⧽⧽\n\n${comandos.join("\n\n")}`;
}

async function resolverCanal(sock) {
  try {
    const codigo = (config.channelLink || "").split("/channel/")[1];
    if (!codigo || typeof sock.newsletterMetadata !== "function") return null;
    const meta = await sock.newsletterMetadata("invite", codigo);
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

function textoMenuCompleto(sender, categorias) {
  const usuario = `@${sender.split("@")[0]}`;
  let texto = `✿ *¡Holaaa!* . Mucho gusto ${usuario} . *Soy* 『 *${config.botNameLong}* 』 *, aquí tienes la lista de comandos (≧∇≦).*\n\n`;
  texto += "*==𑁍 INFORMACIÓN DEL BOT 𑁍==*\n\n";
  texto += "╔╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽\n";
  texto += `║. .┊⩩ : *ᴏᴡɴᴇʀ* ›› ${config.ownerName}\n`;
  texto += `║. .┊⩩ : *ʙᴏᴛ ɴᴀᴍᴇ* ›› ${config.botNameShort}\n`;
  texto += "║. .┊⩩ : *ᴛʏᴘᴇ* ›› Multi-Device\n";
  texto += "║. .┊⩩ : *ᴜᴘᴅᴀᴛᴇ* ›› 1.0.0\n";
  texto += "║. .┊⩩ : *sʏsᴛᴇᴍ* ›› Node.js\n";
  texto += `║. .┊⩩ : *ᴜᴘᴛɪᴍᴇ* ›› ${formatUptime()}\n`;
  texto += `║. .┊⩩ : *ᴜsᴇʀ* ›› ${usuario}\n`;
  texto += `║. .┊⩩ : *ᴛᴏᴛᴀʟ ᴜsᴇʀs* ›› ${getAllAccounts().size}\n`;
  texto += "╚╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽\n\n";

  for (const cat of CATEGORIAS) {
    if (!categorias[cat.nombre] || !categorias[cat.nombre].length) continue;
    texto += `${bloqueCategoria(cat, categorias[cat.nombre])}\n\n`;
  }
  return texto;
}

function textoCategoria(argumento, categorias) {
  const cat = buscarCategoria(argumento);
  if (!cat) {
    const nombres = CATEGORIAS.map((c) => c.nombre).join(", ");
    return `✿ No encontré la categoría *${argumento}*.\nCategorías disponibles: ${nombres}.`;
  }
  if (!categorias[cat.nombre] || !categorias[cat.nombre].length) {
    return `✿ Por ahora no hay comandos cargados en *${cat.nombre}*.`;
  }
  return `✿ Comandos de *${cat.nombre}* — 『 *${config.botNameLong}* 』\n\n${bloqueCategoria(cat, categorias[cat.nombre])}`;
}

export default {
  names: [".menu", ".help"],
  desc: "Ver todos los comandos disponibles",
  category: "General",
  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const argumento = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const categorias = agruparComandos();
    const texto = argumento ? textoCategoria(argumento, categorias) : textoMenuCompleto(sender, categorias);

    const miniatura = await miniaturaSegura();
    const canal = await resolverCanal(sock);

    const contextInfo = {
      isForwarded: true,
      forwardingScore: 999,
      ...(canal ? { forwardedNewsletterMessageInfo: canal } : {}),
      externalAdReply: {
        title: config.botNameLong,
        body: "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva",
        mediaType: 1,
        thumbnail: miniatura,
        renderLargerThumbnail: true,
        showAdAttribution: false,
        sourceUrl: config.channelLink
      }
    };

    // versiones viejas de WhatsApp) y el envío falla o nunca llega, se
    try {
      await sock.sendMessage(from, { text: texto.trim(), mentions: [sender], contextInfo }, { quoted: msg });
    } catch (e) {
      console.log("[.menu] Falló el envío con tarjeta, reintentando en texto simple: " + e.message);
      await sock.sendMessage(from, { text: texto.trim(), mentions: [sender] }, { quoted: msg });
    }
  }
};
    

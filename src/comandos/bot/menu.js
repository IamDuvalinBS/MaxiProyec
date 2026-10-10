import fs from "fs";
import { config, formatUptime, getAllAccounts, commandRegistry, FOTO_PATH } from "../../../core.js";
import { enviarConBoton } from "../../../motores/botones.js";

function leerFoto() {
  try {
    return fs.existsSync(FOTO_PATH) ? fs.readFileSync(FOTO_PATH) : null;
  } catch {
    return null;
  }
}

const CATEGORIAS = [
  { nombre: "General", icono: "🍭", alias: ["general"] },
  { nombre: "Utilidad", icono: "⚙️", alias: ["utilidad", "utility"] },
  { nombre: "Grupos", icono: "👥", alias: ["grupos", "grupo", "groups", "group"] },
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
  texto += "╚╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽";
  const cabecera = texto.trim();
  texto = "";

  for (const cat of CATEGORIAS) {
    if (!categorias[cat.nombre] || !categorias[cat.nombre].length) continue;
    texto += `${bloqueCategoria(cat, categorias[cat.nombre])}\n\n`;
  }
  return `${cabecera}\n\n${texto.trim()}`;
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

    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto,
      footer: config.botNameShort,
      foto: leerFoto(),
      boton: config.channelLink ? { texto: "📢 Canal", url: config.channelLink } : null,
      mentions: [sender]
    });

    if (!enviado) {
      await sock.sendMessage(from, { text: texto, mentions: [sender] }, { quoted: msg });
    }
  }
};

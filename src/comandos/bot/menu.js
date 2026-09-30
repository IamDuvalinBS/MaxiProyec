import fs from "fs";
import { formatUptime, getAllAccounts, commandRegistry, FOTO_PATH } from "../../../core.js";
import { config, saveConfig } from "../../../motores/db.js";
import { isOwner } from "../../../motores/owner.js";

const CATEGORIAS = [
  { nombre: "General", icono: "🍭", alias: ["general"] },
  { nombre: "Utilidad", icono: "⚙️", alias: ["utilidad", "utility"] },
  { nombre: "Perfil", icono: "👤", alias: ["perfil", "profile"] },
  { nombre: "Descargas", icono: "📥", alias: ["descargas", "downloads", "download"] },
  { nombre: "Economía", icono: "🪙", alias: ["economia", "economía", "economy"] },
  { nombre: "Trabajos", icono: "🛠️", alias: ["trabajos", "trabajo", "jobs", "job", "work"] },
  { nombre: "Apuestas", icono: "🎰", alias: ["apuestas", "apuesta", "casino", "bets", "betting"] },
  { nombre: "Juegos", icono: "🎮", alias: ["juegos", "juego", "games", "game"] },
  { nombre: "Gacha", icono: "🎴", alias: ["gacha", "waifus", "rw", "pokemon", "brawl", "snake", "tickets"] },
  { nombre: "Diversión", icono: "🎭", alias: ["diversion", "diversión", "fun"] },
  { nombre: "Stickers", icono: "🌱", alias: ["stickers", "sticker"] }
];

// ---- Ajustes de compatibilidad ----
const MAX_CARACTERES = 3500;        // cada mensaje del menú queda bajo este tamaño (los muy largos fallan en algunos celulares)
const MAX_ALIAS_VISIBLES = 3;       // en la lista se muestran como máximo estos nombres por comando
const MAX_MINIATURA_BYTES = 60_000; // una miniatura más pesada hace que algunos WhatsApp no muestren el mensaje
const PAUSA_ENTRE_MENSAJES_MS = 700;

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

function buscarCategoria(palabra) {
  const w = palabra.trim().toLowerCase();
  return CATEGORIAS.find((c) => c.alias.includes(w)) || null;
}

// Si el "nombre del owner" quedó guardado como un número/ID, se muestra "Owner" en vez del número.
function nombreOwner() {
  const n = String(config.ownerName || "").trim();
  return !n || /^@?\+?\d{6,}$/.test(n) ? "Owner" : n;
}

function etiquetaDe(info) {
  const principal = info.names[0];
  const usage = info.usage || principal;
  const argumentos = usage.startsWith(principal) ? usage.slice(principal.length).trim() : "";
  const visibles = info.names.slice(0, MAX_ALIAS_VISIBLES);
  const nombres = visibles.join(" / ") + (info.names.length > MAX_ALIAS_VISIBLES ? " …" : "");
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

// Parte los comandos de una categoría en mensajes de tamaño seguro.
function mensajesDeCategoria(cat, comandos) {
  const trozos = [];
  let actual = [], largo = 0;
  for (const c of comandos) {
    if (actual.length && largo + c.length + 2 > MAX_CARACTERES) { trozos.push(actual); actual = []; largo = 0; }
    actual.push(c); largo += c.length + 2;
  }
  if (actual.length) trozos.push(actual);
  return trozos.map((t, i) => {
    const parte = trozos.length > 1 ? ` (${i + 1}/${trozos.length})` : "";
    return `${cat.icono} ⧼⧼ ${cat.nombre.toUpperCase()}${parte} ⧽⧽\n\n${t.join("\n\n")}`;
  });
}

function bloqueInfo(sender) {
  const usuario = `@${sender.split("@")[0]}`;
  let t = `✿ *¡Holaaa!* . Mucho gusto ${usuario} . *Soy* 『 *${config.botNameLong}* 』 *, aquí tienes el menú (≧∇≦).*\n\n`;
  t += "*==𑁍 INFORMACIÓN DEL BOT 𑁍==*\n\n";
  t += "╔╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽\n";
  t += `║. .┊⩩ : *ᴏᴡɴᴇʀ* ›› ${nombreOwner()}\n`;
  t += `║. .┊⩩ : *ʙᴏᴛ ɴᴀᴍᴇ* ›› ${config.botNameShort}\n`;
  t += "║. .┊⩩ : *ᴛʏᴘᴇ* ›› Multi-Device\n";
  t += "║. .┊⩩ : *ᴜᴘᴅᴀᴛᴇ* ›› 1.0.0\n";
  t += "║. .┊⩩ : *sʏsᴛᴇᴍ* ›› Node.js\n";
  t += `║. .┊⩩ : *ᴜᴘᴛɪᴍᴇ* ›› ${formatUptime()}\n`;
  t += `║. .┊⩩ : *ᴜsᴇʀ* ›› ${usuario}\n`;
  t += `║. .┊⩩ : *ᴛᴏᴛᴀʟ ᴜsᴇʀs* ›› ${getAllAccounts().size}\n`;
  t += "╚╼┉┅◆┉┅╍◆┉┅╍◆┉┅❥⧽⧽";
  return t;
}

function textoPrincipal(sender, categorias) {
  let t = bloqueInfo(sender) + "\n\n*==𑁍 CATEGORÍAS 𑁍==*\n\n";
  for (const cat of CATEGORIAS) {
    const n = categorias[cat.nombre]?.length || 0;
    if (!n) continue;
    t += `${cat.icono} *${cat.nombre}* (${n}) ›› *.menu ${cat.alias[0]}*\n`;
  }
  t += "\n✿ Escribí *.menu <categoría>* para ver sus comandos.\n✿ *.menu todo* los muestra todos (en varios mensajes).";
  return t;
}

function textoNoEncontrada(argumento) {
  const nombres = CATEGORIAS.map((c) => c.nombre).join(", ");
  return `✿ No encontré la categoría *${argumento}*.\nCategorías disponibles: ${nombres}.`;
}

// ---- Modo "canal": el estilo con miniatura y reenviado desde el canal ----
async function resolverCanal(sock) {
  try {
    const codigo = (config.channelLink || "").split("/channel/")[1];
    if (!codigo || typeof sock.newsletterMetadata !== "function") return null;
    const meta = await sock.newsletterMetadata("invite", codigo);
    if (!meta || !meta.id) return null;
    return { newsletterJid: meta.id, newsletterName: meta.name || `${config.botNameShort}-Bot Channel`, serverMessageId: 1 };
  } catch (e) {
    return null;
  }
}

// Solo usa la foto como miniatura si es un JPEG liviano; si no, se omite (evita mensajes que no se ven).
function miniaturaSegura() {
  try {
    if (!FOTO_PATH || !fs.existsSync(FOTO_PATH)) return undefined;
    if (fs.statSync(FOTO_PATH).size > MAX_MINIATURA_BYTES) return undefined;
    const buf = fs.readFileSync(FOTO_PATH);
    return buf[0] === 0xff && buf[1] === 0xd8 ? buf : undefined;
  } catch {
    return undefined;
  }
}

async function contextoCanal(sock) {
  const canal = await resolverCanal(sock);
  const miniatura = miniaturaSegura();
  return {
    isForwarded: true,
    forwardingScore: 999,
    ...(canal ? { forwardedNewsletterMessageInfo: canal } : {}),
    externalAdReply: {
      title: config.botNameLong,
      body: "Pᴏᴡᴇʀᴇᴅ Bʏ • ItsDuva",
      mediaType: 1,
      ...(miniatura ? { thumbnail: miniatura, renderLargerThumbnail: true } : {}),
      showAdAttribution: false,
      sourceUrl: config.channelLink
    }
  };
}

export default {
  names: [".menu", ".help", ".menumodo"],
  usage: ".menu [categoría | todo]  ·  .menumodo [compatible|canal]",
  desc: "Ver los comandos disponibles por categoría",
  category: "General",
  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const partes = cleanText.trim().split(/\s+/);
    const cmd = partes[0].replace(/^[^\p{L}\p{N}]+/u, "").toLowerCase();
    const argumento = partes.slice(1).join(" ").trim();
    const enviar = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });

    // ---- .menumodo (solo owners) ----
    if (cmd === "menumodo") {
      if (!isOwner(sender)) return enviar({ text: "🚫 Este comando solo puede ser utilizado por owners." });
      const modo = argumento.toLowerCase();
      if (modo !== "compatible" && modo !== "canal") {
        return enviar({
          text: `⚙️ Modo actual del menú: *${config.menuModo || "compatible"}*\n\n` +
            "• *.menumodo compatible* → texto simple, se ve en TODOS los celulares (recomendado)\n" +
            "• *.menumodo canal* → con miniatura y estilo de canal (puede no verse en algunos WhatsApp)"
        });
      }
      config.menuModo = modo;
      await saveConfig();
      return enviar({ text: `✅ Menú en modo *${modo}*.` });
    }

    const categorias = agruparComandos();
    const modoCanal = config.menuModo === "canal";

    // Arma la lista de mensajes a enviar
    let mensajes = [];
    if (!argumento) {
      mensajes = [textoPrincipal(sender, categorias)];
    } else if (argumento.toLowerCase() === "todo" || argumento.toLowerCase() === "all") {
      mensajes = [bloqueInfo(sender)];
      for (const cat of CATEGORIAS) {
        if (categorias[cat.nombre]?.length) mensajes.push(...mensajesDeCategoria(cat, categorias[cat.nombre]));
      }
    } else {
      const cat = buscarCategoria(argumento);
      if (!cat) mensajes = [textoNoEncontrada(argumento)];
      else if (!categorias[cat.nombre]?.length) mensajes = [`✿ Por ahora no hay comandos cargados en *${cat.nombre}*.`];
      else mensajes = mensajesDeCategoria(cat, categorias[cat.nombre]).map((m, i, a) =>
        i === 0 ? `✿ Comandos de *${cat.nombre}* — 『 *${config.botNameLong}* 』\n\n${m}` : m);
    }

    for (let i = 0; i < mensajes.length; i++) {
      const contenido = { text: mensajes[i].trim(), mentions: [sender] };
      if (modoCanal && i === 0) {
        try { contenido.contextInfo = await contextoCanal(sock); } catch { /* sin estilo de canal */ }
      }
      await enviar(contenido);
      if (i < mensajes.length - 1) await pausa(PAUSA_ENTRE_MENSAJES_MS);
    }
  }
};
                                                                            

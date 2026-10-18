import fs from "fs";
import { config, formatUptime, commandRegistry, FOTO_PATH } from "../../../core.js";
import { enviarConBoton } from "../../../motores/botones.js";

function leerFoto() {
  try {
    return fs.existsSync(FOTO_PATH) ? fs.readFileSync(FOTO_PATH) : null;
  } catch {
    return null;
  }
}

// "categorias" son los nombres reales que usan los archivos de comandos (no se tocan).
// "titulo" es lo único que se muestra en el menú.
const GRUPOS = [
  {
    titulo: "INFOBOT",
    icono: "⚙️",
    descripcion: "Información del bot y herramientas generales.",
    categorias: ["General", "Utilidad"],
    alias: ["infobot", "general", "utilidad", "utility"]
  },
  {
    titulo: "GRUPOS",
    icono: "👥",
    descripcion: "Administración y utilidades para tus grupos.",
    categorias: ["Grupos"],
    alias: ["grupos", "grupo", "groups", "group"]
  },
  {
    titulo: "PERFIL",
    icono: "👤",
    descripcion: "Personaliza y consulta tu perfil.",
    categorias: ["Perfil"],
    alias: ["perfil", "profile"]
  },
  {
    titulo: "DESCARGAS",
    icono: "📥",
    descripcion: "Descarga audios, videos y más.",
    categorias: ["Descargas"],
    alias: ["descargas", "downloads", "download"]
  },
  {
    titulo: "ECONOMIA",
    icono: "🪙",
    descripcion: "Gana, trabaja, apuesta y administra tus monedas.",
    categorias: ["Economía", "Trabajos", "Apuestas"],
    alias: ["economia", "economy", "trabajos", "trabajo", "jobs", "job", "work", "apuestas", "apuesta", "casino", "bets", "betting"]
  },
  {
    titulo: "JUEGOS",
    icono: "🎮",
    descripcion: "Juegos y comandos de diversión para el grupo.",
    categorias: ["Juegos", "Diversión"],
    alias: ["juegos", "juego", "games", "game", "diversion", "fun"]
  },
  {
    titulo: "GACHA",
    icono: "🎴",
    descripcion: "Colecciona waifus, pokémon, brawlers y más.",
    categorias: ["Gacha"],
    alias: ["gacha", "waifus", "rw", "pokemon", "brawl"]
  },
  {
    titulo: "STICKERS",
    icono: "🌱",
    descripcion: "Crea y personaliza tus stickers.",
    categorias: ["Stickers"],
    alias: ["stickers", "sticker"]
  }
];

const SILABICO = {
  A: "ᗩ", B: "ᗷ", C: "ᑕ", D: "ᗪ", E: "ᗴ", F: "ᖴ", G: "ᘜ", H: "ᕼ", I: "I", J: "ᒍ", K: "K", L: "ᒪ", M: "ᗰ",
  N: "ᑎ", O: "O", P: "ᑭ", Q: "ᑫ", R: "ᖇ", S: "ᔕ", T: "T", U: "ᑌ", V: "ᐯ", W: "ᗯ", X: "᙭", Y: "Y", Z: "ᘔ"
};

const sinTildes = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "");

const silabico = (s) =>
  [...sinTildes(s).toUpperCase()].map((c) => SILABICO[c] || c).join("");

const monoespaciado = (s) =>
  [...sinTildes(s).toUpperCase()]
    .map((c) => (c >= "A" && c <= "Z" ? String.fromCodePoint(0x1d670 + c.charCodeAt(0) - 65) : c))
    .join("");

function buscarGrupo(palabra) {
  const w = sinTildes(palabra.trim()).toLowerCase();
  return GRUPOS.find((g) => g.titulo.toLowerCase() === w || g.alias.includes(w)) || null;
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

const comandosDe = (grupo, categorias) => grupo.categorias.flatMap((c) => categorias[c] || []);

function bloqueGrupo(grupo, comandos) {
  return [
    `╔≈≈≈⧼⨳˒˙ *${silabico(grupo.titulo)}* ˙˓⨳⧽≈≈≈⧽⧽`,
    `> ⧼${grupo.icono}⧽ ${grupo.descripcion}`,
    "︴",
    comandos.join("\n"),
    `╚≈≈⧼⨳˒˙ *𝙴𝙽𝙳 ${monoespaciado(grupo.titulo)}* ˙˓⨳⧽≈≈⧽⧽`
  ].join("\n");
}

function textoMenuCompleto(categorias) {
  const total = new Set(commandRegistry.values()).size;

  const cabecera = [
    `> 🐋 *¡Holaa!*, es un gusto tenerte aquí. Soy *⧼⧼ ${config.botNameLong} ⧽⧽*, aquí tienes la lista de comandos. ⬎`,
    "",
    "╔≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈⧽⧽",
    "︴ *⨳⌗۵ : ᥆ᥕᥒᥱr ძᥱᥣ ᑲ᥆𝗍 ::*",
    `> ${config.ownerName}`,
    "︴ *⨳⌗۵ : ᥒ᥆mᑲrᥱ ძᥱᥣ ᑲ᥆𝗍 ::*",
    `> ${config.botNameShort}`,
    "︴ *⨳⌗۵ : 𝗍і⍴᥆ / 𝖿ᥙᥒᥴі᥆́ᥒ ::*",
    "> Multi-Device",
    "︴ *⨳⌗۵ : ᥙ́ᥣ𝗍іmᥲ ᥎ᥱrsі᥆́ᥒ ::*",
    "> 1.0.0",
    "︴ *⨳⌗۵ : sіs𝗍ᥱmᥲ / ᥣᥱᥒgᥙᥲȷᥱ ::*",
    "> Node.js",
    "︴ *⨳⌗۵ : ᥴ᥆mᥲᥒძ᥆s 𝗍᥆𝗍ᥲᥣᥱs ::*",
    `> ${total} comandos`,
    "︴ *⨳⌗۵ : ᥙ⍴𝗍іmᥱ / һ᥆rᥲs ::*",
    `> ${formatUptime()}`,
    "╚≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈⧽⧽"
  ].join("\n");

  const bloques = [];
  for (const grupo of GRUPOS) {
    const comandos = comandosDe(grupo, categorias);
    if (comandos.length) bloques.push(bloqueGrupo(grupo, comandos));
  }

  return `${cabecera}\n\n\n${bloques.join("\n\n")}`;
}

function textoGrupo(argumento, categorias) {
  const grupo = buscarGrupo(argumento);
  if (!grupo) {
    const nombres = GRUPOS.map((g) => g.titulo).join(", ");
    return `✿ No encontré la categoría *${argumento}*.\nCategorías disponibles: ${nombres}.`;
  }

  const comandos = comandosDe(grupo, categorias);
  if (!comandos.length) {
    return `✿ Por ahora no hay comandos cargados en *${grupo.titulo}*.`;
  }

  return bloqueGrupo(grupo, comandos);
}

export default {
  names: [".menu", ".help"],
  desc: "Ver todos los comandos disponibles",
  category: "General",
  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const argumento = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const categorias = agruparComandos();
    const texto = argumento ? textoGrupo(argumento, categorias) : textoMenuCompleto(categorias);

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

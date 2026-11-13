import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { formatUptime, commandRegistry } from "../../../core.js";
import { ajusteBot, fotoBot } from "../../../motores/ajustes-bot.js";
import crypto from "crypto";

// "categorias" son los nombres reales que usan los archivos de comandos (no se tocan).
// "titulo" es lo único que se muestra en el menú. El orden de esta lista es el orden del menú.
const GRUPOS = [
  {
    titulo: "INFOBOT",
    icono: "⚙️",
    descripcion: "Información del bot y herramientas generales.",
    categorias: ["General", "Utilidad"],
    alias: ["infobot", "general", "utilidad", "utility"]
  },
  {
    titulo: "ECONOMY",
    icono: "🪙",
    descripcion: "Gana, trabaja, apuesta y administra tus monedas.",
    categorias: ["Economía", "Trabajos", "Apuestas"],
    alias: ["economy", "economia", "trabajos", "trabajo", "jobs", "job", "work", "apuestas", "apuesta", "casino", "bets", "betting"]
  },
  {
    titulo: "GACHA",
    icono: "🎴",
    descripcion: "Colecciona waifus, pokémon, brawlers y más.",
    categorias: ["Gacha"],
    alias: ["gacha", "waifus", "rw", "pokemon", "brawl"]
  },
  {
    titulo: "PETS",
    icono: "🐾",
    descripcion: "Incuba huevos, cuida a tus mascotas y mira cómo crecen.",
    categorias: ["Pets"],
    alias: ["pets", "pet", "mascotas", "mascota"]
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
    titulo: "TOOLS",
    icono: "🧰",
    descripcion: "Herramientas útiles: buscador, hora, calculadora y más.",
    categorias: ["Tools"],
    alias: ["tools", "tool", "herramientas", "herramienta"]
  },
    {
    titulo: "SUBBOTS",
    icono: "🤖",
    descripcion: "Opción para tener tu socket activo.",
    categorias: ["Subbots"],
    alias: ["Subbots"]
  },
  {
    titulo: "JUEGOS",
    icono: "🎮",
    descripcion: "Juegos para divertirte con tus amigos.",
    categorias: ["Juegos"],
    alias: ["juegos", "juego", "games", "game"]
  },
  {
    titulo: "REACCIONES",
    icono: "🎭",
    descripcion: "Reacciones para interactuar con los demás.",
    categorias: ["Diversión"],
    alias: ["reacciones", "reaccion", "diversion", "fun"]
  },
  {
    titulo: "BROMAS",
    icono: "🤡",
    descripcion: "Medidores, duos y comandos de broma para el grupo.",
    categorias: ["Bromas"],
    alias: ["bromas", "broma", "jokes", "joke", "medidores", "medidor"]
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
    `> 🐋 *¡Holaa!*, es un gusto tenerte aquí. Soy *${ajusteBot("botNameShort")}*, aquí tienes la lista de comandos. ⬎`,
    "",
    "╔≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈⧽⧽",
    "︴ *⨳⌗۵ : ᥆ᥕᥒᥱr ძᥱᥣ ᑲ᥆𝗍 ::*",
    `> ${ajusteBot("ownerName")}`,
    "︴ *⨳⌗۵ : ᥒ᥆mᑲrᥱ ძᥱᥣ ᑲ᥆𝗍 ::*",
    `> ${ajusteBot("botNameLong")}`,
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

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const RUTAS_VIDEO = ["assets/videos/menu.mp4", "assets/menu.mp4", "photo/menu.mp4"].map((ruta) => path.join(RAIZ, ruta));
let videoNota;

function leerVideoNota() {
  if (videoNota !== undefined) return videoNota;
  const ruta = RUTAS_VIDEO.find((r) => fs.existsSync(r));
  videoNota = ruta ? fs.readFileSync(ruta) : null;
  return videoNota;
}

async function enviarNotaDeVideo(sock, from) {
  const video = leerVideoNota();
  if (!video) return;
  try {
    await sock.sendMessage(from, { video, ptv: true, mimetype: "video/mp4" });
  } catch (e) {
    console.log(`No se pudo enviar la nota de video del menú: ${e.message}`);
  }
}

const LINK_COMUNIDAD = "https://chat.whatsapp.com/DnWYpCBy9Eh1jTNiCSZ3LG";
const BOTONES_FUERA_DEL_DESPLEGABLE = 1;
const NODO_BIZ = {
  tag: "biz",
  attrs: {},
  content: [{ tag: "interactive", attrs: { type: "native_flow", v: "1" }, content: [{ tag: "native_flow", attrs: { v: "9", name: "mixed" } }] }]
};

const normalizarUrl = (url) => {
  const limpio = String(url || "").trim();
  if (!limpio) return "";
  return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio.replace(/^\/+/, "")}`;
};

const urlBtn = (texto, url) => ({ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: texto, url, merchant_url: url }) });

function botonesDelMenu() {
  const enlaces = [
    ["📢 CANAL OFICIAL", ajusteBot("channelLink")],
    ["🧸 Comunidad", LINK_COMUNIDAD],
    ["🌺 Grupo oficial", ajusteBot("groupLink")],
    ["⚙️ Nuestra página", ajusteBot("webLink")]
  ]
    .map(([texto, url]) => [texto, normalizarUrl(url)])
    .filter(([, url]) => url);
  return enlaces.map(([texto, url]) => urlBtn(texto, url));
}

function parametrosDelDesplegable(botones) {
  if (botones.length <= BOTONES_FUERA_DEL_DESPLEGABLE + 1) return "";
  return JSON.stringify({
    bottom_sheet: {
      in_thread_buttons_limit: BOTONES_FUERA_DEL_DESPLEGABLE + 1,
      divider_indices: [...botones.keys()].slice(BOTONES_FUERA_DEL_DESPLEGABLE).concat(999),
      list_title: "Redes oficiales",
      button_title: "🔗 Nuestras redes"
    }
  });
}

async function enviarMenuConDesplegable({ sock, from, msg, texto, footer, foto, mentions }) {
  try {
    const modulo = await import("@fer2809fl/baileys");
    const lib = modulo.default && typeof modulo.default === "object" ? { ...modulo, ...modulo.default } : modulo;
    const botones = botonesDelMenu();
    if (!lib.proto || !botones.length) return false;

    let header = { title: "", subtitle: "", hasMediaAttachment: false };
    if (foto) {
      try {
        const media = await lib.prepareWAMessageMedia({ image: foto }, { upload: sock.waUploadToServer });
        header = { title: "", subtitle: "", hasMediaAttachment: true, ...media };
      } catch (e) {
        console.log(`[menu] No se pudo subir la foto: ${e.message}`);
      }
    }

    const interactiveMessage = {
      body: { text: texto },
      footer: { text: footer || "" },
      header,
      nativeFlowMessage: {
        buttons: botones,
        messageParamsJson: parametrosDelDesplegable(botones)
      },
      contextInfo: { mentionedJid: mentions }
    };

    const armado = await lib.generateWAMessageFromContent(from, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2, messageSecret: crypto.randomBytes(32) },
          interactiveMessage
        }
      }
    }, { userJid: sock.user?.id, quoted: msg });
    await sock.relayMessage(from, armado.message, { messageId: armado.key.id, additionalNodes: [NODO_BIZ] });
    return true;
  } catch (e) {
    console.log(`[menu] No se pudo enviar el desplegable: ${e.stack || e.message}`);
    return false;
  }
}

export default {
  names: [".menu", ".help"],
  desc: "Ver todos los comandos disponibles",
  category: "General",
  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const argumento = cleanText.split(/\s+/).slice(1).join(" ").trim();
    const categorias = agruparComandos();
    const texto = argumento ? textoGrupo(argumento, categorias) : textoMenuCompleto(categorias);

    const enviado = await enviarMenuConDesplegable({
      sock,
      from,
      msg,
      texto,
      footer: ajusteBot("botNameShort"),
      foto: fotoBot() || undefined,
      mentions: [sender]
    });

    if (!enviado) {
      await sock.sendMessage(from, { text: texto, mentions: [sender] }, { quoted: msg });
    }

    if (!argumento) await enviarNotaDeVideo(sock, from);
  }
};

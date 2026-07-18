#!/data/data/com.termux/files/usr/bin/bash
set -e
mkdir -p commands
echo Creando core.js...
cat > core.js << COREEOF
import { MongoClient } from "mongodb";

export const CURRENCY = "¥enes";
export const FOTO_PATH = "./botpic.jpg";
export const startTime = Date.now();

const MONGO_URI = "mongodb+srv://jg0455748_db_user:2IBhQ33NazDOoBjg@cluster0.27mrbg5.mongodb.net/?appName=Cluster0";

const accounts = new Map(); // sender -> { wallet, bank, cooldowns: { comando: timestampMs } }
let collection = null;
let configCollection = null;

export const config = {
  botNameShort: "𝕬𝖘𝖙𝖆",
  botNameLong: "𝕬𝖘𝖙𝖆",
  ownerName: "Sin definir"
};

export async function connectDB(intentos = 5) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db("whatsappbot");
      collection = db.collection("accounts");
      configCollection = db.collection("config");
      console.log("Conectado a MongoDB");

      const docs = await collection.find({}).toArray();
      for (const doc of docs) {
        accounts.set(doc._id, {
          wallet: doc.wallet || 0,
          bank: doc.bank || 0,
          cooldowns: doc.cooldowns || {}
        });
      }
      console.log(`Datos cargados desde MongoDB: ${accounts.size} cuentas`);

      const cfgDoc = await configCollection.findOne({ _id: "bot" });
      if (cfgDoc) Object.assign(config, cfgDoc);
      return;
    } catch (e) {
      console.log(`Intento ${i}/${intentos} fallo: ${e.message}`);
      if (i < intentos) await new Promise(r => setTimeout(r, 4000));
    }
  }
  console.log("No se pudo conectar a MongoDB tras varios intentos.");
}

export async function saveAccount(sender) {
  if (!collection) return;
  const acc = getAccount(sender);
  try {
    await collection.updateOne(
      { _id: sender },
      { $set: { wallet: acc.wallet, bank: acc.bank, cooldowns: acc.cooldowns } },
      { upsert: true }
    );
  } catch (e) {
    console.log("Error guardando en MongoDB: " + e.message);
  }
}

export async function saveConfig() {
  if (!configCollection) return;
  try {
    await configCollection.updateOne({ _id: "bot" }, { $set: config }, { upsert: true });
  } catch (e) {
    console.log("Error guardando config: " + e.message);
  }
}

export function getAccount(sender) {
  if (!accounts.has(sender)) {
    accounts.set(sender, { wallet: 0, bank: 0, cooldowns: {} });
  }
  const acc = accounts.get(sender);
  if (!acc.cooldowns) acc.cooldowns = {};
  return acc;
}

export function getAllAccounts() {
  return accounts;
}

export function addToWallet(sender, amount) {
  const acc = getAccount(sender);
  acc.wallet += amount;
  saveAccount(sender);
  return acc;
}

// Cooldown PERSISTENTE: se guarda en MongoDB, sobrevive reinicios del bot.
// Devuelve 0 si puede usar el comando (y lo marca como usado ahora).
// Devuelve los ms restantes si todavia tiene que esperar.
export function checkCooldown(sender, comando, ms) {
  const acc = getAccount(sender);
  const last = acc.cooldowns[comando] || 0;
  const now = Date.now();
  const remaining = last + ms - now;
  if (remaining > 0) return remaining;
  acc.cooldowns[comando] = now;
  saveAccount(sender);
  return 0;
}

export function formatTime(ms) {
  const seg = Math.ceil(ms / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatUptime() {
  const seg = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return `${h}h ${m}m ${s}s`;
}

export function box(titulo, lineas) {
  return [
    "╔╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦╼⧽⧽",
    `┋✿ *${titulo}*`,
    "┋",
    ...lineas.map(l => `┋ ${l}`),
    "┋",
    "╰╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦┉╼⧽⧽"
  ].join("\n");
}

// Registro compartido de comandos (lo llena economia.js al cargar la carpeta commands/)
export const commandRegistry = new Map(); // primerNombre -> { names, desc, category, usage }

// ============ SISTEMA DE TRIVIA (pregunta y espera respuesta) ============
const pendingTrivia = new Map(); // sender -> { correcta, reward, expira, chatId }

export function setPendingTrivia(sender, data) {
  pendingTrivia.set(sender, data);
}

// Llamado desde index.js en CADA mensaje (no solo comandos), para ver si el
// texto es la respuesta a una trivia pendiente de esa persona.
export async function checkTriviaAnswer(sock, from, sender, text, msg) {
  const pending = pendingTrivia.get(sender);
  if (!pending) return false;
  if (Date.now() > pending.expira) {
    pendingTrivia.delete(sender);
    return false;
  }
  const respuesta = text.trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(respuesta)) return false;

  pendingTrivia.delete(sender);
  const reply = (content) => sock.sendMessage(from, content, { quoted: msg });

  if (respuesta === pending.correcta) {
    addToWallet(sender, pending.reward);
    await reply({ text: box("¡RESPUESTA CORRECTA!", [`🧠 Ganaste por acertar la trivia...`, `🪙 GANASTE  ›› *${pending.reward} ${CURRENCY}*`]) });
  } else {
    await reply({ text: `❌ Incorrecto. La respuesta era *${pending.correcta}*. Mejor suerte la próxima.` });
  }
  return true;
}

// ============ FABRICA DE COMANDOS DE "TRABAJO" ============
// Genera un handler estandar para comandos tipo trabajar/minar/crimen/etc.
// Reduce repeticion mientras cada comando sigue viviendo en su propio archivo.
export function workCommand({ key, cooldownMs, minReward, maxReward, riesgo, frases }) {
  return async ({ sender, reply }) => {
    const wait = checkCooldown(sender, key, cooldownMs);
    if (wait > 0) {
      return reply({ text: `⏳ Ya usaste este comando. Esperá *${formatTime(wait)}*.` });
    }

    const acc = getAccount(sender);
    const exito = !riesgo || Math.random() > riesgo.chanceFallo;

    if (exito) {
      const gano = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
      addToWallet(sender, gano);
      const frase = frases.exito[Math.floor(Math.random() * frases.exito.length)];
      await reply({ text: box(frases.titulo, [frase, `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
    } else {
      const perdio = riesgo.perdidaTotal
        ? acc.wallet
        : Math.min(acc.wallet, Math.floor(Math.random() * riesgo.maxPerdida) + riesgo.minPerdida);
      acc.wallet -= perdio;
      await saveAccount(sender);
      const frase = frases.fallo[Math.floor(Math.random() * frases.fallo.length)];
      await reply({ text: box(frases.tituloFallo || frases.titulo, [frase, `💸 PERDISTE  ›› *${perdio} ${CURRENCY}*`]) });
    }
  };
}
COREEOF
echo Creando economia.js...
cat > economia.js << ECOEOF
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { connectDB, commandRegistry, checkTriviaAnswer } from "./core.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsDir = path.join(__dirname, "commands");

const commandMap = new Map(); // cada nombre/alias -> handler

async function loadCommands() {
  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".js"));
  for (const file of files) {
    const mod = await import(`./commands/${file}`);
    const cmd = mod.default;
    if (!cmd || !cmd.names || !cmd.handler) {
      console.log(`⚠️ Comando invalido en ${file}, se salteo.`);
      continue;
    }
    for (const name of cmd.names) {
      commandMap.set(name, cmd.handler);
    }
    // Se registra una sola vez por comando (para el .menu), usando el primer nombre como key
    commandRegistry.set(cmd.names[0], {
      names: cmd.names,
      desc: cmd.desc || "",
      category: cmd.category || "General",
      usage: cmd.usage || cmd.names[0]
    });
  }
  console.log(`Comandos cargados: ${commandMap.size} (desde ${files.length} archivos)`);
}

connectDB();
const readyPromise = loadCommands();

export async function handleEconomyCommand(sock, from, sender, text, msg) {
  await readyPromise;

  const cleanText = text.trim();
  const cmd = cleanText.toLowerCase().split(/\s+/)[0];
  const handler = commandMap.get(cmd);
  if (!handler) return false;

  const reply = (content) => sock.sendMessage(from, content, { quoted: msg });
  await handler({ sock, from, sender, cleanText, msg, reply });
  return true;
}

export { checkTriviaAnswer };
ECOEOF
echo Creando index.js...
cat > index.js << IDXEOF
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import pino from "pino";
import http from "http";
import { handleEconomyCommand, checkTriviaAnswer } from "./economia.js";

const PHONE_NUMBER = "529616050619";

let currentCode = "Todavia no generado, esperando...";
let codeTime = null;
let pairingRequested = false;

const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    const segundos = codeTime ? Math.floor((Date.now() - codeTime) / 1000) : null;
    res.end(`
      <html>
        <head><meta http-equiv="refresh" content="3"></head>
        <body style="font-family:sans-serif;text-align:center;margin-top:50px;">
          <h1>Codigo de vinculacion</h1>
          <h2 style="font-size:48px;letter-spacing:5px;">${currentCode}</h2>
          ${segundos !== null ? `<p>Generado hace ${segundos} segundos</p>` : ""}
        </body>
      </html>
    `);
  })
  .listen(PORT, () => console.log("Servidor web escuchando en el puerto " + PORT));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version: version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    keepAliveIntervalMs: 10000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000
  });

  console.log("Intentando conectar con WhatsApp...");

  sock.ev.on("connection.update", async (update) => {
    const connection = update.connection;
    const lastDisconnect = update.lastDisconnect;
    const qr = update.qr;

    if (connection) {
      console.log("Estado de conexion: " + connection);
    }

    if (qr && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;
      try {
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        currentCode = code;
        codeTime = Date.now();
        console.log("CODIGO GENERADO: " + code);
      } catch (e) {
        console.log("Error pidiendo el codigo: " + e.message);
        pairingRequested = false;
      }
    }

    if (connection === "close") {
      const statusCode = lastDisconnect && lastDisconnect.error && lastDisconnect.error.output
        ? lastDisconnect.error.output.statusCode
        : "sin codigo";
      console.log("Conexion cerrada. Codigo: " + statusCode);
      pairingRequested = false;
      setTimeout(startBot, 10000);
    } else if (connection === "open") {
      currentCode = "CONECTADO";
      console.log("Bot conectado a WhatsApp");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const text = (
      msg.message.conversation ||
      (msg.message.extendedTextMessage ? msg.message.extendedTextMessage.text : "") ||
      (msg.message.imageMessage ? msg.message.imageMessage.caption : "") ||
      ""
    ).trim();

    if (text.startsWith(".")) {
      await handleEconomyCommand(sock, from, sender, text, msg);
    } else {
      await checkTriviaAnswer(sock, from, sender, text, msg);
    }
  });
}

startBot();
IDXEOF
echo Creando commands/banco.js...
cat > commands/banco.js << CMDEOF_banco_js
import { getAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".banco", ".bal", ".bank"],
  desc: "Ver tu saldo o el de alguien mencionado",
  category: "Economía",
  usage: ".banco [@usuario]",
  handler: async ({ sender, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const target = (mentioned && mentioned[0]) || sender;
    const acc = getAccount(target);
    const total = acc.wallet + acc.bank;
    await reply({
      text: box("BANCO DE ›› @" + target.split("@")[0], [
        `💰 EN MANO  ›› *${acc.wallet} ${CURRENCY}*`,
        `🏦 EN BANCO  ›› *${acc.bank} ${CURRENCY}*`,
        `📊 TOTAL  ›› *${total} ${CURRENCY}*`
      ]),
      mentions: [target]
    });
  }
};
CMDEOF_banco_js
echo Creando commands/cofre.js...
cat > commands/cofre.js << CMDEOF_cofre_js
import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".cofre", ".tesoro"],
  desc: "Cofre misterioso, cada 12 horas",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "cofre", 12 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya abriste un cofre. Esperá *${formatTime(wait)}*.` });
    const esRaro = Math.random() < 0.15;
    const gano = esRaro
      ? Math.floor(Math.random() * 500) + 500
      : Math.floor(Math.random() * 150) + 80;
    addToWallet(sender, gano);
    const texto = esRaro ? "✨ ¡Encontraste un cofre LEGENDARIO!" : "📦 Abriste un cofre y encontraste monedas...";
    await reply({ text: box("¡COFRE ABIERTO!", [texto, `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
};
CMDEOF_cofre_js
echo Creando commands/crimen.js...
cat > commands/crimen.js << CMDEOF_crimen_js
import { workCommand } from "../core.js";

export default {
  names: [".crimen", ".crime"],
  desc: "Ganancia alta, riesgo de multa (cada 3 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "crimen",
    cooldownMs: 3 * 60 * 60 * 1000,
    minReward: 150,
    maxReward: 400,
    riesgo: { chanceFallo: 0.4, minPerdida: 50, maxPerdida: 150 },
    frases: {
      titulo: "¡CRIMEN EXITOSO!",
      tituloFallo: "¡TE ATRAPARON!",
      exito: [
        "🕵️ Asaltaste una tienda y te escapaste sin ser visto, ganando",
        "💰 Le robaste la cartera a un rico y sacaste",
        "🚪 Entraste a robar una casa y te llevaste"
      ],
      fallo: [
        "🚔 La policía te agarró con las manos en la masa y pagaste una multa de",
        "👮 Te delataron y tuviste que pagar una fianza de",
        "🚨 Sonó la alarma y perdiste parte del botín, un total de"
      ]
    }
  })
};
CMDEOF_crimen_js
echo Creando commands/daily.js...
cat > commands/daily.js << CMDEOF_daily_js
import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".daily", ".diario"],
  desc: "Recompensa gratis cada 24 horas",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "daily", 24 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya reclamaste tu diario. Volvé en *${formatTime(wait)}*.` });
    const gano = Math.floor(Math.random() * 200) + 300;
    addToWallet(sender, gano);
    await reply({ text: box("¡RECOMPENSA DIARIA!", ["🎁 Reclamaste tu regalo del día...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
};
CMDEOF_daily_js
echo Creando commands/depositar.js...
cat > commands/depositar.js << CMDEOF_depositar_js
import { getAccount, saveAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".depositar"],
  desc: "Guardar plata de tu mano al banco",
  category: "Economía",
  usage: ".depositar <cantidad|todo>",
  handler: async ({ sender, cleanText, reply }) => {
    const acc = getAccount(sender);
    const arg = cleanText.split(/\s+/)[1];
    const amount = arg === "todo" ? acc.wallet : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.wallet) {
      return reply({ text: `⚙️ Uso: .depositar <cantidad|todo>\n💰 En mano: ${acc.wallet} ${CURRENCY}` });
    }
    acc.wallet -= amount;
    acc.bank += amount;
    await saveAccount(sender);
    await reply({
      text: box("¡DEPÓSITO REALIZADO!", [
        `🪙 DEPOSITASTE  ›› *${amount} ${CURRENCY}*`,
        `💰 EN MANO  ›› *${acc.wallet} ${CURRENCY}*`,
        `🏦 EN BANCO  ›› *${acc.bank} ${CURRENCY}*`
      ])
    });
  }
};
CMDEOF_depositar_js
echo Creando commands/espiar.js...
cat > commands/espiar.js << CMDEOF_espiar_js
import { workCommand } from "../core.js";

export default {
  names: [".espiar", ".espia"],
  desc: "Espionaje, riesgo de que te descubran (cada 5 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "espiar",
    cooldownMs: 5 * 60 * 60 * 1000,
    minReward: 150,
    maxReward: 320,
    riesgo: { chanceFallo: 0.35, minPerdida: 40, maxPerdida: 120 },
    frases: {
      titulo: "¡ESPIONAJE EXITOSO!",
      tituloFallo: "¡TE DESCUBRIERON ESPIANDO!",
      exito: [
        "🕶️ Conseguiste información valiosa y la vendiste por",
        "📷 Sacaste fotos comprometedoras y cobraste",
        "🔍 Vendiste secretos de la competencia por"
      ],
      fallo: [
        "😳 Te encontraron espiando y tuviste que pagar para que no dijeran nada:",
        "🚫 Te descubrieron y perdiste el equipo de espionaje, valuado en"
      ]
    }
  })
};
CMDEOF_espiar_js
echo Creando commands/explorar.js...
cat > commands/explorar.js << CMDEOF_explorar_js
import { workCommand } from "../core.js";

export default {
  names: [".explorar", ".investigar"],
  desc: "Exploración, ganancia media-alta (cada 4 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "explorar",
    cooldownMs: 4 * 60 * 60 * 1000,
    minReward: 180,
    maxReward: 350,
    frases: {
      titulo: "¡EXPLORACIÓN COMPLETADA!",
      exito: [
        "🗺️ Encontraste ruinas antiguas con objetos de valor y sacaste",
        "🔦 Investigaste una cueva olvidada y hallaste",
        "🧭 Descubriste un mapa del tesoro y lo vendiste por"
      ]
    }
  })
};
CMDEOF_explorar_js
echo Creando commands/influencer.js...
cat > commands/influencer.js << CMDEOF_influencer_js
import { workCommand } from "../core.js";

export default {
  names: [".influencer", ".tiktoker"],
  desc: "Contenido viral, buena ganancia con riesgo de flop (cada 8 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "influencer",
    cooldownMs: 8 * 60 * 60 * 1000,
    minReward: 200,
    maxReward: 500,
    riesgo: { chanceFallo: 0.3, minPerdida: 20, maxPerdida: 60 },
    frases: {
      titulo: "¡VIDEO VIRAL!",
      tituloFallo: "¡EL VIDEO FUE UN FLOP!",
      exito: [
        "📱 Tu video se volvió viral y ganaste por publicidad",
        "🔥 Conseguiste miles de seguidores nuevos y cobraste",
        "✨ Una marca te pagó por promocionar su producto:"
      ],
      fallo: [
        "📉 Nadie vio tu contenido y perdiste plata en producción:",
        "😬 Te cancelaron en redes y perdiste patrocinios, un total de"
      ]
    }
  })
};
CMDEOF_influencer_js
echo Creando commands/mazmorra.js...
cat > commands/mazmorra.js << CMDEOF_mazmorra_js
import { workCommand } from "../core.js";

export default {
  names: [".mazmorra", ".castillo"],
  desc: "Máximo riesgo, máxima recompensa (cada 6 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "mazmorra",
    cooldownMs: 6 * 60 * 60 * 1000,
    minReward: 400,
    maxReward: 900,
    riesgo: { chanceFallo: 0.55, perdidaTotal: true },
    frases: {
      titulo: "¡MAZMORRA SUPERADA!",
      tituloFallo: "¡CAÍSTE EN LA MAZMORRA!",
      exito: [
        "⚔️ Derrotaste al jefe final del castillo y te llevaste",
        "🏰 Saqueaste el tesoro real y ganaste",
        "🛡️ Sobreviviste a la mazmorra maldita con un botín de"
      ],
      fallo: [
        "💀 Perdiste todo lo que llevabas en mano, un total de",
        "☠️ Te emboscaron dentro del castillo y perdiste"
      ]
    }
  })
};
CMDEOF_mazmorra_js
echo Creando commands/menu.js...
cat > commands/menu.js << CMDEOF_menu_js
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
      "Utilidad": ["⚙️", "🛠️"]
    };

    const accounts = getAllAccounts();
    let texto = `「✦」 *¡Hola!* @${sender.split("@")[0]} . *Soy* 『 *${config.botNameLong}* 』 *, aquí tienes la lista de comandos (๑•ᴗ•๑).*\n\n`;
    texto += "╔┅┉✦┉┅✦┅┉✦┉┅✦┉┅┅❥⧽\n";
    texto += `║. .┊⩩﹕ *OWNER »* ${config.ownerName}\n`;
    texto += `║. .┊⩩﹕ *BOT NAME »* 『 *${config.botNameShort}* 』\n`;
    texto += "║. .┊⩩﹕ *TYPE »* Multi-Device\n";
    texto += "║. .┊⩩﹕ *VERSION »* 1.0.0\n";
    texto += "║. .┊⩩﹕ *SISTEMA »* Node.js\n";
    texto += `║. .┊⩩﹕ *UPTIME »* ${formatUptime()}\n`;
    texto += `║. .┊⩩﹕ *USERS »* ${accounts.size}\n`;
    texto += "╚┅┉✦┉┅✦┅┉✦┉┅✦┉┅┅❥⧽\n\n";

    const ordenCategorias = ["General", "Utilidad", "Economía", "Trabajos"];
    for (const cat of ordenCategorias) {
      if (!categorias[cat]) continue;
      const [i1, i2] = iconos[cat] || ["📌", "•"];
      texto += `${i1} » ˚୨•(${i2})• ⊹  \`⧼⧼ ${cat.toUpperCase()} ⧽⧽\`⊹\n`;
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
CMDEOF_menu_js
echo Creando commands/migajear.js...
cat > commands/migajear.js << CMDEOF_migajear_js
import { workCommand } from "../core.js";

export default {
  names: [".migajear", ".limosna", ".ayudas"],
  desc: "Pedir ayudas, ganancia mínima pero rápida (cada 3 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "migajear",
    cooldownMs: 3 * 60 * 60 * 1000,
    minReward: 10,
    maxReward: 45,
    frases: {
      titulo: "MIGAJAS DEL DÍA",
      exito: [
        "🙏 Pediste ayuda en la calle y te dieron",
        "🥺 Alguien se compadeció de vos y te regaló",
        "🤲 Recolectaste algunas monedas sueltas, un total de"
      ]
    }
  })
};
CMDEOF_migajear_js
echo Creando commands/minar.js...
cat > commands/minar.js << CMDEOF_minar_js
import { workCommand } from "../core.js";

export default {
  names: [".minar", ".mine"],
  desc: "Minería, ganancia media (cada 2 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "minar",
    cooldownMs: 2 * 60 * 60 * 1000,
    minReward: 100,
    maxReward: 250,
    frases: {
      titulo: "¡A LA MINA!",
      exito: [
        "⛏️ Encontraste una veta de minerales valiosos y sacaste",
        "💎 Hallaste piedras preciosas en la mina y vendiste por",
        "🪨 Extrajiste carbón y metales, ganando"
      ]
    }
  })
};
CMDEOF_minar_js
echo Creando commands/ping.js...
cat > commands/ping.js << CMDEOF_ping_js
export default {
  names: [".p", ".ping"],
  desc: "Ver si el bot esta activo",
  category: "General",
  handler: async ({ sock, from, msg }) => {
    const inicio = Date.now();
    await sock.sendMessage(from, { text: "🏓 Pong..." }, { quoted: msg });
    const ms = Date.now() - inicio;
    await sock.sendMessage(from, { text: `🏓 Pong! *${ms}ms*` }, { quoted: msg });
  }
};
CMDEOF_ping_js
echo Creando commands/retirar.js...
cat > commands/retirar.js << CMDEOF_retirar_js
import { getAccount, saveAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".retirar"],
  desc: "Sacar plata del banco a tu mano",
  category: "Economía",
  usage: ".retirar <cantidad|todo>",
  handler: async ({ sender, cleanText, reply }) => {
    const acc = getAccount(sender);
    const arg = cleanText.split(/\s+/)[1];
    const amount = arg === "todo" ? acc.bank : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.bank) {
      return reply({ text: `⚙️ Uso: .retirar <cantidad|todo>\n🏦 En banco: ${acc.bank} ${CURRENCY}` });
    }
    acc.bank -= amount;
    acc.wallet += amount;
    await saveAccount(sender);
    await reply({
      text: box("¡RETIRO REALIZADO!", [
        `🪙 RETIRASTE  ›› *${amount} ${CURRENCY}*`,
        `💰 EN MANO  ›› *${acc.wallet} ${CURRENCY}*`,
        `🏦 EN BANCO  ›› *${acc.bank} ${CURRENCY}*`
      ])
    });
  }
};
CMDEOF_retirar_js
echo Creando commands/semanal.js...
cat > commands/semanal.js << CMDEOF_semanal_js
import { addToWallet, checkCooldown, formatTime, box, CURRENCY } from "../core.js";

export default {
  names: [".semanal", ".semanales"],
  desc: "Recompensa gratis cada 7 días",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "semanal", 7 * 24 * 60 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya reclamaste tu semanal. Volvé en *${formatTime(wait)}*.` });
    const gano = Math.floor(Math.random() * 800) + 1200;
    addToWallet(sender, gano);
    await reply({ text: box("¡RECOMPENSA SEMANAL!", ["🎉 Reclamaste tu regalo de la semana...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
};
CMDEOF_semanal_js
echo Creando commands/setfoto.js...
cat > commands/setfoto.js << CMDEOF_setfoto_js
import fs from "fs";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import { FOTO_PATH } from "../core.js";

export default {
  names: [".setfoto"],
  desc: "Cambiar la foto de perfil del bot (con foto adjunta, o respondiendo a una)",
  category: "Utilidad",
  usage: ".setfoto (con foto adjunta, o respondiendo a una)",
  handler: async ({ sock, from, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage;
    const quotedImg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    let targetMsg = null;
    if (imgMsg) {
      targetMsg = msg;
    } else if (quotedImg) {
      const ctx = msg.message.extendedTextMessage.contextInfo;
      targetMsg = {
        key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant },
        message: ctx.quotedMessage
      };
    }

    if (!targetMsg) {
      await reply({ text: "⚙️ Mandá una imagen con *.setfoto* de caption, o respondé a una foto ya enviada con *.setfoto*." });
      return;
    }

    try {
      const buffer = await downloadMediaMessage(targetMsg, "buffer", {});
      fs.writeFileSync(FOTO_PATH, buffer);
      await sock.updateProfilePicture(sock.user.id, buffer);
      await reply({ text: "✅ Foto de perfil actualizada. También se va a usar como imagen del .menu." });
    } catch (e) {
      await reply({ text: "❌ Error cambiando la foto: " + e.message });
    }
  }
};
CMDEOF_setfoto_js
echo Creando commands/setnombre.js...
cat > commands/setnombre.js << CMDEOF_setnombre_js
import { config, saveConfig } from "../core.js";

export default {
  names: [".setnombre"],
  desc: "Cambiar el nombre del bot (corto para BOT NAME, largo para el saludo)",
  category: "Utilidad",
  usage: ".setnombre <corto> | <largo>",
  handler: async ({ cleanText, reply }) => {
    const resto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!resto) return reply({ text: "⚙️ Uso: .setnombre <nombre corto> | <nombre largo>\nEjemplo: .setnombre Asta | Asta Bot Oficial" });
    const [corto, largo] = resto.split("|").map(s => s && s.trim());
    config.botNameShort = corto || config.botNameShort;
    config.botNameLong = largo || corto || config.botNameLong;
    await saveConfig();
    await reply({ text: `✅ Nombre corto: *${config.botNameShort}*\n✅ Nombre largo: *${config.botNameLong}*` });
  }
};
CMDEOF_setnombre_js
echo Creando commands/setowner.js...
cat > commands/setowner.js << CMDEOF_setowner_js
import { config, saveConfig } from "../core.js";

export default {
  names: [".setowner"],
  desc: "Cambiar el nombre del dueño que muestra el menú",
  category: "Utilidad",
  usage: ".setowner <nombre>",
  handler: async ({ cleanText, reply }) => {
    const nuevo = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!nuevo) return reply({ text: "⚙️ Uso: .setowner <nombre>" });
    config.ownerName = nuevo;
    await saveConfig();
    await reply({ text: `✅ Owner cambiado a: *${nuevo}*` });
  }
};
CMDEOF_setowner_js
echo Creando commands/superalbanil.js...
cat > commands/superalbanil.js << CMDEOF_superalbanil_js
import { workCommand } from "../core.js";

export default {
  names: [".superalbañil", ".albañil"],
  desc: "Construcción pesada, la mejor paga (cada 10 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "superalbanil",
    cooldownMs: 10 * 60 * 60 * 1000,
    minReward: 500,
    maxReward: 1100,
    frases: {
      titulo: "¡OBRA TERMINADA!",
      exito: [
        "🧱 Levantaste un edificio entero vos solo y cobraste",
        "🏗️ Terminaste una construcción pesada y te pagaron",
        "🔨 Hiciste de albañil, plomero y electricista en la misma obra, ganando"
      ]
    }
  })
};
CMDEOF_superalbanil_js
echo Creando commands/top.js...
cat > commands/top.js << CMDEOF_top_js
import { getAllAccounts, box, CURRENCY } from "../core.js";

export default {
  names: [".top", ".baltop"],
  desc: "Ranking de los que más ¥enes tienen",
  category: "Economía",
  handler: async ({ reply }) => {
    const accounts = getAllAccounts();
    const lista = Array.from(accounts.entries())
      .map(([jid, acc]) => ({ jid, total: acc.wallet + acc.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    if (lista.length === 0) return reply({ text: "⚙️ Todavía nadie tiene ¥enes registrados." });
    const medallas = ["🥇", "🥈", "🥉"];
    const lineas = lista.map((u, i) => `${medallas[i] || `${i + 1}.`} @${u.jid.split("@")[0]}  ›› *${u.total} ${CURRENCY}*`);
    await reply({ text: box("TOP RICOS ›› ¥enes", lineas), mentions: lista.map(u => u.jid) });
  }
};
CMDEOF_top_js
echo Creando commands/trabajar.js...
cat > commands/trabajar.js << CMDEOF_trabajar_js
import { workCommand } from "../core.js";

export default {
  names: [".trabajar", ".w", ".work"],
  desc: "Trabajo tranquilo, sin riesgo (cada 1 hora)",
  category: "Trabajos",
  handler: workCommand({
    key: "trabajar",
    cooldownMs: 60 * 60 * 1000, // 1 hora
    minReward: 40,
    maxReward: 120,
    frases: {
      titulo: "¡A TRABAJAR!",
      exito: [
        "☕ Trabajaste de ayudante en una cafetería lo cual te generó",
        "📦 Hiciste entregas para una tienda y ganaste",
        "🧹 Limpiaste oficinas después de tu turno y ganaste",
        "🐕 Paseaste perros del vecindario y ganaste"
      ]
    }
  })
};
CMDEOF_trabajar_js
echo Creando commands/transferir.js...
cat > commands/transferir.js << CMDEOF_transferir_js
import { getAccount, saveAccount, box, CURRENCY } from "../core.js";

export default {
  names: [".transferir", ".pagar"],
  desc: "Mandarle plata a otro usuario",
  category: "Economía",
  usage: ".transferir <cantidad> @usuario",
  handler: async ({ sender, cleanText, msg, reply }) => {
    const acc = getAccount(sender);
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const destino = mentioned && mentioned[0];
    if (!destino) return reply({ text: "⚙️ Uso: .transferir <cantidad> @usuario\nTenés que etiquetar a la persona." });
    if (destino === sender) return reply({ text: "❌ No podés transferirte plata a vos mismo." });
    const amount = parseInt(cleanText.split(/\s+/)[1], 10);
    if (!amount || amount <= 0 || amount > acc.wallet) {
      return reply({ text: `⚙️ Uso: .transferir <cantidad> @usuario\n💰 En mano: ${acc.wallet} ${CURRENCY}` });
    }
    const destAcc = getAccount(destino);
    acc.wallet -= amount;
    destAcc.wallet += amount;
    await saveAccount(sender);
    await saveAccount(destino);
    await reply({
      text: box("¡TRANSFERENCIA REALIZADA!", [
        `👤 DE  ›› @${sender.split("@")[0]}`,
        `👤 PARA  ›› @${destino.split("@")[0]}`,
        `🪙 MONTO  ›› *${amount} ${CURRENCY}*`
      ]),
      mentions: [sender, destino]
    });
  }
};
CMDEOF_transferir_js
echo Creando commands/trivia.js...
cat > commands/trivia.js << CMDEOF_trivia_js
import { setPendingTrivia, checkCooldown, formatTime, box } from "../core.js";

const preguntas = [
  { q: "¿Cuál es el planeta más grande del sistema solar?", opciones: ["Marte", "Júpiter", "Saturno", "Tierra"], correcta: "B" },
  { q: "¿En qué año llegó el hombre a la Luna?", opciones: ["1965", "1969", "1972", "1959"], correcta: "B" },
  { q: "¿Cuál es el océano más grande del mundo?", opciones: ["Atlántico", "Índico", "Pacífico", "Ártico"], correcta: "C" },
  { q: "¿Cuántos huesos tiene el cuerpo humano adulto?", opciones: ["186", "206", "220", "250"], correcta: "B" },
  { q: "¿Qué gas respiramos principalmente para vivir?", opciones: ["Oxígeno", "Hidrógeno", "Nitrógeno", "Dióxido de carbono"], correcta: "A" },
  { q: "¿Cuál es el país más grande del mundo por territorio?", opciones: ["China", "Canadá", "Rusia", "Brasil"], correcta: "C" }
];

export default {
  names: [".trivia", ".encuesta"],
  desc: "Responde correctamente y ganá plata (30 seg para responder)",
  category: "Economía",
  handler: async ({ sock, from, sender, msg, reply }) => {
    const wait = checkCooldown(sender, "trivia", 5 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya hiciste una trivia. Esperá *${formatTime(wait)}*.` });

    const pregunta = preguntas[Math.floor(Math.random() * preguntas.length)];
    const reward = Math.floor(Math.random() * 100) + 100;
    const letras = ["A", "B", "C", "D"];

    setPendingTrivia(sender, {
      correcta: pregunta.correcta,
      reward,
      expira: Date.now() + 30 * 1000
    });

    const lineas = pregunta.opciones.map((op, i) => `${letras[i]}. ${op}`);
    lineas.push("");
    lineas.push("Respondé con la letra (A, B, C o D). Tenés 30 segundos.");

    await reply({ text: box("🧠 TRIVIA — " + pregunta.q, lineas) });
  }
};
CMDEOF_trivia_js
echo Creando commands/vendedor.js...
cat > commands/vendedor.js << CMDEOF_vendedor_js
import { workCommand } from "../core.js";

export default {
  names: [".vendedor", ".ambulante"],
  desc: "Ventas ambulantes, ganancia chica pero segura (cada 2 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "vendedor",
    cooldownMs: 2 * 60 * 60 * 1000,
    minReward: 60,
    maxReward: 150,
    frases: {
      titulo: "¡VENTA DEL DÍA!",
      exito: [
        "🌭 Vendiste hot dogs en la esquina y ganaste",
        "🍦 Vendiste helados en el parque y sacaste",
        "🧢 Vendiste gorras y accesorios en el semáforo, ganando"
      ]
    }
  })
};
CMDEOF_vendedor_js
echo Creando commands/youtuber.js...
cat > commands/youtuber.js << CMDEOF_youtuber_js
import { workCommand } from "../core.js";

export default {
  names: [".youtuber", ".cc"],
  desc: "Contenido en YouTube, buena ganancia (cada 8 horas)",
  category: "Trabajos",
  handler: workCommand({
    key: "youtuber",
    cooldownMs: 8 * 60 * 60 * 1000,
    minReward: 220,
    maxReward: 520,
    riesgo: { chanceFallo: 0.25, minPerdida: 30, maxPerdida: 70 },
    frases: {
      titulo: "¡MONETIZACIÓN ACTIVADA!",
      tituloFallo: "¡YOUTUBE TE DESMONETIZÓ!",
      exito: [
        "🎥 Subiste un video que pegó fuerte y ganaste por anuncios",
        "🎬 Tu canal creció bastante esta semana, cobraste",
        "🖥️ Conseguiste un sponsor para tu contenido:"
      ],
      fallo: [
        "⚠️ Youtube desmonetizó tu video y perdiste",
        "🚫 Te llegó un copyright strike y perdiste ingresos por"
      ]
    }
  })
};
CMDEOF_youtuber_js
echo TODOS LOS ARCHIVOS CREADOS. Corriendo npm install...
npm install
echo LISTO. Ahora corre: node index.js

import { MongoClient } from "mongodb";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
import fs from "fs";

const CURRENCY = "¥enes";
const MONGO_URI = "mongodb+srv://jg0455748_db_user:2IBhQ33NazDOoBjg@cluster0.27mrbg5.mongodb.net/?appName=Cluster0";
const FOTO_PATH = "./botpic.jpg";
const startTime = Date.now();

const accounts = new Map();
const cooldowns = new Map();
let collection = null;
let configCollection = null;

let config = {
  botName: "𝕬𝖘𝖙𝖆",
  ownerName: "Sin definir"
};

async function connectDB(intentos = 5) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db("whatsappbot");
      collection = db.collection("accounts");
      configCollection = db.collection("config");
      console.log("Conectado a MongoDB");

      const docs = await collection.find({}).toArray();
      for (const doc of docs) accounts.set(doc._id, { wallet: doc.wallet, bank: doc.bank });
      console.log(`Datos cargados desde MongoDB: ${accounts.size} cuentas`);

      const cfgDoc = await configCollection.findOne({ _id: "bot" });
      if (cfgDoc) config = { ...config, ...cfgDoc };
      return;
    } catch (e) {
      console.log(`Intento ${i}/${intentos} fallo: ${e.message}`);
      if (i < intentos) await new Promise(r => setTimeout(r, 4000));
    }
  }
  console.log("No se pudo conectar a MongoDB tras varios intentos.");
}
connectDB();

async function saveAccount(sender) {
  if (!collection) return;
  const acc = getAccount(sender);
  try {
    await collection.updateOne({ _id: sender }, { $set: { wallet: acc.wallet, bank: acc.bank } }, { upsert: true });
  } catch (e) {
    console.log("Error guardando en MongoDB: " + e.message);
  }
}

async function saveConfig() {
  if (!configCollection) return;
  try {
    await configCollection.updateOne({ _id: "bot" }, { $set: config }, { upsert: true });
  } catch (e) {
    console.log("Error guardando config: " + e.message);
  }
}

function getAccount(sender) {
  if (!accounts.has(sender)) accounts.set(sender, { wallet: 0, bank: 0 });
  return accounts.get(sender);
}

function addToWallet(sender, amount) {
  const acc = getAccount(sender);
  acc.wallet += amount;
  saveAccount(sender);
  return acc;
}

function checkCooldown(sender, comando, ms) {
  const userCooldowns = cooldowns.get(sender) || {};
  const last = userCooldowns[comando] || 0;
  const now = Date.now();
  const remaining = last + ms - now;
  if (remaining > 0) return remaining;
  userCooldowns[comando] = now;
  cooldowns.set(sender, userCooldowns);
  return 0;
}

function formatTime(ms) {
  const seg = Math.ceil(ms / 1000);
  const min = Math.floor(seg / 60);
  const segRestantes = seg % 60;
  return min > 0 ? `${min}m ${segRestantes}s` : `${segRestantes}s`;
}

function formatUptime() {
  const seg = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return `${h}h ${m}m ${s}s`;
}

function box(titulo, lineas) {
  return [
    "╔╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦╼⧽⧽",
    `┋✿ *${titulo}*`,
    "┋",
    ...lineas.map(l => `┋ ${l}`),
    "┋",
    "╰╼┉✦┉╍✦┉╍✦┉╍✦┉╍✦┉╼⧽⧽"
  ].join("\n");
}

// ============ SISTEMA DE REGISTRO AUTOMATICO DE COMANDOS ============
const commands = new Map();
function registerCommand(name, { desc, category, usage, handler }) {
  commands.set(name, { desc, category, usage: usage || name, handler });
}

// ============ COMANDOS GENERAL ============

registerCommand(".p", {
  desc: "Ver si el bot esta activo",
  category: "General",
  handler: async ({ sock, from, msg }) => {
    const inicio = Date.now();
    await sock.sendMessage(from, { text: "🏓 Pong..." }, { quoted: msg });
    const ms = Date.now() - inicio;
    await sock.sendMessage(from, { text: `🏓 Pong! *${ms}ms*` }, { quoted: msg });
  }
});
commands.set(".ping", commands.get(".p"));

registerCommand(".menu", {
  desc: "Ver todos los comandos disponibles",
  category: "General",
  handler: async ({ sock, from, sender, msg }) => {
    const categorias = {};
    const vistos = new Set();
    for (const [, info] of commands) {
      if (vistos.has(info)) continue;
      vistos.add(info);
      if (!categorias[info.category]) categorias[info.category] = [];
      categorias[info.category].push(`▸ *${info.usage}* — ${info.desc}`);
    }

    const iconos = {
      "General": ["🍭", "🌟"],
      "Economía": ["🪙", "💰"],
      "Trabajos": ["🛠️", "⚙️"],
      "Utilidad": ["⚙️", "🛠️"]
    };

    let texto = `「✦」*¡Hola!* @${sender.split("@")[0]}. *Soy* 『${config.botName}』*, aquí tienes la lista de comandos (๑•ᴗ•๑).*\n\n`;
    texto += "╔┅┉✦┉┅✦┅┉✦┉┅✦┉┅┅❥⧽\n";
    texto += `║. .┊⩩﹕*OWNER »* ${config.ownerName}\n`;
    texto += `║. .┊⩩﹕*BOT NAME »* 『${config.botName}』\n`;
    texto += "║. .┊⩩﹕*TYPE »* Multi-Device\n";
    texto += "║. .┊⩩﹕*VERSION »* 1.0.0\n";
    texto += "║. .┊⩩﹕*SISTEMA »* Node.js\n";
    texto += `║. .┊⩩﹕*UPTIME »* ${formatUptime()}\n`;
    texto += `║. .┊⩩﹕*USERS »* ${accounts.size}\n`;
    texto += "╚┅┉✦┉┅✦┅┉✦┉┅✦┉┅┅❥⧽\n\n";

    for (const [cat, items] of Object.entries(categorias)) {
      const [i1, i2] = iconos[cat] || ["📌", "•"];
      texto += `${i1} » ˚୨•(${i2})• ⊹  \`⧼⧼ ${cat.toUpperCase()} ⧽⧽\`⊹\n`;
      texto += items.join("\n") + "\n\n";
    }

    let imageBuffer = null;
    if (fs.existsSync(FOTO_PATH)) {
      imageBuffer = fs.readFileSync(FOTO_PATH);
    }

    if (imageBuffer) {
      await sock.sendMessage(from, { image: imageBuffer, caption: texto.trim(), mentions: [sender] }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: texto.trim(), mentions: [sender] }, { quoted: msg });
    }
  }
});
commands.set(".help", commands.get(".menu"));

// ============ COMANDOS UTILIDAD (config del bot) ============

registerCommand(".setnombre", {
  desc: "Cambiar el nombre que muestra el bot en el menú",
  category: "Utilidad",
  usage: ".setnombre <nombre nuevo>",
  handler: async ({ cleanText, reply }) => {
    const nuevoNombre = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!nuevoNombre) return reply({ text: "⚙️ Uso: .setnombre <nombre nuevo>" });
    config.botName = nuevoNombre;
    await saveConfig();
    await reply({ text: `✅ Nombre del bot cambiado a: *${nuevoNombre}*` });
  }
});

registerCommand(".setowner", {
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
});

registerCommand(".setfoto", {
  desc: "Cambiar la foto de perfil del bot (mandala junto con este comando de caption)",
  category: "Utilidad",
  usage: ".setfoto (mandando una imagen con este texto de caption)",
  handler: async ({ sock, msg, reply }) => {
    const imgMsg = msg.message?.imageMessage;
    if (!imgMsg) {
      await reply({ text: "⚙️ Mandá una imagen con *.setfoto* como descripción (caption) de la foto." });
      return;
    }
    try {
      const buffer = await downloadMediaMessage(msg, "buffer", {});
      fs.writeFileSync(FOTO_PATH, buffer);
      await sock.updateProfilePicture(sock.user.id, buffer);
      await reply({ text: "✅ Foto de perfil actualizada. También se va a usar como imagen del .menu." });
    } catch (e) {
      await reply({ text: "❌ Error cambiando la foto: " + e.message });
    }
  }
});

// ============ COMANDOS ECONOMÍA ============

registerCommand(".banco", {
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
});

registerCommand(".depositar", {
  desc: "Guardar plata de tu mano al banco",
  category: "Economía",
  usage: ".depositar <cantidad|todo>",
  handler: async ({ sender, cleanText, reply }) => {
    const acc = getAccount(sender);
    const arg = cleanText.split(/\s+/)[1];
    const amount = arg === "todo" ? acc.wallet : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.wallet) {
      await reply({ text: `⚙️ Uso: .depositar <cantidad|todo>\n💰 En mano: ${acc.wallet} ${CURRENCY}` });
      return;
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
});

registerCommand(".retirar", {
  desc: "Sacar plata del banco a tu mano",
  category: "Economía",
  usage: ".retirar <cantidad|todo>",
  handler: async ({ sender, cleanText, reply }) => {
    const acc = getAccount(sender);
    const arg = cleanText.split(/\s+/)[1];
    const amount = arg === "todo" ? acc.bank : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.bank) {
      await reply({ text: `⚙️ Uso: .retirar <cantidad|todo>\n🏦 En banco: ${acc.bank} ${CURRENCY}` });
      return;
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
});

registerCommand(".transferir", {
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
});
commands.set(".pagar", commands.get(".transferir"));

registerCommand(".top", {
  desc: "Ranking de los que más ¥enes tienen",
  category: "Economía",
  handler: async ({ reply }) => {
    const lista = Array.from(accounts.entries())
      .map(([jid, acc]) => ({ jid, total: acc.wallet + acc.bank }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    if (lista.length === 0) return reply({ text: "⚙️ Todavía nadie tiene ¥enes registrados." });
    const medallas = ["🥇", "🥈", "🥉"];
    const lineas = lista.map((u, i) => `${medallas[i] || `${i + 1}.`} @${u.jid.split("@")[0]}  ›› *${u.total} ${CURRENCY}*`);
    await reply({ text: box("TOP RICOS ›› ¥enes", lineas), mentions: lista.map(u => u.jid) });
  }
});
commands.set(".baltop", commands.get(".top"));

// ============ COMANDOS TRABAJOS ============

registerCommand(".trabajar", {
  desc: "Ganancia chica, sin riesgo (30s)",
  category: "Trabajos",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "trabajar", 30 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya trabajaste. Esperá ${formatTime(wait)}.` });
    const gano = Math.floor(Math.random() * 50) + 30;
    addToWallet(sender, gano);
    await reply({ text: box("¡A TRABAJAR!", ["👷 Cortaste leña en el bosque...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
});

registerCommand(".minar", {
  desc: "Ganancia media, sin riesgo (60s)",
  category: "Trabajos",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "minar", 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya minaste. Esperá ${formatTime(wait)}.` });
    const gano = Math.floor(Math.random() * 100) + 60;
    addToWallet(sender, gano);
    await reply({ text: box("¡A LA MINA!", ["⛏️ Encontraste minerales valiosos...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
  }
});

registerCommand(".crimen", {
  desc: "Ganancia alta, con riesgo de multa (90s)",
  category: "Trabajos",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "crimen", 90 * 1000);
    if (wait > 0) return reply({ text: `⏳ Andá con cuidado. Esperá ${formatTime(wait)}.` });
    const exito = Math.random() < 0.6;
    const acc = getAccount(sender);
    if (exito) {
      const gano = Math.floor(Math.random() * 200) + 100;
      addToWallet(sender, gano);
      await reply({ text: box("¡CRIMEN EXITOSO!", ["🕵️ Te escapaste sin ser visto...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
    } else {
      const perdio = Math.min(acc.wallet, Math.floor(Math.random() * 100) + 50);
      acc.wallet -= perdio;
      await saveAccount(sender);
      await reply({ text: box("¡TE ATRAPARON!", ["🚔 La policía te encontró...", `💸 PERDISTE  ›› *${perdio} ${CURRENCY}*`]) });
    }
  }
});

registerCommand(".mazmorra", {
  desc: "Máximo riesgo, máxima recompensa (2min)",
  category: "Trabajos",
  handler: async ({ sender, reply }) => {
    const wait = checkCooldown(sender, "mazmorra", 120 * 1000);
    if (wait > 0) return reply({ text: `⏳ Necesitás descansar. Esperá ${formatTime(wait)}.` });
    const exito = Math.random() < 0.45;
    const acc = getAccount(sender);
    if (exito) {
      const gano = Math.floor(Math.random() * 400) + 200;
      addToWallet(sender, gano);
      await reply({ text: box("¡MAZMORRA SUPERADA!", ["⚔️ Derrotaste al jefe final...", `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`]) });
    } else {
      const perdio = acc.wallet;
      acc.wallet = 0;
      await saveAccount(sender);
      await reply({ text: box("¡CAÍSTE EN LA MAZMORRA!", ["💀 Perdiste todo lo que llevabas en mano...", `💸 PERDISTE  ›› *${perdio} ${CURRENCY}*`]) });
    }
  }
});

// ============ MANEJADOR PRINCIPAL ============
export async function handleEconomyCommand(sock, from, sender, text, msg) {
  const cleanText = text.trim();
  const cmd = cleanText.toLowerCase().split(/\s+/)[0];
  const entry = commands.get(cmd);
  if (!entry) return false;

  const reply = (content) => sock.sendMessage(from, content, { quoted: msg });
  await entry.handler({ sock, from, sender, cleanText, msg, reply });
  return true;
}
  

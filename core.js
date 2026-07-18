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

import { MongoClient } from "mongodb";

const CURRENCY = "¥enes";
const MONGO_URI = "mongodb+srv://jg0455748_db_user:2IBhQ33NazDOoBjg@cluster0.27mrbg5.mongodb.net/?appName=Cluster0";

const accounts = new Map(); // sender -> { wallet, bank }
const cooldowns = new Map(); // sender -> { comando: timestamp }

let collection = null;

async function connectDB(intentos = 5) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db("whatsappbot");
      collection = db.collection("accounts");
      console.log("Conectado a MongoDB");
      const docs = await collection.find({}).toArray();
      for (const doc of docs) {
        accounts.set(doc._id, { wallet: doc.wallet, bank: doc.bank });
      }
      console.log(`Datos cargados desde MongoDB: ${accounts.size} cuentas`);
      return;
    } catch (e) {
      console.log(`Intento ${i}/${intentos} fallo: ${e.message}`);
      if (i < intentos) {
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }
  console.log("No se pudo conectar a MongoDB tras varios intentos.");
  console.log("El bot seguira funcionando pero SIN guardar datos permanentes.");
}

connectDB();

async function saveAccount(sender) {
  if (!collection) return;
  const acc = getAccount(sender);
  try {
    await collection.updateOne(
      { _id: sender },
      { $set: { wallet: acc.wallet, bank: acc.bank } },
      { upsert: true }
    );
  } catch (e) {
    console.log("Error guardando en MongoDB: " + e.message);
  }
}

function getAccount(sender) {
  if (!accounts.has(sender)) {
    accounts.set(sender, { wallet: 0, bank: 0 });
  }
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

export async function handleEconomyCommand(sock, from, sender, text, msg) {
  const cmd = text.toLowerCase().split(" ")[0];
  const reply = (content) => sock.sendMessage(from, content, { quoted: msg });

  if (cmd === ".banco") {
    const acc = getAccount(sender);
    const total = acc.wallet + acc.bank;
    await reply({
      text: box("BANCO DE ›› @" + sender.split("@")[0], [
        `💰 EN MANO  ›› *${acc.wallet} ${CURRENCY}*`,
        `🏦 EN BANCO  ›› *${acc.bank} ${CURRENCY}*`,
        `📊 TOTAL  ›› *${total} ${CURRENCY}*`
      ]),
      mentions: [sender]
    });
    return true;
  }

  if (cmd === ".depositar") {
    const acc = getAccount(sender);
    const arg = text.split(" ")[1];
    const amount = arg === "todo" ? acc.wallet : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.wallet) {
      await reply({ text: `⚙️ Uso: .depositar <cantidad|todo>\n💰 En mano: ${acc.wallet} ${CURRENCY}` });
      return true;
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
    return true;
  }

  if (cmd === ".retirar") {
    const acc = getAccount(sender);
    const arg = text.split(" ")[1];
    const amount = arg === "todo" ? acc.bank : parseInt(arg, 10);
    if (!amount || amount <= 0 || amount > acc.bank) {
      await reply({ text: `⚙️ Uso: .retirar <cantidad|todo>\n🏦 En banco: ${acc.bank} ${CURRENCY}` });
      return true;
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
    return true;
  }

  if (cmd === ".trabajar") {
    const wait = checkCooldown(sender, "trabajar", 30 * 1000);
    if (wait > 0) {
      await reply({ text: `⏳ Ya trabajaste. Esperá ${formatTime(wait)}.` });
      return true;
    }
    const gano = Math.floor(Math.random() * 50) + 30;
    addToWallet(sender, gano);
    await reply({
      text: box("¡A TRABAJAR!", [
        "👷 Cortaste leña en el bosque...",
        `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`
      ])
    });
    return true;
  }

  if (cmd === ".minar") {
    const wait = checkCooldown(sender, "minar", 60 * 1000);
    if (wait > 0) {
      await reply({ text: `⏳ Ya minaste. Esperá ${formatTime(wait)}.` });
      return true;
    }
    const gano = Math.floor(Math.random() * 100) + 60;
    addToWallet(sender, gano);
    await reply({
      text: box("¡A LA MINA!", [
        "⛏️ Encontraste minerales valiosos...",
        `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`
      ])
    });
    return true;
  }

  if (cmd === ".crimen") {
    const wait = checkCooldown(sender, "crimen", 90 * 1000);
    if (wait > 0) {
      await reply({ text: `⏳ Andá con cuidado. Esperá ${formatTime(wait)}.` });
      return true;
    }
    const exito = Math.random() < 0.6;
    const acc = getAccount(sender);
    if (exito) {
      const gano = Math.floor(Math.random() * 200) + 100;
      addToWallet(sender, gano);
      await reply({
        text: box("¡CRIMEN EXITOSO!", [
          "🕵️ Te escapaste sin ser visto...",
          `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`
        ])
      });
    } else {
      const perdio = Math.min(acc.wallet, Math.floor(Math.random() * 100) + 50);
      acc.wallet -= perdio;
      await saveAccount(sender);
      await reply({
        text: box("¡TE ATRAPARON!", [
          "🚔 La policía te encontró...",
          `💸 PERDISTE  ›› *${perdio} ${CURRENCY}*`
        ])
      });
    }
    return true;
  }

  if (cmd === ".mazmorra") {
    const wait = checkCooldown(sender, "mazmorra", 120 * 1000);
    if (wait > 0) {
      await reply({ text: `⏳ Necesitás descansar. Esperá ${formatTime(wait)}.` });
      return true;
    }
    const exito = Math.random() < 0.45;
    const acc = getAccount(sender);
    if (exito) {
      const gano = Math.floor(Math.random() * 400) + 200;
      addToWallet(sender, gano);
      await reply({
        text: box("¡MAZMORRA SUPERADA!", [
          "⚔️ Derrotaste al jefe final...",
          `🪙 GANASTE  ›› *${gano} ${CURRENCY}*`
        ])
      });
    } else {
      const perdio = acc.wallet;
      acc.wallet = 0;
      await saveAccount(sender);
      await reply({
        text: box("¡CAÍSTE EN LA MAZMORRA!", [
          "💀 Perdiste todo lo que llevabas en mano...",
          `💸 PERDISTE  ›› *${perdio} ${CURRENCY}*`
        ])
      });
    }
    return true;
  }

  return false;
  }
                          

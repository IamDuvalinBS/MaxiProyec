import { MongoClient } from "mongodb";

export const CURRENCY = "¥enes";
export const FOTO_PATH = "./botpic.jpg";
export const startTime = Date.now();

const MONGO_URI = "mongodb+srv://jg0455748_db_user:2IBhQ33NazDOoBjg@cluster0.27mrbg5.mongodb.net/?appName=Cluster0";

const accounts = new Map(); // sender -> { wallet, bank, cooldowns, profile }
let collection = null;
let configCollection = null;

export const config = {
  botNameShort: "𝕬𝖘𝖙𝖆",
  botNameLong: "𝕬𝖘𝖙𝖆",
  ownerName: "Sin definir",
  prefix: "."
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
          cooldowns: doc.cooldowns || {},
          profile: doc.profile
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

export async function saveAccount(sender, intentos = 3) {
  if (!collection) return;
  const acc = getAccount(sender);
  for (let i = 1; i <= intentos; i++) {
    try {
      await collection.updateOne(
        { _id: sender },
        { $set: { wallet: acc.wallet, bank: acc.bank, cooldowns: acc.cooldowns, profile: acc.profile } },
        { upsert: true }
      );
      return;
    } catch (e) {
      console.log(`Error guardando cuenta (intento ${i}/${intentos}): ` + e.message);
      if (i < intentos) await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log("⚠️ No se pudo guardar la cuenta de " + sender + " tras varios intentos.");
}

export async function saveConfig(intentos = 3) {
  if (!configCollection) return;
  for (let i = 1; i <= intentos; i++) {
    try {
      await configCollection.updateOne({ _id: "bot" }, { $set: config }, { upsert: true });
      return;
    } catch (e) {
      console.log(`Error guardando config (intento ${i}/${intentos}): ` + e.message);
      if (i < intentos) await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log("⚠️ No se pudo guardar la configuracion tras varios intentos. El cambio puede perderse al reiniciar.");
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

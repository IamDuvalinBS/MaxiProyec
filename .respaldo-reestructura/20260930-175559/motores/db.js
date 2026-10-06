import { MongoClient } from "mongodb";
import chalk from "chalk";

export const CURRENCY = "¥enes";
export const FOTO_PATH = "./photo/botpic.jpg";
export const startTime = Date.now();

const MONGO_URI = process.env.MONGO_URI;

const accounts = new Map(); // sender -> { wallet, bank, cooldowns, profile }
const stickerMetas = new Map(); // idSticker -> { pack, author }
let collection = null;
let configCollection = null;
let stickersCollection = null;

export const config = {
  botNameShort: "Mambo",
  botNameLong: "Matikanetannhauser",
  ownerName: "Sin definir",
  prefix: ".", // se mantiene por compatibilidad, no hace falta tocarlo
  prefixes: [".", "!", "#"], // agregá acá todos los prefijos que quieras: [".", "!", "#"]
  channelLink: "https://whatsapp.com/channel/0029Vb92LdaCnA7rdqUbdw38"
};

export async function connectDB(intentos = 15) {
  if (!MONGO_URI) {
    console.log(chalk.red("Falta la variable de entorno MONGO_URI. Configúrala antes de iniciar el bot."));
    return;
  }
  console.log(chalk.yellow("Conectando a MongoDB..."));
  for (let i = 1; i <= intentos; i++) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db("whatsappbot");
      collection = db.collection("accounts");
      configCollection = db.collection("config");
      stickersCollection = db.collection("stickers");
      console.log(chalk.greenBright.bold("✅ Mongo conectado con éxito"));

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

      const metaDocs = await stickersCollection.find({}).toArray();
      for (const doc of metaDocs) {
        stickerMetas.set(doc._id, { pack: doc.pack, author: doc.author });
      }
      console.log(`Metadatos de stickers cargados: ${stickerMetas.size}`);
      return;
    } catch (e) {
      // Solo avisa cada 5 intentos, no en cada uno (para no ensuciar la pantalla)
      if (i % 5 === 0 && i < intentos) {
        console.log(chalk.yellow(`MongoDB no dio ninguna respuesta. Intentando nuevamente ${i}/${intentos}`));
      }
      if (i < intentos) await new Promise(r => setTimeout(r, 4000));
    }
  }
  console.log(chalk.redBright.bold("❌ No se pudo conectar a MongoDB tras varios intentos."));
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

// ==================== METADATOS DE STICKERS ====================
// stickerMetas: idSticker -> { pack, author }

export function getStickerMeta(idSticker) {
  return stickerMetas.get(idSticker) || null;
}

export function getAllStickerMetas() {
  return stickerMetas;
}

// Guarda en memoria al toque (para que este disponible ya mismo) y despues
// persiste en MongoDB, igual que saveAccount/saveConfig.
export function setStickerMeta(idSticker, pack, author) {
  stickerMetas.set(idSticker, { pack, author });
  saveStickerMeta(idSticker);
}

export async function saveStickerMeta(idSticker, intentos = 3) {
  if (!stickersCollection) return;
  const meta = stickerMetas.get(idSticker);
  if (!meta) return;

  for (let i = 1; i <= intentos; i++) {
    try {
      await stickersCollection.updateOne(
        { _id: idSticker },
        { $set: { pack: meta.pack, author: meta.author } },
        { upsert: true }
      );
      return;
    } catch (e) {
      console.log(`Error guardando metadatos de sticker (intento ${i}/${intentos}): ` + e.message);
      if (i < intentos) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log("⚠️ No se pudo guardar el metadato del sticker " + idSticker + " tras varios intentos.");
    }


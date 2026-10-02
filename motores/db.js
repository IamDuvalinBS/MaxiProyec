import { MongoClient } from "mongodb";
import chalk from "chalk";

export const CURRENCY = "¥enes";
export const FOTO_PATH = "./photo/botpic.jpg";
export const startTime = Date.now();

const MONGO_URI = process.env.MONGO_URI;

const accounts = new Map();
const stickerMetas = new Map();
let collection = null;
let configCollection = null;
let stickersCollection = null;
let besosCollection = null;
let baneosCollection = null;
const comandosBaneados = new Set();
const categoriasBaneadas = new Set();

export const config = {
  botNameShort: "Mambo",
  botNameLong: "Matikanetannhauser",
  ownerName: "Sin definir",
  prefix: ".",
  prefixes: [".", "!", "#"],
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
      besosCollection = db.collection("besos");
      baneosCollection = db.collection("baneos");
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

      const besosDocs = await besosCollection.find({}).toArray();
      for (const doc of besosDocs) besos.set(doc._id, doc.total || 0);
      console.log(`Contadores de besos cargados: ${besos.size}`);

      const baneosDoc = await baneosCollection.findOne({ _id: "global" });
      if (baneosDoc) {
        for (const c of baneosDoc.comandos || []) comandosBaneados.add(c);
        for (const c of baneosDoc.categorias || []) categoriasBaneadas.add(c);
      }
      console.log(`Baneos cargados: ${comandosBaneados.size} comandos, ${categoriasBaneadas.size} categorías`);
      return;
    } catch (e) {
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

export function getStickerMeta(idSticker) {
  return stickerMetas.get(idSticker) || null;
}

export function getAllStickerMetas() {
  return stickerMetas;
}

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

const besos = new Map();

function claveBesos(jidA, jidB) {
  return [jidA, jidB].sort().join("|");
}

export function getBesos(jidA, jidB) {
  return besos.get(claveBesos(jidA, jidB)) || 0;
}

export function registrarBeso(jidA, jidB) {
  const clave = claveBesos(jidA, jidB);
  const nuevoTotal = (besos.get(clave) || 0) + 1;
  besos.set(clave, nuevoTotal);
  guardarBesos(clave, nuevoTotal);
  return nuevoTotal;
}

async function guardarBesos(clave, total, intentos = 3) {
  if (!besosCollection) return;
  for (let i = 1; i <= intentos; i++) {
    try {
      await besosCollection.updateOne({ _id: clave }, { $set: { total } }, { upsert: true });
      return;
    } catch (e) {
      if (i < intentos) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log("⚠️ No se pudo guardar el contador de besos de " + clave + " tras varios intentos.");
}


async function guardarBaneos() {
  if (!baneosCollection) return;
  try {
    await baneosCollection.updateOne(
      { _id: "global" },
      { $set: { comandos: [...comandosBaneados], categorias: [...categoriasBaneadas] } },
      { upsert: true }
    );
  } catch (e) {
    console.log("⚠️ No se pudieron guardar los baneos: " + e.message);
  }
}

export function banearComando(nombre) {
  comandosBaneados.add(nombre.toLowerCase());
  guardarBaneos();
}

export function desbanearComando(nombre) {
  comandosBaneados.delete(nombre.toLowerCase());
  guardarBaneos();
}

export function banearCategoria(categoria) {
  categoriasBaneadas.add(categoria.toLowerCase());
  guardarBaneos();
}

export function desbanearCategoria(categoria) {
  categoriasBaneadas.delete(categoria.toLowerCase());
  guardarBaneos();
}

export function comandoEstaBaneado(nombre, categoria) {
  if (comandosBaneados.has(nombre.toLowerCase())) return true;
  if (categoria && categoriasBaneadas.has(categoria.toLowerCase())) return true;
  return false;
}

export function listarBaneos() {
  return { comandos: [...comandosBaneados], categorias: [...categoriasBaneadas] };
}

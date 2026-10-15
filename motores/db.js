import { MongoClient } from "mongodb";
import chalk from "chalk";

export const CURRENCY = "¥enes";
export const FOTO_PATH = "./photo/botpic.jpg";
export const startTime = Date.now();

try {
  process.loadEnvFile(".env");
} catch {}

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://jg0455748_db_user:ByDuvalincitoMC@cluster0.27mrbg5.mongodb.net/?appName=Cluster0";

const accounts = new Map();
const stickerMetas = new Map();
let baseDatos = null;
let modoRespaldo = false;
let temporizadorReconexion = null;
let reconectando = false;
const pendientesOffline = new Set();
const SEP = "\u0000";
const REINTENTO_MONGO_MS = Number(process.env.MONGO_REINTENTO_MS) || 2 * 60 * 1000;
const TIEMPO_ESPERA_MONGO_MS = Number(process.env.MONGO_TIMEOUT_MS) || 10000;
let collection = null;
let configCollection = null;
let stickersCollection = null;
let besosCollection = null;
let baneosCollection = null;
let warnsCollection = null;
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

export async function connectDB(intentos = 5) {
  if (!MONGO_URI) {
    console.log(chalk.red("Falta la variable de entorno MONGO_URI. Configúrala antes de iniciar el bot."));
    return;
  }
  console.log(chalk.yellow("Conectando a MongoDB..."));
  let ultimoError = null;
  for (let i = 1; i <= intentos; i++) {
    try {
      await abrirConexion();
      console.log(chalk.greenBright.bold("✅ Mongo conectado con éxito"));

      for await (const doc of collection.find({})) {
        accounts.set(doc._id, {
          wallet: doc.wallet || 0,
          bank: doc.bank || 0,
          cooldowns: doc.cooldowns || {},
          rachas: doc.rachas || {},
          negocios: doc.negocios || {},
          afk: doc.afk || null,
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
      import("./respaldo.js")
        .then((modulo) => modulo.iniciarRespaldo())
        .catch((e) => console.log("No se pudo iniciar el respaldo en Turso: " + e.message));
      return;
    } catch (e) {
      ultimoError = e;
      if (esErrorDeCredenciales(e)) break;
      if (i < intentos) {
        console.log(chalk.yellow(`MongoDB no respondió (${e.message}). Intentando nuevamente ${i}/${intentos}`));
        await new Promise(r => setTimeout(r, 4000));
      }
    }
  }
  console.log(chalk.redBright.bold("❌ No se pudo conectar a MongoDB: " + (ultimoError ? ultimoError.message : "sin detalle")));
  await arrancarModoRespaldo();
}

async function abrirConexion() {
  const client = new MongoClient(MONGO_URI, {
    maxPoolSize: 3,
    compressors: ["zlib"],
    serverSelectionTimeoutMS: TIEMPO_ESPERA_MONGO_MS
  });
  try {
    await client.connect();
  } catch (e) {
    client.close().catch(() => {});
    throw e;
  }
  const db = client.db("whatsappbot");
  baseDatos = db;
  collection = db.collection("accounts");
  configCollection = db.collection("config");
  stickersCollection = db.collection("stickers");
  besosCollection = db.collection("besos");
  baneosCollection = db.collection("baneos");
  warnsCollection = db.collection("warns");
}

function esErrorDeCredenciales(e) {
  return /bad auth|authentication failed/i.test(e?.message || "") || e?.codeName === "AuthenticationFailed" || e?.code === 18;
}

function documentoCuenta(sender) {
  const acc = accounts.get(sender);
  if (!acc) return null;
  const doc = { _id: sender, wallet: acc.wallet, bank: acc.bank };
  for (const clave of ["cooldowns", "rachas", "negocios", "afk", "profile"]) {
    const valor = acc[clave];
    const vacio = valor === undefined || valor === null || (typeof valor === "object" && Object.keys(valor).length === 0);
    if (!vacio) doc[clave] = valor;
  }
  return doc;
}

function documentoDe(coleccion, id) {
  if (coleccion === "accounts") return documentoCuenta(id);
  if (coleccion === "config") return { ...config, _id: "bot" };
  if (coleccion === "stickers") {
    const meta = stickerMetas.get(id);
    return meta ? { _id: id, pack: meta.pack, author: meta.author } : null;
  }
  if (coleccion === "besos") return { _id: id, total: besos.get(id) || 0 };
  if (coleccion === "baneos") return { _id: "global", comandos: [...comandosBaneados], categorias: [...categoriasBaneadas] };
  return null;
}

async function guardarOffline(claves) {
  const docs = [];
  for (const [coleccion, id] of claves) {
    pendientesOffline.add(coleccion + SEP + id);
    const doc = documentoDe(coleccion, id);
    if (doc) docs.push({ coleccion, doc });
  }
  if (!docs.length) return;
  const modulo = await import("./respaldo.js");
  await modulo.escribirDocsRespaldo(docs);
}

async function arrancarModoRespaldo() {
  try {
    const modulo = await import("./respaldo.js");
    if (!modulo.respaldoConfigurado()) {
      console.log(chalk.yellow("Sin MongoDB y sin respaldo configurado: el bot no guardará datos."));
      return;
    }
    const datos = await modulo.leerRespaldoCompleto();
    if (!(datos.accounts || []).length) {
      console.log(chalk.yellow("El respaldo en Turso no tiene cuentas todavía: el bot inicia sin datos y no guardará cambios."));
      return;
    }

    for (const doc of datos.accounts) {
      accounts.set(doc._id, {
        wallet: doc.wallet || 0,
        bank: doc.bank || 0,
        cooldowns: doc.cooldowns || {},
        rachas: doc.rachas || {},
        negocios: doc.negocios || {},
        afk: doc.afk || null,
        profile: doc.profile
      });
    }
    const cfgDoc = (datos.config || []).find((d) => d._id === "bot");
    if (cfgDoc) Object.assign(config, cfgDoc);
    for (const doc of datos.stickers || []) stickerMetas.set(doc._id, { pack: doc.pack, author: doc.author });
    for (const doc of datos.besos || []) besos.set(doc._id, doc.total || 0);
    const baneosDoc = (datos.baneos || []).find((d) => d._id === "global");
    if (baneosDoc) {
      for (const c of baneosDoc.comandos || []) comandosBaneados.add(c);
      for (const c of baneosDoc.categorias || []) categoriasBaneadas.add(c);
    }

    modoRespaldo = true;
    console.log(
      chalk.yellow.bold(
        `⚠️ MODO RESPALDO: datos cargados desde Turso (${accounts.size} cuentas). Los cambios se guardan en Turso y se enviarán a MongoDB cuando vuelva la conexión.`
      )
    );
    programarReconexion();
  } catch (e) {
    console.log(chalk.redBright("No se pudo cargar el respaldo de Turso: " + e.message));
  }
}

async function sincronizarOffline() {
  if (!pendientesOffline.size) return;
  const claves = [...pendientesOffline];
  const porColeccion = new Map();
  for (const clave of claves) {
    const [coleccion, id] = clave.split(SEP);
    const doc = documentoDe(coleccion, id);
    if (!doc) continue;
    if (!porColeccion.has(coleccion)) porColeccion.set(coleccion, []);
    porColeccion.get(coleccion).push({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } });
  }
  for (const [nombre, operaciones] of porColeccion) {
    for (let i = 0; i < operaciones.length; i += 500) {
      await baseDatos.collection(nombre).bulkWrite(operaciones.slice(i, i + 500), { ordered: false });
    }
  }
  for (const clave of claves) pendientesOffline.delete(clave);
}

function programarReconexion() {
  if (temporizadorReconexion) return;
  temporizadorReconexion = setInterval(async () => {
    if (!modoRespaldo || reconectando) return;
    reconectando = true;
    try {
      await abrirConexion();
      await guardarCuentasPendientes();
      await sincronizarOffline();
      modoRespaldo = false;
      clearInterval(temporizadorReconexion);
      temporizadorReconexion = null;
      await recargarDatos();
      console.log(chalk.greenBright.bold("✅ MongoDB reconectado. Los cambios del modo respaldo se enviaron y los datos se recargaron."));
      import("./respaldo.js").then((m) => m.iniciarRespaldo()).catch(() => {});
    } catch (e) {
      console.log(chalk.yellow("MongoDB sigue sin conexión (modo respaldo): " + e.message));
    } finally {
      reconectando = false;
    }
  }, REINTENTO_MONGO_MS);
}

export function obtenerBase() {
  return baseDatos;
}

export function enModoRespaldo() {
  return modoRespaldo;
}

export async function recargarDatos() {
  if (!collection) return;
  cuentasPendientes.clear();
  accounts.clear();
  for await (const doc of collection.find({})) {
    accounts.set(doc._id, {
      wallet: doc.wallet || 0,
      bank: doc.bank || 0,
      cooldowns: doc.cooldowns || {},
      rachas: doc.rachas || {},
      negocios: doc.negocios || {},
      afk: doc.afk || null,
      profile: doc.profile
    });
  }

  const cfgDoc = await configCollection.findOne({ _id: "bot" });
  if (cfgDoc) Object.assign(config, cfgDoc);

  stickerMetas.clear();
  for (const doc of await stickersCollection.find({}).toArray()) {
    stickerMetas.set(doc._id, { pack: doc.pack, author: doc.author });
  }

  besos.clear();
  for (const doc of await besosCollection.find({}).toArray()) besos.set(doc._id, doc.total || 0);

  comandosBaneados.clear();
  categoriasBaneadas.clear();
  const baneosDoc = await baneosCollection.findOne({ _id: "global" });
  if (baneosDoc) {
    for (const c of baneosDoc.comandos || []) comandosBaneados.add(c);
    for (const c of baneosDoc.categorias || []) categoriasBaneadas.add(c);
  }
}

const cuentasPendientes = new Set();
const cuentasDepuradas = new Set();
const RETARDO_GUARDADO_MS = 2000;
const VIGENCIA_MAXIMA_ESPERA_MS = 8 * 24 * 60 * 60 * 1000;
let temporizadorGuardado = null;

function armarOperacion(sender) {
  const acc = accounts.get(sender);
  const ahora = Date.now();
  for (const clave of Object.keys(acc.cooldowns)) {
    if (ahora - acc.cooldowns[clave] > VIGENCIA_MAXIMA_ESPERA_MS) delete acc.cooldowns[clave];
  }
  const asignar = { wallet: acc.wallet, bank: acc.bank };
  const quitar = {};
  const opcionales = { cooldowns: acc.cooldowns, rachas: acc.rachas, negocios: acc.negocios, afk: acc.afk, profile: acc.profile };
  for (const [clave, valor] of Object.entries(opcionales)) {
    const vacio = valor === undefined || valor === null || (typeof valor === "object" && Object.keys(valor).length === 0);
    if (vacio) quitar[clave] = "";
    else asignar[clave] = valor;
  }
  const actualizacion = { $set: asignar };
  if (Object.keys(quitar).length) actualizacion.$unset = quitar;
  return { updateOne: { filter: { _id: sender }, update: actualizacion, upsert: true } };
}

export async function guardarCuentasPendientes() {
  if (temporizadorGuardado) {
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = null;
  }
  if ((!collection && !modoRespaldo) || !cuentasPendientes.size) return;
  const lote = [...cuentasPendientes];
  cuentasPendientes.clear();
  try {
    if (modoRespaldo) await guardarOffline(lote.map((sender) => ["accounts", sender]));
    else await collection.bulkWrite(lote.map(armarOperacion), { ordered: false });
  } catch (e) {
    console.log("Error guardando cuentas: " + e.message);
    lote.forEach((sender) => cuentasPendientes.add(sender));
    temporizadorGuardado = setTimeout(guardarCuentasPendientes, RETARDO_GUARDADO_MS * 5);
  }
}

export function saveAccount(sender) {
  if (!collection && !modoRespaldo) return Promise.resolve();
  getAccount(sender);
  cuentasPendientes.add(sender);
  if (!temporizadorGuardado) temporizadorGuardado = setTimeout(guardarCuentasPendientes, RETARDO_GUARDADO_MS);
  return Promise.resolve();
}

export async function saveConfig(intentos = 3) {
  if (modoRespaldo) {
    try {
      await guardarOffline([["config", "bot"]]);
    } catch (e) {
      console.log("⚠️ No se pudo guardar la configuración en el respaldo: " + e.message);
    }
    return;
  }
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
    accounts.set(sender, { wallet: 0, bank: 0, cooldowns: {}, rachas: {}, negocios: {}, afk: null });
  }
  const acc = accounts.get(sender);
  if (!acc.cooldowns) acc.cooldowns = {};
  if (!acc.rachas) acc.rachas = {};
  if (!acc.negocios) acc.negocios = {};
  if (acc.afk === undefined) acc.afk = null;
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

export function reiniciarEsperas(claves) {
  let afectadas = 0;
  for (const [sender, acc] of accounts) {
    if (!acc.cooldowns) continue;
    let cambio = false;
    for (const clave of claves) {
      if (clave in acc.cooldowns) {
        delete acc.cooldowns[clave];
        cambio = true;
      }
    }
    if (cambio) {
      afectadas++;
      saveAccount(sender);
    }
  }
  return afectadas;
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
  if (modoRespaldo) {
    try {
      await guardarOffline([["stickers", idSticker]]);
    } catch (e) {
      console.log("⚠️ No se pudo guardar el sticker en el respaldo: " + e.message);
    }
    return;
  }
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
  if (modoRespaldo) {
    try {
      await guardarOffline([["besos", clave]]);
    } catch (e) {
      console.log("⚠️ No se pudo guardar el contador de besos en el respaldo: " + e.message);
    }
    return;
  }
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
  if (modoRespaldo) {
    try {
      await guardarOffline([["baneos", "global"]]);
    } catch (e) {
      console.log("⚠️ No se pudieron guardar los baneos en el respaldo: " + e.message);
    }
    return;
  }
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

export function listarCuentas() {
  return [...accounts.entries()];
}

export async function sumarAdvertencia(grupo, usuario) {
  if (!warnsCollection) return null;
  const campo = `w.${usuario}`;
  await warnsCollection.updateOne({ _id: grupo }, { $inc: { [campo]: 1 } }, { upsert: true });
  const doc = await warnsCollection.findOne({ _id: grupo }, { projection: { [campo]: 1 } });
  return Number(doc?.w?.[usuario]) || 1;
}

export async function limpiarAdvertencias(grupo, usuario) {
  if (!warnsCollection) return null;
  const campo = `w.${usuario}`;
  const doc = await warnsCollection.findOne({ _id: grupo }, { projection: { [campo]: 1 } });
  const previas = Number(doc?.w?.[usuario]) || 0;
  if (!previas) return 0;
  await warnsCollection.updateOne({ _id: grupo }, { $unset: { [campo]: "" } });
  await warnsCollection.deleteOne({ _id: grupo, w: {} });
  return previas;
}

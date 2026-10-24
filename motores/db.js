import { MongoClient } from "mongodb";
import chalk from "chalk";

export const CURRENCY = "¥enes";
export const FOTO_PATH = "./photo/botpic.jpg";
export const startTime = Date.now();

try {
  process.loadEnvFile(".env");
} catch {}

const URI_PREDETERMINADA = "mongodb+srv://jg0455748_db_user:ByDuvalincitoMC@cluster0.27mrbg5.mongodb.net/?appName=Cluster0";
const URIS_MONGO = [...new Set([process.env.MONGO_URI, URI_PREDETERMINADA].filter(Boolean))];
const MONGO_URI = URIS_MONGO[0];

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

const saldosBase = new Map();

function cargarCuenta(doc) {
  const cuenta = {
    wallet: doc.wallet || 0,
    bank: doc.bank || 0,
    cooldowns: doc.cooldowns || {},
    rachas: doc.rachas || {},
    negocios: doc.negocios || {},
    afk: doc.afk || null,
    profile: doc.profile,
    gachaClaim: doc.gachaClaim,
    prestamo: doc.prestamo
  };
  accounts.set(doc._id, cuenta);
  saldosBase.set(doc._id, { wallet: cuenta.wallet, bank: cuenta.bank });
}

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
        cargarCuenta(doc);
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
  if (ultimoError && esErrorDeCredenciales(ultimoError)) {
    const usuario = (MONGO_URI.match(/^mongodb(?:\+srv)?:\/\/([^:@/]+):/) || [])[1] || "desconocido";
    console.log(chalk.yellow(`Atlas rechazó el usuario "${usuario}". La conexión y la red están bien; falla la autenticación. Revisa en Atlas, en Database Access:`));
    console.log(chalk.yellow(`  1. Que el usuario "${usuario}" exista en el mismo proyecto que el cluster del bot.`));
    console.log(chalk.yellow("  2. Que no sea un usuario temporal ya vencido, ni esté limitado a otro cluster."));
    console.log(chalk.yellow("  3. Que la contraseña sea la de ese usuario: edítalo, usa Autogenerate Secure Password, copia la contraseña y pégala en MONGO_URI."));
  }
  await arrancarModoRespaldo();
}

async function abrirConexion() {
  let ultimoError = null;
  for (const uri of URIS_MONGO) {
    const client = new MongoClient(uri, {
      maxPoolSize: 3,
      compressors: ["zlib"],
      serverSelectionTimeoutMS: TIEMPO_ESPERA_MONGO_MS
    });
    try {
      await client.connect();
    } catch (e) {
      client.close().catch(() => {});
      ultimoError = e;
      if (esErrorDeCredenciales(e)) continue;
      throw e;
    }
    if (uri !== URIS_MONGO[0]) {
      console.log(chalk.yellow("La variable MONGO_URI del entorno o del archivo .env fue rechazada por Atlas; se usó la cuenta guardada en el código."));
    }
    const db = client.db("whatsappbot");
    baseDatos = db;
    collection = db.collection("accounts");
    configCollection = db.collection("config");
    stickersCollection = db.collection("stickers");
    besosCollection = db.collection("besos");
    baneosCollection = db.collection("baneos");
    warnsCollection = db.collection("warns");
    return;
  }
  throw ultimoError;
}

function esErrorDeCredenciales(e) {
  return /bad auth|authentication failed/i.test(e?.message || "") || e?.codeName === "AuthenticationFailed" || e?.code === 18;
}

function documentoCuenta(sender) {
  const acc = accounts.get(sender);
  if (!acc) return null;
  const doc = { _id: sender, wallet: acc.wallet, bank: acc.bank };
  for (const clave of ["cooldowns", "rachas", "negocios", "afk", "profile", "gachaClaim", "prestamo"]) {
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
      cargarCuenta(doc);
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
  const itemsCuentas = [];
  for (const clave of claves) {
    const [coleccion, id] = clave.split(SEP);
    if (coleccion === "accounts") {
      if (!accounts.has(id)) continue;
      const item = armarOperacion(id);
      itemsCuentas.push(item);
      if (!porColeccion.has(coleccion)) porColeccion.set(coleccion, []);
      porColeccion.get(coleccion).push(item.op);
      continue;
    }
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
  itemsCuentas.forEach(confirmarBase);
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
    cargarCuenta(doc);
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
  const base = saldosBase.get(sender) || { wallet: 0, bank: 0 };
  const incrementar = {};
  const dWallet = acc.wallet - base.wallet;
  const dBank = acc.bank - base.bank;
  if (dWallet) incrementar.wallet = dWallet;
  if (dBank) incrementar.bank = dBank;
  const alInsertar = {};
  if (!dWallet) alInsertar.wallet = acc.wallet;
  if (!dBank) alInsertar.bank = acc.bank;
  const asignar = {};
  const quitar = {};
  const opcionales = { cooldowns: acc.cooldowns, rachas: acc.rachas, negocios: acc.negocios, afk: acc.afk, profile: acc.profile, gachaClaim: acc.gachaClaim, prestamo: acc.prestamo };
  for (const [clave, valor] of Object.entries(opcionales)) {
    const vacio = valor === undefined || valor === null || (typeof valor === "object" && Object.keys(valor).length === 0);
    if (vacio) quitar[clave] = "";
    else asignar[clave] = valor;
  }
  const actualizacion = {};
  if (Object.keys(asignar).length) actualizacion.$set = asignar;
  if (Object.keys(quitar).length) actualizacion.$unset = quitar;
  if (Object.keys(incrementar).length) actualizacion.$inc = incrementar;
  if (Object.keys(alInsertar).length) actualizacion.$setOnInsert = alInsertar;
  return {
    sender,
    nuevaBase: { wallet: acc.wallet, bank: acc.bank },
    op: { updateOne: { filter: { _id: sender }, update: actualizacion, upsert: true } }
  };
}

function confirmarBase(item) {
  saldosBase.set(item.sender, item.nuevaBase);
}

export async function guardarCuentasPendientes() {
  if (temporizadorGuardado) {
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = null;
  }
  if ((!collection && !modoRespaldo) || !cuentasPendientes.size) return;
  const lote = [...cuentasPendientes];
  cuentasPendientes.clear();
  if (modoRespaldo) {
    try {
      await guardarOffline(lote.map((sender) => ["accounts", sender]));
    } catch (e) {
      console.log("Error guardando cuentas en el respaldo: " + e.message);
      lote.forEach((sender) => cuentasPendientes.add(sender));
      temporizadorGuardado = setTimeout(guardarCuentasPendientes, RETARDO_GUARDADO_MS * 5);
    }
    return;
  }
  const items = lote.filter((sender) => accounts.has(sender)).map(armarOperacion);
  if (!items.length) return;
  try {
    await collection.bulkWrite(items.map((i) => i.op), { ordered: false });
    items.forEach(confirmarBase);
  } catch (e) {
    console.log("Error guardando cuentas: " + e.message);
    const errores = e && e.writeErrors ? [].concat(e.writeErrors) : [];
    const fallidos = new Set(errores.map((x) => x.index ?? x.err?.index).filter((n) => Number.isInteger(n)));
    if (errores.length && fallidos.size) {
      items.forEach((item, idx) => {
        if (fallidos.has(idx)) cuentasPendientes.add(item.sender);
        else confirmarBase(item);
      });
    } else {
      items.forEach((item) => cuentasPendientes.add(item.sender));
    }
    temporizadorGuardado = setTimeout(guardarCuentasPendientes, RETARDO_GUARDADO_MS * 5);
  }
}

export function saveAccount(sender) {
  sender = canonId(sender);
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

let canonId = (jid) => jid;

export function setCanonId(fn) {
  canonId = typeof fn === "function" ? fn : (jid) => jid;
}

export function idCanonico(jid) {
  return canonId(jid);
}

function unirPerfiles(a, b) {
  if (!a) return b;
  if (!b) return a;
  const peso = (p) => (p.level || 1) * 1e9 + (p.xp || 0);
  const [base, otro] = peso(a) >= peso(b) ? [a, b] : [b, a];
  const unido = { ...base };
  for (const [clave, valor] of Object.entries(otro)) {
    if (valor !== undefined && valor !== "" && (unido[clave] === undefined || unido[clave] === "")) unido[clave] = valor;
  }
  return unido;
}

export async function fusionarCuenta(origen, destino) {
  if (!origen || !destino || origen === destino || !accounts.has(origen)) return false;
  if (!collection || modoRespaldo) return false;
  const o = accounts.get(origen);
  const antesDestino = accounts.has(destino) ? structuredClone(accounts.get(destino)) : null;
  const antesBase = saldosBase.get(destino);
  const d = getAccount(destino);
  d.wallet += o.wallet || 0;
  d.bank += o.bank || 0;
  d.cooldowns = { ...(o.cooldowns || {}), ...d.cooldowns };
  d.rachas = { ...(o.rachas || {}), ...d.rachas };
  d.negocios = { ...(o.negocios || {}), ...d.negocios };
  if (!d.afk && o.afk) d.afk = o.afk;
  if (!d.gachaClaim && o.gachaClaim) d.gachaClaim = o.gachaClaim;
  if (!d.prestamo && o.prestamo) d.prestamo = o.prestamo;
  const perfil = unirPerfiles(d.profile, o.profile);
  if (perfil) d.profile = perfil;
  const casados = [];
  for (const [id, acc] of accounts) {
    if (id !== origen && acc.profile && acc.profile.marriedTo === origen) {
      acc.profile.marriedTo = destino;
      casados.push(id);
    }
  }
  saveAccount(destino);
  casados.forEach((id) => saveAccount(id));
  await guardarCuentasPendientes();
  if (cuentasPendientes.has(destino)) {
    if (antesDestino) accounts.set(destino, antesDestino);
    else accounts.delete(destino);
    if (antesBase) saldosBase.set(destino, antesBase);
    else saldosBase.delete(destino);
    casados.forEach((id) => {
      const acc = accounts.get(id);
      if (acc && acc.profile) acc.profile.marriedTo = origen;
    });
    return false;
  }
  accounts.delete(origen);
  saldosBase.delete(origen);
  cuentasPendientes.delete(origen);
  await collection.deleteOne({ _id: origen });
  return true;
}

export function getAccount(sender) {
  sender = canonId(sender);
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
  

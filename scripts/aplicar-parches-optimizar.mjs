import { crearSesion } from "./utilidades-parches.mjs";
import { ARMAR_OPERACION } from "./texto-guardado.mjs";

const sesion = crearSesion();

const NUEVA_CARGA = [
  "      for await (const doc of collection.find({})) {",
  "        accounts.set(doc._id, {",
  "          wallet: doc.wallet || 0,",
  "          bank: doc.bank || 0,",
  "          cooldowns: doc.cooldowns || {},",
  "          rachas: doc.rachas || {},",
  "          negocios: doc.negocios || {},",
  "          afk: doc.afk || null,",
  "          profile: doc.profile",
  "        });",
  "      }",
  ""
].join("\n");

const NUEVO_GUARDADO = [
  "const cuentasPendientes = new Set();",
  "const RETARDO_GUARDADO_MS = 2000;",
  "const VIGENCIA_MAXIMA_ESPERA_MS = 8 * 24 * 60 * 60 * 1000;",
  "let temporizadorGuardado = null;",
  "",
  ARMAR_OPERACION,
  "export async function guardarCuentasPendientes() {",
  "  if (temporizadorGuardado) {",
  "    clearTimeout(temporizadorGuardado);",
  "    temporizadorGuardado = null;",
  "  }",
  "  if (!collection || !cuentasPendientes.size) return;",
  "  const lote = [...cuentasPendientes];",
  "  cuentasPendientes.clear();",
  "  try {",
  "    await collection.bulkWrite(lote.map(armarOperacion), { ordered: false });",
  "  } catch (e) {",
  '    console.log("Error guardando cuentas: " + e.message);',
  "    lote.forEach((sender) => cuentasPendientes.add(sender));",
  "    temporizadorGuardado = setTimeout(guardarCuentasPendientes, RETARDO_GUARDADO_MS * 5);",
  "  }",
  "}",
  "",
  "export function saveAccount(sender) {",
  "  if (!collection) return Promise.resolve();",
  "  getAccount(sender);",
  "  cuentasPendientes.add(sender);",
  "  if (!temporizadorGuardado) temporizadorGuardado = setTimeout(guardarCuentasPendientes, RETARDO_GUARDADO_MS);",
  "  return Promise.resolve();",
  "}",
  ""
].join("\n");

const db = sesion.leer("motores/db.js");
if (db) {
  sesion.reemplazar(
    db,
    "conexión con compresión y pocas conexiones",
    "new MongoClient(MONGO_URI)",
    'new MongoClient(MONGO_URI, { maxPoolSize: 3, compressors: ["zlib"] })',
    'compressors: ["zlib"]'
  );
  sesion.reemplazarRegion(
    db,
    "carga de cuentas sin cargar todo a la memoria de golpe",
    "      const docs = await collection.find({}).toArray();",
    "      console.log(`Datos cargados desde MongoDB",
    NUEVA_CARGA,
    "for await (const doc of collection.find({}))"
  );
  sesion.reemplazarRegion(
    db,
    "guardado agrupado, depuración de esperas vencidas y sin campos nuevos en MongoDB",
    "export async function saveAccount(",
    "\nexport async function saveConfig",
    NUEVO_GUARDADO,
    "const cuentasPendientes = new Set();"
  );
  sesion.guardar(db);
}

const almacen = sesion.leer(".gitignore");
if (almacen) {
  if (almacen.texto.includes("data/economia-local.json")) {
    sesion.nota("YA ESTABA      .gitignore: data/economia-local.json");
  } else {
    almacen.texto = almacen.texto.replace(/\s*$/, "\n") + "data/economia-local.json\ndata/economia-local.json.parcial\n";
    sesion.nota("APLICADO       .gitignore: data/economia-local.json");
  }
  sesion.guardar(almacen);
}

sesion.terminar();

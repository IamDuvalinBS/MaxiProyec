import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { obtenerBase } from "../../motores/db.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "grupos.json");
const SIN_AJUSTES = Object.freeze({});

let grupos = {};

try {
  if (fs.existsSync(ARCHIVO)) grupos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8")) || {};
} catch (e) {
  console.log(`❌ No se pudo leer la configuración de grupos: ${e.message}`);
  try {
    fs.copyFileSync(ARCHIVO, `${ARCHIVO}.corrupto`);
  } catch {}
  grupos = {};
}

function guardar() {
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(grupos));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudo guardar la configuración de grupos: ${e.message}`);
  }
}

const COLECCION = "grupos_config";

function coleccion() {
  const base = obtenerBase();
  return base ? base.collection(COLECCION) : null;
}

function guardarEnMongo(grupo) {
  const col = coleccion();
  if (!col) return;
  const entrada = grupos[grupo];
  const op = entrada ? col.replaceOne({ _id: grupo }, { _id: grupo, ...entrada }, { upsert: true }) : col.deleteOne({ _id: grupo });
  op.catch((e) => console.log(`❌ No se pudo guardar el grupo ${grupo} en MongoDB: ${e.message}`));
}

// Carga los ajustes (on/off, antilink, etc.) desde MongoDB. Mongo manda; lo que solo exista en el archivo local se sube.
export async function cargarGruposMongo() {
  for (let i = 0; i < 30 && !coleccion(); i++) await new Promise((r) => setTimeout(r, 1000));
  const col = coleccion();
  if (!col) return console.log("⚠️ MongoDB no disponible: los ajustes de grupos quedan solo en el archivo local.");
  try {
    const docs = await col.find({}).toArray();
    const remotos = {};
    for (const { _id, ...resto } of docs) remotos[_id] = resto;
    const subir = Object.keys(grupos).filter((g) => !(g in remotos));
    grupos = { ...grupos, ...remotos };
    for (const g of subir) guardarEnMongo(g);
    guardar();
    console.log(`✅ Ajustes de grupos cargados desde MongoDB: ${docs.length} (subidos: ${subir.length})`);
  } catch (e) {
    console.log(`❌ No se pudieron cargar los grupos desde MongoDB: ${e.message}`);
  }
}

export function ajustesDe(grupo) {
  return grupos[grupo] || SIN_AJUSTES;
}

export function definirAjuste(grupo, clave, valor) {
  const entrada = grupos[grupo] || (grupos[grupo] = {});
  if (valor === false || valor === undefined || valor === null || valor === "") delete entrada[clave];
  else entrada[clave] = valor;
  if (!Object.keys(entrada).length) delete grupos[grupo];
  guardar();
  guardarEnMongo(grupo);
}

export function antilinkActivo(grupo) {
  return Boolean(grupos[grupo]?.antilink);
}

export function soloAdminsActivo(grupo) {
  return Boolean(grupos[grupo]?.soloAdmins);
}

export function botApagado(grupo) {
  return Boolean(grupos[grupo]?.apagado);
}

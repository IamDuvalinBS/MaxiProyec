import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAllAccounts } from "./db.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "economia-local.json");
const RETARDO_GUARDADO_MS = 2000;

let datos = {};
let temporizador = null;

try {
  if (fs.existsSync(ARCHIVO)) datos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
} catch (e) {
  console.log(`❌ No se pudo leer el almacén local: ${e.message}`);
  datos = {};
}

function vacio(entrada) {
  return !Object.keys(entrada.rachas).length && !Object.keys(entrada.negocios).length && !entrada.afk;
}

function escribirAhora() {
  if (temporizador) {
    clearTimeout(temporizador);
    temporizador = null;
  }
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const contenido = {};
    for (const [sender, entrada] of Object.entries(datos)) {
      if (!vacio(entrada)) contenido[sender] = entrada;
    }
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(contenido));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudo guardar el almacén local: ${e.message}`);
  }
}

process.on("exit", () => {
  if (temporizador) escribirAhora();
});

export function existenDatos(sender) {
  return Boolean(datos[sender]);
}

export function datosDe(sender) {
  if (!datos[sender]) {
    const previa = getAllAccounts().get(sender) || {};
    datos[sender] = {
      rachas: previa.rachas && Object.keys(previa.rachas).length ? previa.rachas : {},
      negocios: previa.negocios && Object.keys(previa.negocios).length ? previa.negocios : {},
      afk: previa.afk || null
    };
    if (previa.rachas || previa.negocios || previa.afk) {
      previa.legadoMigrado = true;
      if (!vacio(datos[sender])) guardarDatos();
    }
  }
  return datos[sender];
}

export function guardarDatos() {
  if (temporizador) return;
  temporizador = setTimeout(escribirAhora, RETARDO_GUARDADO_MS);
}

export function listarDatos() {
  return Object.entries(datos);
}

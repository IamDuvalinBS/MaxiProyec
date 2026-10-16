import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

export function ajustesDe(grupo) {
  return grupos[grupo] || SIN_AJUSTES;
}

export function definirAjuste(grupo, clave, valor) {
  const entrada = grupos[grupo] || (grupos[grupo] = {});
  if (valor === false || valor === undefined || valor === null || valor === "") delete entrada[clave];
  else entrada[clave] = valor;
  if (!Object.keys(entrada).length) delete grupos[grupo];
  guardar();
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

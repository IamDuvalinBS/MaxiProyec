import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getAccount, getAllAccounts, saveAccount } from "./db.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRECTORIO = path.join(RAIZ, "data");
const ARCHIVO = path.join(DIRECTORIO, "economia-local.json");
const RETARDO_GUARDADO_MS = 2000;

let local = {};
let temporizador = null;

function normalizarEntrada(entrada) {
  if (!entrada || typeof entrada !== "object") return { avisos: {} };
  if (entrada.rachas || entrada.negocios || "afk" in entrada) {
    const avisos = entrada.avisos || {};
    for (const [clave, valor] of Object.entries(entrada.rachas || {})) {
      if (valor && typeof valor === "object" && valor.chat) {
        avisos[clave] = { chat: valor.chat, avisado: valor.avisado || 0 };
      }
    }
    return { avisos, legado: { rachas: entrada.rachas || {}, negocios: entrada.negocios || {}, afk: entrada.afk || null } };
  }
  return { avisos: entrada.avisos || {}, legado: entrada.legado };
}

try {
  if (fs.existsSync(ARCHIVO)) {
    const crudo = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    for (const [sender, entrada] of Object.entries(crudo)) local[sender] = normalizarEntrada(entrada);
  }
} catch (e) {
  console.log(`❌ No se pudo leer el archivo auxiliar: ${e.message}`);
  local = {};
}

function escribirAhora() {
  if (temporizador) {
    clearTimeout(temporizador);
    temporizador = null;
  }
  try {
    fs.mkdirSync(DIRECTORIO, { recursive: true });
    const contenido = {};
    for (const [sender, entrada] of Object.entries(local)) {
      const conAvisos = Object.keys(entrada.avisos || {}).length > 0;
      if (conAvisos || entrada.legado) contenido[sender] = entrada;
    }
    const temporal = `${ARCHIVO}.parcial`;
    fs.writeFileSync(temporal, JSON.stringify(contenido));
    fs.renameSync(temporal, ARCHIVO);
  } catch (e) {
    console.log(`❌ No se pudo guardar el archivo auxiliar: ${e.message}`);
  }
}

process.on("exit", () => {
  if (temporizador) escribirAhora();
});

export function guardarAvisos() {
  if (temporizador) return;
  temporizador = setTimeout(escribirAhora, RETARDO_GUARDADO_MS);
}

export function cantidadDeRacha(cuenta, clave) {
  const valor = cuenta && cuenta.rachas ? cuenta.rachas[clave] : 0;
  if (valor && typeof valor === "object") return Number(valor.cantidad) || 0;
  return Number(valor) || 0;
}

export function migrarDeDisco(sender) {
  const entrada = local[sender];
  if (!entrada || !entrada.legado) return;

  const cuenta = getAccount(sender);
  const { rachas, negocios, afk } = entrada.legado;

  for (const [clave, valor] of Object.entries(rachas || {})) {
    const cantidad = valor && typeof valor === "object" ? Number(valor.cantidad) || 0 : Number(valor) || 0;
    if (cantidad && !cantidadDeRacha(cuenta, clave)) cuenta.rachas[clave] = cantidad;
  }
  for (const [clave, negocio] of Object.entries(negocios || {})) {
    if (!cuenta.negocios[clave]) {
      cuenta.negocios[clave] = { inicio: negocio.inicio, vence: negocio.vence, acumulado: negocio.acumulado || 0 };
    }
  }
  if (afk && !cuenta.afk) cuenta.afk = afk;

  delete entrada.legado;
  saveAccount(sender);
  guardarAvisos();
}

export function migrarTodoDeDisco() {
  for (const sender of Object.keys(local)) migrarDeDisco(sender);
}

export function datosDe(sender) {
  migrarDeDisco(sender);
  const cuenta = getAccount(sender);
  if (!cuenta.rachas) cuenta.rachas = {};
  if (!cuenta.negocios) cuenta.negocios = {};
  if (cuenta.afk === undefined) cuenta.afk = null;
  for (const [clave, valor] of Object.entries(cuenta.rachas)) {
    if (valor && typeof valor === "object") {
      if (valor.chat) registrarAviso(sender, clave, valor.chat, valor.avisado || 0);
      cuenta.rachas[clave] = Number(valor.cantidad) || 0;
    }
  }
  return cuenta;
}

export function guardarDatos(sender) {
  saveAccount(sender);
}

export function registrarAviso(sender, clave, chat, avisado = 0) {
  if (!local[sender]) local[sender] = { avisos: {} };
  local[sender].avisos[clave] = { chat, avisado };
  guardarAvisos();
}

export function avisoDe(sender, clave) {
  return local[sender] && local[sender].avisos ? local[sender].avisos[clave] || null : null;
}

export function cuentasConDatos() {
  return getAllAccounts().entries();
}

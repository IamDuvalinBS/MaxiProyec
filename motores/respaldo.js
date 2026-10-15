import { createClient } from "@libsql/client/web";
import { createHash } from "crypto";
import chalk from "chalk";
import { obtenerBase, recargarDatos, guardarCuentasPendientes } from "./db.js";
import { restaurarGacha } from "./respaldo-gacha.js";
import { guardarGachaPendiente, recargarGacha } from "./gacha-db.js";

const TURSO_URL = process.env.TURSO_URL || "libsql://duva-duvalipan.aws-ap-northeast-1.turso.io";
const TURSO_TOKEN =
  process.env.TURSO_TOKEN ||
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTE5NTkzMTIsImlkIjoiMDFhMTM5MTgtMTEwMS03ZDFiLWE4MmMtNDczYzVmMmRlMmQ1Iiwia2lkIjoiZXlDSnN2UTZ3c3hHMFQ1MGNCY1FJTktxRDBCenU3aUt0VnRIeFBCQkNzRSIsInJpZCI6ImI5NTgxNDZlLWRhYTgtNDg2OS05OGVjLWQwZGMyODdmMTVjMiJ9.RDuo3OSoOQSP5KNlFGEjYGZBKBUN-xByGSl-O6qGqDiMb51w1mbSVukx8_slcxM8howNPszaxwqsaVreiYTpCg";
const MINUTOS = Math.max(5, Number(process.env.RESPALDO_MINUTOS) || 30);
const INTERVALO_MS = MINUTOS * 60 * 1000;
const RETARDO_INICIAL_MS = 15000;
const TAMANO_LOTE_TURSO = 100;
const TAMANO_LOTE_MONGO = 500;
const SEPARADOR = "\u0000";
const EXCLUIDAS = new Set(
  (process.env.RESPALDO_EXCLUIR || "")
    .split(",")
    .map((nombre) => nombre.trim())
    .filter(Boolean)
);

let cliente = null;
let temporizador = null;
let ocupado = false;
let ultimoResultado = null;

function obtenerCliente() {
  if (!TURSO_URL || !TURSO_TOKEN) return null;
  if (!cliente) cliente = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  return cliente;
}

function calcularHuella(texto) {
  return createHash("sha1").update(texto).digest("hex");
}

async function prepararTabla(c) {
  await c.execute(
    "CREATE TABLE IF NOT EXISTS respaldo (" +
      "coleccion TEXT NOT NULL, " +
      "id TEXT NOT NULL, " +
      "datos TEXT NOT NULL, " +
      "huella TEXT NOT NULL, " +
      "actualizado INTEGER NOT NULL, " +
      "PRIMARY KEY (coleccion, id))"
  );
}

async function ejecutarEnLotes(c, sentencias) {
  for (let i = 0; i < sentencias.length; i += TAMANO_LOTE_TURSO) {
    await c.batch(sentencias.slice(i, i + TAMANO_LOTE_TURSO), "write");
  }
}

async function listarNombres(base) {
  const lista = await base.listCollections({}, { nameOnly: true }).toArray();
  return lista
    .map((coleccion) => coleccion.name)
    .filter((nombre) => !nombre.startsWith("system.") && !EXCLUIDAS.has(nombre));
}

export function respaldoConfigurado() {
  return Boolean(TURSO_URL && TURSO_TOKEN);
}

export function obtenerEstadoRespaldo() {
  return { configurado: respaldoConfigurado(), minutos: MINUTOS, ocupado, ultimo: ultimoResultado };
}

export async function respaldarAhora() {
  if (ocupado) return { omitido: true };
  const base = obtenerBase();
  if (!base) throw new Error("MongoDB no está conectado.");
  const c = obtenerCliente();
  if (!c) throw new Error("Faltan las variables TURSO_URL y TURSO_TOKEN.");

  ocupado = true;
  try {
    await guardarCuentasPendientes();
    await guardarGachaPendiente();
    await prepararTabla(c);

    const existentes = new Map();
    const filas = await c.execute("SELECT coleccion, id, huella FROM respaldo");
    for (const fila of filas.rows) existentes.set(fila.coleccion + SEPARADOR + fila.id, fila.huella);

    const resumen = { nuevos: 0, actualizados: 0, eliminados: 0, sinCambios: 0 };
    const vistos = new Set();
    const sentencias = [];
    const ahora = Date.now();

    const nombres = await listarNombres(base);

    for (const nombre of nombres) {
      for await (const doc of base.collection(nombre).find({})) {
        const id = String(doc._id);
        const clave = nombre + SEPARADOR + id;
        vistos.add(clave);
        const datos = JSON.stringify(doc);
        const huella = calcularHuella(datos);
        const previa = existentes.get(clave);
        if (previa === huella) {
          resumen.sinCambios++;
          continue;
        }
        if (previa === undefined) resumen.nuevos++;
        else resumen.actualizados++;
        sentencias.push({
          sql:
            "INSERT INTO respaldo (coleccion, id, datos, huella, actualizado) VALUES (?, ?, ?, ?, ?) " +
            "ON CONFLICT(coleccion, id) DO UPDATE SET datos = excluded.datos, huella = excluded.huella, actualizado = excluded.actualizado",
          args: [nombre, id, datos, huella, ahora]
        });
      }
    }

    if (vistos.size > 0) {
      for (const clave of existentes.keys()) {
        if (vistos.has(clave)) continue;
        const [nombre, id] = clave.split(SEPARADOR);
        resumen.eliminados++;
        sentencias.push({ sql: "DELETE FROM respaldo WHERE coleccion = ? AND id = ?", args: [nombre, id] });
      }
    }

    await ejecutarEnLotes(c, sentencias);
    ultimoResultado = { fecha: ahora, ok: true, ...resumen, total: vistos.size, colecciones: nombres.length };
    return ultimoResultado;
  } catch (e) {
    ultimoResultado = { fecha: Date.now(), ok: false, error: e.message };
    throw e;
  } finally {
    ocupado = false;
  }
}

export async function restaurarDesdeRespaldo() {
  if (ocupado) throw new Error("Hay un respaldo en curso. Intenta de nuevo en un momento.");
  const base = obtenerBase();
  if (!base) throw new Error("MongoDB no está conectado.");
  const c = obtenerCliente();
  if (!c) throw new Error("Faltan las variables TURSO_URL y TURSO_TOKEN.");

  ocupado = true;
  try {
    await prepararTabla(c);
    const filas = await c.execute("SELECT coleccion, datos FROM respaldo");
    if (!filas.rows.length) throw new Error("El respaldo en Turso está vacío.");

    const porColeccion = new Map();
    for (const fila of filas.rows) {
      if (EXCLUIDAS.has(fila.coleccion)) continue;
      if (!porColeccion.has(fila.coleccion)) porColeccion.set(fila.coleccion, []);
      porColeccion.get(fila.coleccion).push(JSON.parse(fila.datos));
    }

    const resumen = {};
    for (const [nombre, docs] of porColeccion) {
      for (let i = 0; i < docs.length; i += TAMANO_LOTE_MONGO) {
        const operaciones = docs.slice(i, i + TAMANO_LOTE_MONGO).map((doc) => ({
          replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
        }));
        await base.collection(nombre).bulkWrite(operaciones, { ordered: false });
      }
      resumen[nombre] = docs.length;
    }

    await recargarDatos();
    await recargarGacha();
    return resumen;
  } finally {
    ocupado = false;
  }
}

async function respaldoProgramado() {
  try {
    const r = await respaldarAhora();
    if (r.omitido) return;
    console.log(
      chalk.cyan(
        `Respaldo en Turso: ${r.nuevos} nuevos, ${r.actualizados} actualizados, ${r.eliminados} eliminados, ${r.sinCambios} sin cambios`
      )
    );
  } catch (e) {
    console.log(chalk.yellow("Respaldo en Turso fallido: " + e.message));
  }
}

export function iniciarRespaldo() {
  if (!respaldoConfigurado()) {
    console.log(chalk.yellow("Respaldo en Turso desactivado: faltan las variables TURSO_URL y TURSO_TOKEN."));
    return;
  }
  if (temporizador) return;
  console.log(chalk.cyan(`Respaldo en Turso activo, se ejecuta cada ${MINUTOS} minutos.`));
restaurarGacha(obtenerCliente()).then((n) => { if (n) console.log(chalk.cyan("Gacha restaurado desde Turso: " + n + " filas")); }).catch((e) => console.log(chalk.yellow("Restaurar gacha falló: " + e.message)));
  setTimeout(respaldoProgramado, RETARDO_INICIAL_MS);
  temporizador = setInterval(respaldoProgramado, INTERVALO_MS);
}

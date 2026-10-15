import fs from "fs";
import path from "path";
import { initGachaDB, hayDatosGacha, importarTablasGacha } from "./gacha-db.js";

const RUTA = process.env.GACHA_DB_PATH || path.resolve("./data/gacha.db");
const TABLAS = ["personajes", "propiedad", "inventario", "yandere_posts", "yandere_tags"];

async function abrirSqlite() {
  try {
    const { DatabaseSync } = await import("node:sqlite");
    return new DatabaseSync(RUTA);
  } catch {
    const mod = await import("better-sqlite3");
    return new mod.default(RUTA);
  }
}

export async function leerSqliteLocal() {
  if (!fs.existsSync(RUTA)) return null;
  const db = await abrirSqlite();
  try {
    const tablas = {};
    for (const t of TABLAS) {
      try {
        tablas[t] = db.prepare(`SELECT * FROM "${t}"`).all();
      } catch {
        tablas[t] = [];
      }
    }
    return tablas;
  } finally {
    db.close();
  }
}

export function archivarSqliteLocal() {
  const sello = new Date().toISOString().replace(/[:.]/g, "-");
  for (const ext of ["", "-wal", "-shm"]) {
    const origen = RUTA + ext;
    if (fs.existsSync(origen)) fs.renameSync(origen, `${RUTA}.migrado-${sello}${ext}`);
  }
}

export async function restaurarGacha(c) {
  if (!c) return 0;
  await initGachaDB();
  if (hayDatosGacha()) return 0;
  let filas;
  try {
    filas = (await c.execute("SELECT tabla, id, datos FROM respaldo_gacha")).rows;
  } catch {
    return 0;
  }
  if (!filas.length) return 0;
  const tablas = {};
  for (const f of filas) {
    if (f.id === "__esquema__") continue;
    const { _rid, ...columnas } = JSON.parse(f.datos);
    (tablas[f.tabla] ||= []).push(columnas);
  }
  return importarTablasGacha(tablas);
}

import fs from "fs";
import path from "path";

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


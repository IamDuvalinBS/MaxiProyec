import { createHash } from "crypto";
import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";

const RUTA = process.env.GACHA_DB_PATH || path.resolve("./data/gacha.db");
const SEP = "\u0000";
const LOTE = 100;

const huella = (t) => createHash("sha1").update(t).digest("hex");

async function preparar(c) {
  await c.execute(
    "CREATE TABLE IF NOT EXISTS respaldo_gacha (" +
      "tabla TEXT NOT NULL, id TEXT NOT NULL, datos TEXT NOT NULL, huella TEXT NOT NULL, " +
      "PRIMARY KEY (tabla, id))"
  );
}

export async function respaldarGacha(c) {
  if (!c || !fs.existsSync(RUTA)) return null;
  const db = new DatabaseSync(RUTA);
  try {
    await preparar(c);
    const previos = new Map();
    const r = await c.execute("SELECT tabla, id, huella FROM respaldo_gacha");
    for (const f of r.rows) previos.set(f.tabla + SEP + f.id, f.huella);

    const vistos = new Set();
    const conDatos = new Set();
    const sentencias = [];
    let cambios = 0;
    let borrados = 0;

    const tablas = db
      .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all();

    for (const t of tablas) {
      const filas = [{ id: "__esquema__", datos: t.sql }];
      for (const f of db.prepare(`SELECT rowid AS _rid, * FROM "${t.name}"`).all()) {
        filas.push({ id: String(f._rid), datos: JSON.stringify(f) });
      }
      if (filas.length > 1) conDatos.add(t.name);
      for (const { id, datos } of filas) {
        const clave = t.name + SEP + id;
        vistos.add(clave);
        const h = huella(datos);
        if (previos.get(clave) === h) continue;
        cambios++;
        sentencias.push({
          sql:
            "INSERT INTO respaldo_gacha (tabla, id, datos, huella) VALUES (?, ?, ?, ?) " +
            "ON CONFLICT(tabla, id) DO UPDATE SET datos = excluded.datos, huella = excluded.huella",
          args: [t.name, id, datos, h]
        });
      }
    }

    for (const clave of previos.keys()) {
      const [tabla, id] = clave.split(SEP);
      if (!conDatos.has(tabla) || vistos.has(clave)) continue;
      borrados++;
      sentencias.push({ sql: "DELETE FROM respaldo_gacha WHERE tabla = ? AND id = ?", args: [tabla, id] });
    }

    for (let i = 0; i < sentencias.length; i += LOTE) {
      await c.batch(sentencias.slice(i, i + LOTE), "write");
    }
    return { cambios, borrados };
  } finally {
    db.close();
  }
}

export async function restaurarGacha(c) {
  if (!c) return 0;
  fs.mkdirSync(path.dirname(RUTA), { recursive: true });
  const db = new DatabaseSync(RUTA);
  try {
    const existe = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='propiedad'").get();
    if (existe && db.prepare("SELECT COUNT(*) n FROM propiedad").get().n > 0) return 0;

    await preparar(c);
    const r = await c.execute("SELECT tabla, id, datos FROM respaldo_gacha");
    if (!r.rows.length) return 0;

    const porTabla = new Map();
    for (const f of r.rows) {
      if (!porTabla.has(f.tabla)) porTabla.set(f.tabla, []);
      porTabla.get(f.tabla).push(f);
    }

    db.exec("PRAGMA foreign_keys = OFF");
    for (const filas of porTabla.values()) {
      const esq = filas.find((f) => f.id === "__esquema__");
      if (esq) db.exec(esq.datos.replace(/^CREATE TABLE\s+(IF NOT EXISTS\s+)?/i, "CREATE TABLE IF NOT EXISTS "));
    }

    let total = 0;
    db.exec("BEGIN");
    try {
      for (const [tabla, filas] of porTabla) {
        for (const f of filas) {
          if (f.id === "__esquema__") continue;
          const { _rid, ...cols } = JSON.parse(f.datos);
          const nombres = ["rowid", ...Object.keys(cols)];
          db.prepare(
            `INSERT OR REPLACE INTO "${tabla}" (${nombres.map((n) => `"${n}"`).join(",")}) VALUES (${nombres.map(() => "?").join(",")})`
          ).run(_rid, ...Object.values(cols));
          total++;
        }
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    return total;
  } finally {
    db.close();
  }
}

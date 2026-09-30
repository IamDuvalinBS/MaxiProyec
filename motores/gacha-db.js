// Base de datos DEL GACHA, totalmente separada de MongoDB.
//  - Es un archivo SQLite en disco (no vive en RAM; cache_size fijado en ~2 MB).
import fs from "fs";
import path from "path";

const RUTA_DB = process.env.GACHA_DB_PATH || path.resolve("./data/gacha.db");

let db = null;

async function abrir() {
  fs.mkdirSync(path.dirname(RUTA_DB), { recursive: true });
  try {
    const { DatabaseSync } = await import("node:sqlite");
    return new DatabaseSync(RUTA_DB);
  } catch (e1) {
    try {
      const mod = await import("better-sqlite3");
      return new mod.default(RUTA_DB);
    } catch (e2) {
      throw new Error(
        "No hay motor SQLite disponible. Usá Node 22.5+ (node:sqlite) o instalá better-sqlite3 (npm i better-sqlite3)."
      );
    }
  }
}

function esquema() {
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA cache_size = -2000");
  db.exec("PRAGMA mmap_size = 0");
  db.exec("PRAGMA temp_store = FILE");
  db.exec("PRAGMA journal_size_limit = 4194304");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS personajes (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT    NOT NULL,            -- waifu | pokemon | brawler
      clave     TEXT    NOT NULL,            -- waifu: tag del personaje | pokemon: nro pokedex | brawler: id
      nombre    TEXT    NOT NULL,
      serie     TEXT    NOT NULL DEFAULT '',
      genero    TEXT    NOT NULL DEFAULT '',
      rareza    TEXT    NOT NULL DEFAULT 'Común',
      valor     INTEGER NOT NULL DEFAULT 1000,
      img       TEXT    NOT NULL,            -- SOLO la URL, nunca la imagen
      stats     TEXT,                        -- JSON
      meta      TEXT,                        -- JSON
      creado    INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      UNIQUE (categoria, clave)
    );
    CREATE INDEX IF NOT EXISTS idx_personajes_cat ON personajes(categoria);

    CREATE TABLE IF NOT EXISTS propiedad (
      usuario   TEXT    NOT NULL,
      char_id   INTEGER NOT NULL REFERENCES personajes(id) ON DELETE CASCADE,
      obtenido  INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      nivel     INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (usuario, char_id)
    );
    CREATE INDEX IF NOT EXISTS idx_prop_char ON propiedad(char_id);

    -- Registro de TODOS los posts de yande.re ya procesados (sirve de verificador de duplicados)
    CREATE TABLE IF NOT EXISTS yandere_posts (
      post_id   INTEGER PRIMARY KEY,
      md5       TEXT,
      parent_id INTEGER,
      char_id   INTEGER,
      estado    TEXT NOT NULL,               -- ok | sin_personaje | varios_personajes | duplicado | rating
      creado    INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_yp_md5 ON yandere_posts(md5);
    CREATE INDEX IF NOT EXISTS idx_yp_parent ON yandere_posts(parent_id);

    -- Inventario simple (cubitos de fuerza, etc.)
    CREATE TABLE IF NOT EXISTS inventario (
      usuario  TEXT    NOT NULL,
      item     TEXT    NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (usuario, item)
    );

    -- Cache de tipos de tag de yande.re (0 general, 1 artista, 3 copyright, 4 personaje, 5 circulo, 6 faults)
    CREATE TABLE IF NOT EXISTS yandere_tags (
      nombre TEXT PRIMARY KEY,
      tipo   INTEGER NOT NULL
    );
  `);
}

function migrar() {
  const cols = db.prepare("PRAGMA table_info(propiedad)").all().map((c) => c.name);
  if (!cols.includes("nivel")) db.exec("ALTER TABLE propiedad ADD COLUMN nivel INTEGER NOT NULL DEFAULT 1");
}

export async function initGachaDB() {
  if (db) return db;
  db = await abrir();
  esquema();
  migrar();
  return db;
}

const sentencias = new Map();
function st(sql) {
  let s = sentencias.get(sql);
  if (!s) { s = db.prepare(sql); sentencias.set(sql, s); }
  return s;
}

function q() {
  if (!db) throw new Error("La base del gacha no está inicializada (initGachaDB).");
  return db;
}

function transaccion(fn) {
  const d = q();
  d.exec("BEGIN");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    try { d.exec("ROLLBACK"); } catch {}
    throw e;
  }
}

export const enTransaccion = (fn) => transaccion(fn);

const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
function hidratar(row) {
  if (!row) return null;
  return { ...row, stats: parse(row.stats), meta: parse(row.meta) };
}

export function crearPersonaje({ categoria, clave, nombre, serie = "", genero = "", rareza = "Común", valor = 1000, img, stats = null, meta = null }) {
  const r = st(
    `INSERT OR IGNORE INTO personajes (categoria, clave, nombre, serie, genero, rareza, valor, img, stats, meta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(categoria, String(clave), nombre, serie, genero, rareza, Math.round(valor), img,
    stats ? JSON.stringify(stats) : null, meta ? JSON.stringify(meta) : null);
  if (!r.changes) return null;
  return { id: Number(r.lastInsertRowid) };
}

export function personajePorId(id) {
  return hidratar(st("SELECT * FROM personajes WHERE id = ?").get(id));
}

export function personajePorClave(categoria, clave) {
  return hidratar(st("SELECT * FROM personajes WHERE categoria = ? AND clave = ?").get(categoria, String(clave)));
}

export function personajeAleatorio(categoria, { soloLibres = false } = {}) {
  const lim = st("SELECT MIN(id) AS a, MAX(id) AS b FROM personajes WHERE categoria = ?").get(categoria);
  if (!lim || lim.a == null) return null;
  const libre = "AND NOT EXISTS (SELECT 1 FROM propiedad o WHERE o.char_id = p.id)";
  const sqlSalto = `SELECT * FROM personajes p WHERE categoria = ? AND id >= ? ${soloLibres ? libre : ""} LIMIT 1`;
  for (let i = 0; i < 5; i++) {
    const desde = lim.a + Math.floor(Math.random() * (lim.b - lim.a + 1));
    const row = st(sqlSalto).get(categoria, desde);
    if (row) return hidratar(row);
  }
  if (soloLibres) {
    const row = st(`SELECT * FROM personajes p WHERE categoria = ? ${libre} ORDER BY RANDOM() LIMIT 1`).get(categoria);
    if (row) return hidratar(row);
  }
  return hidratar(st("SELECT * FROM personajes WHERE categoria = ? ORDER BY RANDOM() LIMIT 1").get(categoria));
}

export function personajeAleatorioPonderado(categoria, pesos) {
  const filas = st("SELECT rareza, COUNT(*) AS n FROM personajes WHERE categoria = ? GROUP BY rareza").all(categoria);
  if (!filas.length) return null;
  const pond = filas.map((f) => ({ rareza: f.rareza, peso: pesos[f.rareza] ?? 10 }));
  let x = Math.random() * pond.reduce((a, b) => a + b.peso, 0);
  let elegida = pond[pond.length - 1].rareza;
  for (const f of pond) { if ((x -= f.peso) < 0) { elegida = f.rareza; break; } }
  return hidratar(st("SELECT * FROM personajes WHERE categoria = ? AND rareza = ? ORDER BY RANDOM() LIMIT 1").get(categoria, elegida));
}

export function contarPersonajes(categoria) {
  return st("SELECT COUNT(*) AS n FROM personajes WHERE categoria = ?").get(categoria).n;
}

export function propietarios(charId) {
  return st("SELECT usuario FROM propiedad WHERE char_id = ? ORDER BY obtenido").all(charId).map((r) => r.usuario);
}

export function leTiene(usuario, charId) {
  return !!st("SELECT 1 FROM propiedad WHERE usuario = ? AND char_id = ?").get(usuario, charId);
}

export function reclamar(usuario, personaje) {
  return transaccion(() => {
    if (personaje.categoria === "waifu" && propietarios(personaje.id).length) return "ocupado";
    if (leTiene(usuario, personaje.id)) return "repetido";
    st("INSERT INTO propiedad (usuario, char_id) VALUES (?, ?)").run(usuario, personaje.id);
    return "ok";
  });
}

export function coleccionDe(usuario, categoria, limite = 15, desplazamiento = 0) {
  return st(
    `SELECT p.*, o.obtenido, o.nivel FROM propiedad o JOIN personajes p ON p.id = o.char_id
     WHERE o.usuario = ? AND p.categoria = ?
     ORDER BY p.valor DESC, p.id ASC LIMIT ? OFFSET ?`
  ).all(usuario, categoria, limite, desplazamiento).map(hidratar);
}

export function contarColeccion(usuario, categoria) {
  return st(
    `SELECT COUNT(*) AS n, COALESCE(SUM(p.valor),0) AS total FROM propiedad o JOIN personajes p ON p.id = o.char_id
     WHERE o.usuario = ? AND p.categoria = ?`
  ).get(usuario, categoria);
}

export function mejorDe(usuario, categoria, charId = null) {
  if (charId) {
    return hidratar(st(
      `SELECT p.*, o.obtenido, o.nivel FROM propiedad o JOIN personajes p ON p.id = o.char_id
       WHERE o.usuario = ? AND p.categoria = ? AND p.id = ?`
    ).get(usuario, categoria, charId));
  }
  return hidratar(st(
    `SELECT p.*, o.obtenido, o.nivel FROM propiedad o JOIN personajes p ON p.id = o.char_id
     WHERE o.usuario = ? AND p.categoria = ?
     ORDER BY o.nivel DESC, p.valor DESC, p.id ASC LIMIT 1`
  ).get(usuario, categoria));
}

export function setNivel(usuario, charId, nivel) {
  st("UPDATE propiedad SET nivel = ? WHERE usuario = ? AND char_id = ?").run(nivel, usuario, charId);
}

export function cantidadItem(usuario, item) {
  const r = st("SELECT cantidad FROM inventario WHERE usuario = ? AND item = ?").get(usuario, item);
  return r ? r.cantidad : 0;
}

export function sumarItem(usuario, item, delta) {
  st(`INSERT INTO inventario (usuario, item, cantidad) VALUES (?, ?, ?)
      ON CONFLICT(usuario, item) DO UPDATE SET cantidad = cantidad + excluded.cantidad`).run(usuario, item, delta);
}

export function listarPersonajes(categoria, limite = 20, desplazamiento = 0) {
  return st(
    `SELECT p.*, (SELECT COUNT(*) FROM propiedad o WHERE o.char_id = p.id) AS duenos
     FROM personajes p WHERE p.categoria = ? ORDER BY p.valor DESC, p.id ASC LIMIT ? OFFSET ?`
  ).all(categoria, limite, desplazamiento).map(hidratar);
}

export function resumenGacha() {
  const porCategoria = st("SELECT categoria, COUNT(*) AS n FROM personajes GROUP BY categoria").all();
  const porRareza = st("SELECT categoria, rareza, COUNT(*) AS n FROM personajes GROUP BY categoria, rareza ORDER BY MAX(valor) DESC").all();
  const reclamados = st(
    `SELECT p.categoria, COUNT(DISTINCT o.char_id) AS n FROM propiedad o JOIN personajes p ON p.id = o.char_id GROUP BY p.categoria`
  ).all();
  const yandere = st("SELECT estado, COUNT(*) AS n FROM yandere_posts GROUP BY estado").all();
  return { porCategoria, porRareza, reclamados, yandere };
}

export function yandereDuplicado({ post_id, md5, parent_id }) {
  const d = q();
  if (st("SELECT 1 FROM yandere_posts WHERE post_id = ?").get(post_id)) return "post";
  if (md5 && st("SELECT 1 FROM yandere_posts WHERE md5 = ?").get(md5)) return "md5";
  // versión alternativa (hijo/padre) de un post que ya registramos
  if (parent_id && st("SELECT 1 FROM yandere_posts WHERE post_id = ? OR parent_id = ?").get(parent_id, parent_id)) return "parent";
  if (st("SELECT 1 FROM yandere_posts WHERE parent_id = ?").get(post_id)) return "parent";
  return null;
}

export function yandereRegistrar({ post_id, md5, parent_id, char_id = null, estado }) {
  st(
    "INSERT OR REPLACE INTO yandere_posts (post_id, md5, parent_id, char_id, estado) VALUES (?, ?, ?, ?, ?)"
  ).run(post_id, md5 || null, parent_id || null, char_id, estado);
}

export function yandereTagTipo(nombre) {
  const r = st("SELECT tipo FROM yandere_tags WHERE nombre = ?").get(nombre);
  return r ? r.tipo : null;
}

export function yandereTagGuardar(nombre, tipo) {
  st("INSERT OR REPLACE INTO yandere_tags (nombre, tipo) VALUES (?, ?)").run(nombre, tipo);
}

export function yandereCrearPersonaje(datos, post) {
  return transaccion(() => {
    const creado = crearPersonaje(datos);
    if (!creado) return null;
    yandereRegistrar({ post_id: post.post_id, md5: post.md5, parent_id: post.parent_id, char_id: creado.id, estado: "ok" });
    return creado;
  });
}

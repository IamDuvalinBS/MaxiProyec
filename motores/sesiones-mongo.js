import fs from "fs";
import path from "path";
import * as baileys from "@fer2809fl/baileys";
import { obtenerBase } from "./db.js";

const COLECCION_SUBS = "subbots";
const COLECCION_CLAVES = "subbots_keys";
const CACHE_MAX = 300;
const CACHE_TTL_MS = 10 * 60000;

function serializar(valor) {
  return JSON.parse(JSON.stringify(valor, baileys.BufferJSON.replacer));
}

function restaurar(valor) {
  return JSON.parse(JSON.stringify(valor), baileys.BufferJSON.reviver);
}

function cacheChica() {
  const mapa = new Map();
  return {
    get(clave) {
      const entrada = mapa.get(clave);
      if (!entrada) return undefined;
      if (Date.now() > entrada.vence) {
        mapa.delete(clave);
        return undefined;
      }
      return entrada.valor;
    },
    set(clave, valor) {
      if (mapa.size >= CACHE_MAX && !mapa.has(clave)) mapa.delete(mapa.keys().next().value);
      mapa.set(clave, { valor, vence: Date.now() + CACHE_TTL_MS });
    },
    del(clave) {
      mapa.delete(clave);
    },
    flushAll() {
      mapa.clear();
    }
  };
}

function colecciones() {
  const base = obtenerBase();
  if (!base) throw new Error("MongoDB no está disponible");
  return { subs: base.collection(COLECCION_SUBS), claves: base.collection(COLECCION_CLAVES) };
}

export function sesionesDisponibles() {
  return Boolean(obtenerBase());
}

export async function cargarEstadoSub(numero, logger) {
  const { subs, claves } = colecciones();
  const doc = await subs.findOne({ _id: numero });
  const creds = doc && doc.creds ? restaurar(doc.creds) : baileys.initAuthCreds();
  const prefijo = `${numero}|`;

  // Cada guardado se espera hasta que MongoDB lo confirma (como siempre), pero en fila y en orden: dos guardados
  // seguidos ya no pueden llegar al revés y dejar una clave vieja encima de la nueva. Mientras tanto se lee de memoria.
  const pendientes = new Map();
  let volcando = Promise.resolve();

  const volcar = () => {
    if (!pendientes.size) return volcando;
    const lote = [...pendientes];
    pendientes.clear();
    const operaciones = lote.map(([_id, v]) =>
      v === null ? { deleteOne: { filter: { _id } } } : { updateOne: { filter: { _id }, update: { $set: { v: serializar(v) } }, upsert: true } }
    );
    const mio = volcando.catch(() => {}).then(() => claves.bulkWrite(operaciones, { ordered: false }));
    volcando = mio.catch(() => {});
    return mio.catch((e) => {
      for (const [_id, v] of lote) if (!pendientes.has(_id)) pendientes.set(_id, v);   // se reintenta en el siguiente guardado
      throw e;
    });
  };

  const almacen = {
    get: async (tipo, ids) => {
      const salida = {};
      if (!ids.length) return salida;
      const faltan = [];
      for (const id of ids) {
        const clave = `${prefijo}${tipo}-${id}`;
        if (pendientes.has(clave)) {
          const v = pendientes.get(clave);
          if (v !== null) salida[id] = v;
        } else faltan.push(id);
      }
      if (!faltan.length) return salida;
      const docs = await claves.find({ _id: { $in: faltan.map((id) => `${prefijo}${tipo}-${id}`) } }).toArray();
      const porId = new Map(docs.map((d) => [d._id, d.v]));
      for (const id of faltan) {
        const guardado = porId.get(`${prefijo}${tipo}-${id}`);
        if (guardado === undefined) continue;
        let valor = restaurar(guardado);
        const fromObject = baileys.proto?.Message?.AppStateSyncKeyData?.fromObject;
        if (tipo === "app-state-sync-key" && valor && fromObject) valor = fromObject(valor);
        salida[id] = valor;
      }
      return salida;
    },
    set: async (datos) => {
      for (const tipo of Object.keys(datos)) {
        for (const id of Object.keys(datos[tipo])) pendientes.set(`${prefijo}${tipo}-${id}`, datos[tipo][id] || null);
      }
      await volcar();
    }
  };

  const cacheable = baileys.makeCacheableSignalKeyStore;
  const keys = cacheable ? cacheable(almacen, logger, cacheChica()) : almacen;

  const guardarCreds = async () => {
    await subs.updateOne(
      { _id: numero },
      { $set: { creds: serializar(creds), actualizado: Date.now() }, $setOnInsert: { creado: Date.now() } },
      { upsert: true }
    );
  };

  const vaciar = async () => { await volcar().catch(() => {}); await volcando; };
  return { state: { creds, keys }, guardarCreds, vaciar };
}

export async function guardarMetaSub(numero, meta) {
  const { subs } = colecciones();
  await subs.updateOne({ _id: numero }, { $set: meta, $setOnInsert: { creado: Date.now() } }, { upsert: true });
}

export async function listarSubsGuardados() {
  const { subs } = colecciones();
  const docs = await subs.find({}, { projection: { "creds.me": 1, dueno: 1, creado: 1 } }).toArray();
  return docs.map((d) => ({ numero: d._id, vinculado: Boolean(d.creds && d.creds.me), dueno: d.dueno || null, creado: d.creado || null }));
}

export async function existeSub(numero) {
  const { subs } = colecciones();
  const doc = await subs.findOne({ _id: numero }, { projection: { "creds.me": 1 } });
  return doc ? { vinculado: Boolean(doc.creds && doc.creds.me) } : null;
}

export async function eliminarSub(numero) {
  const { subs, claves } = colecciones();
  const digitos = String(numero).replace(/\D/g, "");
  await claves.deleteMany({ _id: { $regex: `^${digitos}\\|` } });
  await subs.deleteOne({ _id: numero });
}

// Borra solo las sesiones de cifrado (conversaciones). Conserva credenciales, pre-claves y claves de sincronización.
export async function limpiarSesionesSignal(numero) {
  const { claves } = colecciones();
  const digitos = String(numero).replace(/\D/g, "");
  await claves.deleteMany({ _id: { $regex: `^${digitos}\\|(session|sender-key|sender-key-memory)-` } });
}

// ───────────── Sesión del bot principal (carpeta auth_info) ─────────────
// Mismo formato que useMultiFileAuthState (no hay que volver a vincular), pero cada archivo se escribe de forma
// atómica (archivo temporal + fsync + renombrar) y en fila, así que si Termux se cierra a mitad de un guardado
// nunca queda un archivo a medias. creds.json además tiene copia de seguridad.
const colasArchivo = new Map();

function enFila(archivo, tarea) {
  const previa = colasArchivo.get(archivo) || Promise.resolve();
  const siguiente = previa.catch(() => {}).then(tarea);
  colasArchivo.set(archivo, siguiente);
  siguiente.catch(() => {}).finally(() => { if (colasArchivo.get(archivo) === siguiente) colasArchivo.delete(archivo); });
  return siguiente;
}

async function escribirAtomico(archivo, texto) {
  const temporal = `${archivo}.${process.pid}.tmp`;
  const fd = await fs.promises.open(temporal, "w");
  try {
    await fd.writeFile(texto);
    await fd.sync();
  } finally {
    await fd.close();
  }
  await fs.promises.rename(temporal, archivo);
}

export async function sesionPrincipal(carpeta, logger) {
  const dir = path.resolve(carpeta);
  await fs.promises.mkdir(dir, { recursive: true });
  const ruta = (nombre) => path.join(dir, nombre.replace(/\//g, "__").replace(/:/g, "-"));

  const leer = async (archivo, borrarSiEstaDanado) => {
    let texto;
    try {
      texto = await fs.promises.readFile(archivo, "utf8");
    } catch {
      return undefined;
    }
    try {
      return JSON.parse(texto, baileys.BufferJSON.reviver);
    } catch {
      if (borrarSiEstaDanado) fs.promises.unlink(archivo).catch(() => {});
      return undefined;
    }
  };

  const archivoCreds = ruta("creds.json");
  const archivoCopia = ruta("creds.json.bak");
  let creds = await leer(archivoCreds, false);
  if (!creds) {
    creds = await leer(archivoCopia, false);
    if (creds) console.log("⚠️ creds.json estaba dañado: se restauró la copia de seguridad (no hace falta vincular de nuevo).");
  }
  if (!creds) creds = baileys.initAuthCreds();

  let ultimaCopia = 0;
  const saveCreds = () =>
    enFila(archivoCreds, async () => {
      if (Date.now() - ultimaCopia > 10 * 60000) {   // la copia solo se actualiza si el creds.json actual está sano
        ultimaCopia = Date.now();
        try {
          const actual = await fs.promises.readFile(archivoCreds, "utf8");
          JSON.parse(actual);
          await escribirAtomico(archivoCopia, actual);
        } catch {}
      }
      await escribirAtomico(archivoCreds, JSON.stringify(creds, baileys.BufferJSON.replacer));
    });

  const almacen = {
    get: async (tipo, ids) => {
      const salida = {};
      await Promise.all(
        ids.map(async (id) => {
          let valor = await leer(ruta(`${tipo}-${id}.json`), true);
          if (valor === undefined) return;
          const fromObject = baileys.proto?.Message?.AppStateSyncKeyData?.fromObject;
          if (tipo === "app-state-sync-key" && fromObject) valor = fromObject(valor);
          salida[id] = valor;
        })
      );
      return salida;
    },
    set: async (datos) => {
      const tareas = [];
      for (const tipo of Object.keys(datos)) {
        for (const id of Object.keys(datos[tipo])) {
          const archivo = ruta(`${tipo}-${id}.json`);
          const valor = datos[tipo][id];
          tareas.push(
            enFila(archivo, () => (valor ? escribirAtomico(archivo, JSON.stringify(valor, baileys.BufferJSON.replacer)) : fs.promises.unlink(archivo).catch(() => {})))
          );
        }
      }
      await Promise.all(tareas);
    }
  };

  const cacheable = baileys.makeCacheableSignalKeyStore;
  return { state: { creds, keys: cacheable ? cacheable(almacen, logger, cacheChica()) : almacen }, saveCreds };
}

// Borra solo las sesiones de cifrado del principal (conserva creds.json, pre-claves y claves de sincronización).
export async function limpiarSesionesLocales(carpeta) {
  const dir = path.resolve(carpeta);
  let borrados = 0;
  for (const nombre of await fs.promises.readdir(dir).catch(() => [])) {
    if (/^(session|sender-key|sender-key-memory)-.*\.json$/.test(nombre)) {
      await fs.promises.unlink(path.join(dir, nombre)).then(() => borrados++).catch(() => {});
    }
  }
  return borrados;
}

// Si llegan muchos mensajes que no se pueden descifrar y ninguno se lee bien, la sesión de cifrado está dañada:
// avisa para repararla (una vez cada 6 horas como máximo por socket).
const FALLAS_PARA_REPARAR = 8;
const VENTANA_FALLAS_MS = 10 * 60000;
const ESPERA_ENTRE_REPARACIONES_MS = 6 * 3600000;
const ultimaReparacion = new Map();

export function vigilarDescifrado(sock, etiqueta, reparar) {
  const CIFRADO = baileys.proto?.WebMessageInfo?.StubType?.CIPHERTEXT ?? 2;
  let fallas = [];
  sock.ev.on("messages.upsert", (m) => {
    const ahora = Date.now();
    for (const msg of m.messages || []) {
      if (msg.key?.fromMe) continue;
      if (msg.messageStubType === CIFRADO && !msg.message) {
        fallas = fallas.filter((t) => ahora - t < VENTANA_FALLAS_MS);
        fallas.push(ahora);
      } else if (msg.message) {
        fallas = [];
      }
    }
    if (fallas.length < FALLAS_PARA_REPARAR) return;
    if (ahora - (ultimaReparacion.get(etiqueta) || 0) < ESPERA_ENTRE_REPARACIONES_MS) return;
    ultimaReparacion.set(etiqueta, ahora);
    fallas = [];
    Promise.resolve(reparar()).catch((e) => console.log(`[${etiqueta}] no se pudo reparar la sesión: ${e.message}`));
  });
}

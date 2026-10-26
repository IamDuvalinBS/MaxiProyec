import * as baileys from "@fer2809fl/baileys";
import { obtenerBase } from "./db.js";

const COLECCION_SUBS = "subbots";
const COLECCION_CLAVES = "subbots_keys";
const CACHE_MAX = 300;
const CACHE_TTL_MS = 10 * 60000;
const ESCRITURA_DIFERIDA_MS = 400;

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

  // Las claves se guardan en segundo plano (agrupadas) y se leen primero de memoria: enviar un mensaje ya no espera a MongoDB.
  const pendientes = new Map();
  let temporizador = null;
  let volcando = Promise.resolve();

  const volcar = () => {
    temporizador = null;
    if (!pendientes.size) return volcando;
    const lote = [...pendientes];
    pendientes.clear();
    const operaciones = lote.map(([_id, v]) =>
      v === null ? { deleteOne: { filter: { _id } } } : { updateOne: { filter: { _id }, update: { $set: { v: serializar(v) } }, upsert: true } }
    );
    volcando = volcando
      .then(() => claves.bulkWrite(operaciones, { ordered: false }))
      .catch((e) => {
        console.log(`[subbot ${numero}] no se pudieron guardar las claves: ${e.message}`);
        for (const [_id, v] of lote) if (!pendientes.has(_id)) pendientes.set(_id, v);   // se reintenta
        if (!temporizador) temporizador = setTimeout(volcar, 5000);
      });
    return volcando;
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
      if (!temporizador) temporizador = setTimeout(volcar, ESCRITURA_DIFERIDA_MS);
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

  const vaciar = async () => { clearTimeout(temporizador); await volcar(); await volcando; };
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

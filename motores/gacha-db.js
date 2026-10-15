import { obtenerBase, enModoRespaldo } from "./db.js";

const COL = {
  personajes: "gacha_personajes",
  propiedad: "gacha_propiedad",
  inventario: "gacha_inventario",
  posts: "gacha_yandere_posts",
  tags: "gacha_yandere_tags"
};

const RETARDO_GUARDADO_MS = 1500;
const LOTE_MONGO = 500;
const ESPERA_MONGO_MS = 180000;
const VIGILANTE_MS = Number(process.env.GACHA_VIGILANTE_MS) || 20000;

let listo = null;
let ultimoId = 0;

const personajes = new Map();
const porClave = new Map();
const porCategoria = new Map();
const ordenados = new Map();
const propiedad = new Map();
const duenos = new Map();
const inventario = new Map();
const posts = new Map();
const postsMd5 = new Set();
const postsPadre = new Set();
const tags = new Map();

let sucio = new Map();
let temporizador = null;
let escribiendo = null;
let tx = null;
let vigilante = null;
const pendienteOffline = new Map();

const ahora = () => Math.floor(Date.now() / 1000);
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const clon = (v) => (v == null ? null : structuredClone(v));
const analizar = (v) => {
  if (v == null || v === "") return null;
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return null; }
};
const porValor = (a, b) => b.valor - a.valor || a.id - b.id;

function copia(fila, extra) {
  if (!fila) return null;
  return { ...fila, stats: clon(fila.stats), meta: clon(fila.meta), ...extra };
}

function marcar(col, id) {
  let s = sucio.get(col);
  if (!s) sucio.set(col, (s = new Set()));
  s.add(id);
  programar(RETARDO_GUARDADO_MS);
}

function programar(ms) {
  if (temporizador) return;
  temporizador = setTimeout(() => {
    temporizador = null;
    guardarGachaPendiente().catch(() => {});
  }, ms);
}

function documento(col, id) {
  switch (col) {
    case COL.personajes: {
      const f = personajes.get(id);
      if (!f) return null;
      return {
        _id: f.id, categoria: f.categoria, clave: f.clave, nombre: f.nombre, serie: f.serie, genero: f.genero,
        rareza: f.rareza, valor: f.valor, img: f.img, stats: f.stats ?? null, meta: f.meta ?? null, creado: f.creado
      };
    }
    case COL.propiedad: {
      const i = id.indexOf("|");
      const usuario = id.slice(0, i);
      const charId = Number(id.slice(i + 1));
      const f = propiedad.get(usuario)?.get(charId);
      return f ? { _id: id, usuario, char_id: charId, obtenido: f.obtenido, nivel: f.nivel } : null;
    }
    case COL.inventario: {
      const i = id.indexOf("|");
      const usuario = id.slice(0, i);
      const item = id.slice(i + 1);
      const cantidad = inventario.get(usuario)?.get(item);
      return cantidad === undefined ? null : { _id: id, usuario, item, cantidad };
    }
    case COL.posts: {
      const f = posts.get(id);
      if (!f) return null;
      return { _id: f.post_id, md5: f.md5 ?? null, parent_id: f.parent_id ?? null, char_id: f.char_id ?? null, estado: f.estado, creado: f.creado };
    }
    case COL.tags: {
      const tipo = tags.get(id);
      return tipo === undefined ? null : { _id: id, tipo };
    }
    default:
      return null;
  }
}

async function vaciar(estricto) {
  if (temporizador) {
    clearTimeout(temporizador);
    temporizador = null;
  }
  while (escribiendo) await escribiendo.catch(() => {});
  const base = obtenerBase();
  const offline = enModoRespaldo();
  if (!offline && base && pendienteOffline.size) {
    for (const [col, ids] of pendienteOffline) {
      let s = sucio.get(col);
      if (!s) sucio.set(col, (s = new Set()));
      for (const id of ids) s.add(id);
    }
    pendienteOffline.clear();
  }
  if (!sucio.size) return;
  if (!base && !offline) {
    if (estricto) throw new Error("MongoDB no está conectado.");
    programar(RETARDO_GUARDADO_MS * 5);
    return;
  }
  const lote = sucio;
  sucio = new Map();
  escribiendo = (async () => {
    try {
      if (offline) {
        await escribirOffline(lote);
        return;
      }
      for (const [col, ids] of lote) {
        const operaciones = [];
        for (const id of ids) {
          const doc = documento(col, id);
          operaciones.push(
            doc
              ? { replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } }
              : { deleteOne: { filter: { _id: id } } }
          );
        }
        for (let i = 0; i < operaciones.length; i += LOTE_MONGO) {
          await base.collection(col).bulkWrite(operaciones.slice(i, i + LOTE_MONGO), { ordered: false });
        }
      }
    } catch (e) {
      console.log("Error guardando datos del gacha: " + e.message);
      for (const [col, ids] of lote) for (const id of ids) marcar(col, id);
      programar(RETARDO_GUARDADO_MS * 5);
      if (estricto) throw e;
    }
  })();
  const actual = escribiendo;
  try {
    await actual;
  } finally {
    if (escribiendo === actual) escribiendo = null;
  }
}

async function escribirOffline(lote) {
  const modulo = await import("./respaldo.js");
  const escribir = [];
  const borrar = [];
  for (const [col, ids] of lote) {
    let p = pendienteOffline.get(col);
    if (!p) pendienteOffline.set(col, (p = new Set()));
    for (const id of ids) {
      p.add(id);
      const doc = documento(col, id);
      if (doc) escribir.push({ coleccion: col, doc });
      else borrar.push({ coleccion: col, id: String(id) });
    }
  }
  if (escribir.length) await modulo.escribirDocsRespaldo(escribir);
  if (borrar.length) await modulo.borrarDocsRespaldo(borrar);
}

function vigilarReconexion() {
  if (vigilante) return;
  vigilante = setInterval(async () => {
    const base = obtenerBase();
    if (enModoRespaldo() || !base) return;
    clearInterval(vigilante);
    vigilante = null;
    try {
      await vaciar(true);
      await cargarDesdeMongo(base);
      console.log("✅ Gacha: MongoDB reconectado, los cambios del modo respaldo se enviaron y los datos se recargaron.");
    } catch (e) {
      console.log("Gacha: no se pudo sincronizar con MongoDB tras reconectar: " + e.message);
      vigilarReconexion();
    }
  }, VIGILANTE_MS);
}

export const guardarGachaPendiente = () => vaciar(false);

const undo = (fn) => { if (tx) tx.push(fn); };

export function enTransaccion(fn) {
  if (tx) return fn();
  tx = [];
  try {
    const r = fn();
    tx = null;
    return r;
  } catch (e) {
    const registro = tx;
    tx = null;
    for (let i = registro.length - 1; i >= 0; i--) {
      try { registro[i](); } catch {}
    }
    throw e;
  }
}

function registrarPersonaje(fila) {
  personajes.set(fila.id, fila);
  porClave.set(`${fila.categoria}|${fila.clave}`, fila);
  let lista = porCategoria.get(fila.categoria);
  if (!lista) porCategoria.set(fila.categoria, (lista = []));
  lista.push(fila);
  ordenados.delete(fila.categoria);
  if (fila.id > ultimoId) ultimoId = fila.id;
  marcar(COL.personajes, fila.id);
  undo(() => {
    personajes.delete(fila.id);
    porClave.delete(`${fila.categoria}|${fila.clave}`);
    const l = porCategoria.get(fila.categoria);
    const i = l ? l.lastIndexOf(fila) : -1;
    if (i >= 0) l.splice(i, 1);
    ordenados.delete(fila.categoria);
    marcar(COL.personajes, fila.id);
  });
}

function agregarPropiedad(f) {
  let m = propiedad.get(f.usuario);
  if (!m) propiedad.set(f.usuario, (m = new Map()));
  let d = duenos.get(f.char_id);
  if (!d) duenos.set(f.char_id, (d = new Map()));
  m.set(f.char_id, f);
  d.set(f.usuario, f);
  marcar(COL.propiedad, `${f.usuario}|${f.char_id}`);
  undo(() => quitarPropiedad(f.usuario, f.char_id));
}

function quitarPropiedad(usuario, charId) {
  const m = propiedad.get(usuario);
  const f = m?.get(charId);
  if (!f) return null;
  m.delete(charId);
  if (!m.size) propiedad.delete(usuario);
  const d = duenos.get(charId);
  if (d) {
    d.delete(usuario);
    if (!d.size) duenos.delete(charId);
  }
  marcar(COL.propiedad, `${usuario}|${charId}`);
  undo(() => agregarPropiedad(f));
  return f;
}

function fijarItem(usuario, item, cantidad) {
  let m = inventario.get(usuario);
  if (!m) inventario.set(usuario, (m = new Map()));
  m.set(item, cantidad);
  marcar(COL.inventario, `${usuario}|${item}`);
}

function indexarPost(f) {
  if (f.md5) postsMd5.add(f.md5);
  if (f.parent_id) postsPadre.add(f.parent_id);
}

function reindexarPosts() {
  postsMd5.clear();
  postsPadre.clear();
  for (const f of posts.values()) indexarPost(f);
}

function limpiar() {
  personajes.clear();
  porClave.clear();
  porCategoria.clear();
  ordenados.clear();
  propiedad.clear();
  duenos.clear();
  inventario.clear();
  posts.clear();
  postsMd5.clear();
  postsPadre.clear();
  tags.clear();
  sucio = new Map();
  ultimoId = 0;
}

function cargarFilaPersonaje(d) {
  const fila = {
    id: Number(d._id), categoria: d.categoria, clave: String(d.clave), nombre: d.nombre,
    serie: d.serie ?? "", genero: d.genero ?? "", rareza: d.rareza ?? "Común",
    valor: Number(d.valor) || 0, img: d.img, stats: d.stats ?? null, meta: d.meta ?? null,
    creado: Number(d.creado) || ahora()
  };
  personajes.set(fila.id, fila);
  porClave.set(`${fila.categoria}|${fila.clave}`, fila);
  let lista = porCategoria.get(fila.categoria);
  if (!lista) porCategoria.set(fila.categoria, (lista = []));
  lista.push(fila);
  if (fila.id > ultimoId) ultimoId = fila.id;
}

async function leerColeccion(base, nombre) {
  return base.collection(nombre).find({}).toArray();
}

async function esperarOrigen() {
  const limite = Date.now() + ESPERA_MONGO_MS;
  while (Date.now() < limite) {
    const base = obtenerBase();
    if (enModoRespaldo()) return { respaldo: true };
    if (base) return { base };
    await pausa(500);
  }
  throw new Error("MongoDB no se conectó a tiempo.");
}

async function cargarDesde(leer) {
  limpiar();
  for (const d of await leer(COL.personajes)) cargarFilaPersonaje(d);

  const props = (await leer(COL.propiedad)).sort((a, b) => (a.obtenido || 0) - (b.obtenido || 0));
  for (const d of props) {
    const f = { usuario: d.usuario, char_id: Number(d.char_id), obtenido: Number(d.obtenido) || 0, nivel: Number(d.nivel) || 1 };
    let m = propiedad.get(f.usuario);
    if (!m) propiedad.set(f.usuario, (m = new Map()));
    let o = duenos.get(f.char_id);
    if (!o) duenos.set(f.char_id, (o = new Map()));
    m.set(f.char_id, f);
    o.set(f.usuario, f);
  }

  for (const d of await leer(COL.inventario)) {
    let m = inventario.get(d.usuario);
    if (!m) inventario.set(d.usuario, (m = new Map()));
    m.set(d.item, Number(d.cantidad) || 0);
  }

  for (const d of await leer(COL.posts)) {
    const f = {
      post_id: Number(d._id), md5: d.md5 ?? null, parent_id: Number(d.parent_id) || null,
      char_id: d.char_id ?? null, estado: d.estado, creado: Number(d.creado) || 0
    };
    posts.set(f.post_id, f);
    indexarPost(f);
  }

  for (const d of await leer(COL.tags)) tags.set(String(d._id), Number(d.tipo));
}

const cargarDesdeMongo = (base) => cargarDesde((nombre) => leerColeccion(base, nombre));

async function cargarDesdeRespaldo() {
  const modulo = await import("./respaldo.js");
  const datos = await modulo.leerRespaldoCompleto();
  await cargarDesde(async (nombre) => datos[nombre] || []);
}

function aplicarTablas(t) {
  let n = 0;
  for (const r of t.personajes || []) {
    const id = Number(r.id);
    if (!Number.isInteger(id) || !r.categoria || r.clave == null || !r.nombre || !r.img) continue;
    if (personajes.has(id) || porClave.has(`${r.categoria}|${r.clave}`)) continue;
    registrarPersonaje({
      id, categoria: r.categoria, clave: String(r.clave), nombre: r.nombre, serie: r.serie ?? "", genero: r.genero ?? "",
      rareza: r.rareza ?? "Común", valor: Number(r.valor) || 1000, img: r.img,
      stats: analizar(r.stats), meta: analizar(r.meta), creado: Number(r.creado) || ahora()
    });
    n++;
  }
  const props = [...(t.propiedad || [])].sort((a, b) => (Number(a.obtenido) || 0) - (Number(b.obtenido) || 0));
  for (const r of props) {
    const charId = Number(r.char_id);
    const usuario = String(r.usuario ?? "");
    if (!usuario || !personajes.has(charId) || propiedad.get(usuario)?.has(charId)) continue;
    agregarPropiedad({ usuario, char_id: charId, obtenido: Number(r.obtenido) || ahora(), nivel: Number(r.nivel) || 1 });
    n++;
  }
  for (const r of t.inventario || []) {
    if (!r.usuario || !r.item) continue;
    fijarItem(String(r.usuario), String(r.item), Number(r.cantidad) || 0);
    n++;
  }
  for (const r of t.yandere_posts || []) {
    const id = Number(r.post_id);
    if (!Number.isInteger(id) || posts.has(id)) continue;
    const f = {
      post_id: id, md5: r.md5 || null, parent_id: Number(r.parent_id) || null,
      char_id: r.char_id ?? null, estado: r.estado || "ok", creado: Number(r.creado) || ahora()
    };
    posts.set(id, f);
    indexarPost(f);
    marcar(COL.posts, id);
    n++;
  }
  for (const r of t.yandere_tags || []) {
    if (!r.nombre) continue;
    tags.set(String(r.nombre), Number(r.tipo) || 0);
    marcar(COL.tags, String(r.nombre));
    n++;
  }
  return n;
}

async function migrarSqliteLocal(base) {
  const legado = await import("./respaldo-gacha.js");
  let tablas;
  try {
    tablas = await legado.leerSqliteLocal();
  } catch (e) {
    throw new Error("Existe data/gacha.db pero no se pudo leer (usa Node 22.5+ o instala better-sqlite3): " + e.message);
  }
  if (!tablas || !tablas.personajes?.length) return;
  const n = aplicarTablas(tablas);
  let fallo = null;
  for (let i = 1; i <= 5; i++) {
    try {
      await vaciar(true);
      fallo = null;
      break;
    } catch (e) {
      fallo = e;
      if (i < 5) await pausa(3000);
    }
  }
  if (fallo) {
    limpiar();
    try {
      for (const nombre of Object.values(COL)) await base.collection(nombre).deleteMany({});
    } catch {}
    throw new Error("No se pudo migrar data/gacha.db a MongoDB (se reintentará al reiniciar): " + fallo.message);
  }
  legado.archivarSqliteLocal();
  console.log(`✅ Gacha: ${n} filas migradas de data/gacha.db a MongoDB`);
}

async function cargar() {
  const origen = await esperarOrigen();
  if (origen.respaldo) {
    await cargarDesdeRespaldo();
    vigilarReconexion();
    console.log(`⚠️ Gacha cargado desde el respaldo de Turso: ${personajes.size} personajes, ${propiedad.size} coleccionistas`);
    return;
  }
  const base = origen.base;
  await cargarDesdeMongo(base);
  if (!personajes.size) await migrarSqliteLocal(base);
  console.log(`✅ Gacha cargado desde MongoDB: ${personajes.size} personajes, ${propiedad.size} coleccionistas`);
}

export function initGachaDB() {
  if (!listo) {
    listo = cargar().catch((e) => {
      listo = null;
      throw e;
    });
  }
  return listo;
}

export async function recargarGacha() {
  const base = obtenerBase();
  if (!base) return;
  await vaciar(false);
  await cargarDesdeMongo(base);
}

export const hayDatosGacha = () => personajes.size > 0;

export async function importarTablasGacha(tablas) {
  await initGachaDB();
  const n = aplicarTablas(tablas);
  await vaciar(true);
  return n;
}

function listaOrdenada(categoria) {
  let l = ordenados.get(categoria);
  if (!l) {
    l = [...(porCategoria.get(categoria) || [])].sort(porValor);
    ordenados.set(categoria, l);
  }
  return l;
}

function filasDe(usuario, categoria) {
  const out = [];
  const m = propiedad.get(usuario);
  if (!m) return out;
  for (const [charId, prop] of m) {
    const p = personajes.get(charId);
    if (p && p.categoria === categoria) out.push({ p, prop });
  }
  return out;
}

export function crearPersonaje({ categoria, clave, nombre, serie = "", genero = "", rareza = "Común", valor = 1000, img, stats = null, meta = null }) {
  if (!categoria || clave == null || !nombre || !img) return null;
  if (porClave.has(`${categoria}|${clave}`)) return null;
  const fila = {
    id: ultimoId + 1, categoria, clave: String(clave), nombre, serie, genero, rareza,
    valor: Number.isFinite(valor) ? Math.round(valor) : 1000, img,
    stats: stats ? clon(stats) : null, meta: meta ? clon(meta) : null, creado: ahora()
  };
  registrarPersonaje(fila);
  return { id: fila.id };
}

export function personajePorId(id) {
  return copia(personajes.get(Number(id)));
}

export function personajePorClave(categoria, clave) {
  return copia(porClave.get(`${categoria}|${clave}`));
}

export function personajeAleatorio(categoria, { soloLibres = false } = {}) {
  const lista = porCategoria.get(categoria);
  if (!lista || !lista.length) return null;
  const libre = (f) => !duenos.has(f.id);
  const azar = () => lista[Math.floor(Math.random() * lista.length)];
  if (soloLibres) {
    for (let i = 0; i < 5; i++) {
      const f = azar();
      if (libre(f)) return copia(f);
    }
    const libres = lista.filter(libre);
    if (libres.length) return copia(libres[Math.floor(Math.random() * libres.length)]);
  }
  return copia(azar());
}

export function personajeAleatorioPonderado(categoria, pesos) {
  const lista = porCategoria.get(categoria);
  if (!lista || !lista.length) return null;
  const conteo = new Map();
  for (const f of lista) conteo.set(f.rareza, (conteo.get(f.rareza) || 0) + 1);
  const pond = [...conteo.keys()].map((rareza) => ({ rareza, peso: pesos[rareza] ?? 10 }));
  let x = Math.random() * pond.reduce((a, b) => a + b.peso, 0);
  let elegida = pond[pond.length - 1].rareza;
  for (const f of pond) {
    if ((x -= f.peso) < 0) { elegida = f.rareza; break; }
  }
  const candidatos = lista.filter((f) => f.rareza === elegida);
  return copia(candidatos[Math.floor(Math.random() * candidatos.length)]);
}

export function contarPersonajes(categoria) {
  return porCategoria.get(categoria)?.length || 0;
}

export function propietarios(charId) {
  const d = duenos.get(Number(charId));
  return d ? [...d.values()].sort((a, b) => a.obtenido - b.obtenido).map((f) => f.usuario) : [];
}

export function leTiene(usuario, charId) {
  return !!propiedad.get(usuario)?.has(Number(charId));
}

export function reclamar(usuario, personaje) {
  return enTransaccion(() => {
    if (personaje.categoria === "waifu" && propietarios(personaje.id).length) return "ocupado";
    if (leTiene(usuario, personaje.id)) return "repetido";
    agregarPropiedad({ usuario, char_id: Number(personaje.id), obtenido: ahora(), nivel: 1 });
    return "ok";
  });
}

export function coleccionDe(usuario, categoria, limite = 15, desplazamiento = 0) {
  return filasDe(usuario, categoria)
    .sort((a, b) => porValor(a.p, b.p))
    .slice(desplazamiento, desplazamiento + limite)
    .map(({ p, prop }) => copia(p, { obtenido: prop.obtenido, nivel: prop.nivel }));
}

export function contarColeccion(usuario, categoria) {
  const filas = filasDe(usuario, categoria);
  return { n: filas.length, total: filas.reduce((a, f) => a + f.p.valor, 0) };
}

export function mejorDe(usuario, categoria, charId = null) {
  if (charId) {
    const prop = propiedad.get(usuario)?.get(Number(charId));
    const p = prop && personajes.get(Number(charId));
    if (!p || p.categoria !== categoria) return null;
    return copia(p, { obtenido: prop.obtenido, nivel: prop.nivel });
  }
  const filas = filasDe(usuario, categoria).sort((a, b) => b.prop.nivel - a.prop.nivel || porValor(a.p, b.p));
  return filas.length ? copia(filas[0].p, { obtenido: filas[0].prop.obtenido, nivel: filas[0].prop.nivel }) : null;
}

export function setNivel(usuario, charId, nivel) {
  const f = propiedad.get(usuario)?.get(Number(charId));
  if (!f) return;
  const previo = f.nivel;
  f.nivel = nivel;
  marcar(COL.propiedad, `${usuario}|${f.char_id}`);
  undo(() => {
    f.nivel = previo;
    marcar(COL.propiedad, `${usuario}|${f.char_id}`);
  });
}

export function cantidadItem(usuario, item) {
  return inventario.get(usuario)?.get(item) || 0;
}

export function sumarItem(usuario, item, delta) {
  const previo = inventario.get(usuario)?.get(item);
  fijarItem(usuario, item, (previo || 0) + delta);
  undo(() => {
    if (previo === undefined) inventario.get(usuario)?.delete(item);
    else fijarItem(usuario, item, previo);
    marcar(COL.inventario, `${usuario}|${item}`);
  });
}

export function listarPersonajes(categoria, limite = 20, desplazamiento = 0) {
  return listaOrdenada(categoria)
    .slice(desplazamiento, desplazamiento + limite)
    .map((p) => copia(p, { duenos: duenos.get(p.id)?.size || 0 }));
}

export function resumenGacha() {
  const porCat = new Map();
  const porRar = new Map();
  for (const f of personajes.values()) {
    porCat.set(f.categoria, (porCat.get(f.categoria) || 0) + 1);
    const k = `${f.categoria}\u0000${f.rareza}`;
    const g = porRar.get(k);
    if (g) {
      g.n++;
      if (f.valor > g.max) g.max = f.valor;
    } else {
      porRar.set(k, { categoria: f.categoria, rareza: f.rareza, n: 1, max: f.valor });
    }
  }
  const recl = new Map();
  for (const id of duenos.keys()) {
    const p = personajes.get(id);
    if (p) recl.set(p.categoria, (recl.get(p.categoria) || 0) + 1);
  }
  const est = new Map();
  for (const f of posts.values()) est.set(f.estado, (est.get(f.estado) || 0) + 1);
  const ordenar = (m) => [...m.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return {
    porCategoria: ordenar(porCat).map(([categoria, n]) => ({ categoria, n })),
    porRareza: [...porRar.values()].sort((a, b) => b.max - a.max).map(({ categoria, rareza, n }) => ({ categoria, rareza, n })),
    reclamados: ordenar(recl).map(([categoria, n]) => ({ categoria, n })),
    yandere: ordenar(est).map(([estado, n]) => ({ estado, n }))
  };
}

export function yandereDuplicado({ post_id, md5, parent_id }) {
  const id = Number(post_id);
  const padre = Number(parent_id) || 0;
  if (posts.has(id)) return "post";
  if (md5 && postsMd5.has(md5)) return "md5";
  if (padre && (posts.has(padre) || postsPadre.has(padre))) return "parent";
  if (postsPadre.has(id)) return "parent";
  return null;
}

export function yandereRegistrar({ post_id, md5, parent_id, char_id = null, estado }) {
  const id = Number(post_id);
  const previo = posts.get(id);
  const fila = { post_id: id, md5: md5 || null, parent_id: Number(parent_id) || null, char_id, estado, creado: ahora() };
  posts.set(id, fila);
  indexarPost(fila);
  marcar(COL.posts, id);
  undo(() => {
    if (previo) posts.set(id, previo);
    else posts.delete(id);
    reindexarPosts();
    marcar(COL.posts, id);
  });
}

export function yandereTagTipo(nombre) {
  const t = tags.get(nombre);
  return t === undefined ? null : t;
}

export function yandereTagGuardar(nombre, tipo) {
  tags.set(nombre, tipo);
  marcar(COL.tags, nombre);
}

export function yandereCrearPersonaje(datos, post) {
  return enTransaccion(() => {
    const creado = crearPersonaje(datos);
    if (!creado) return null;
    yandereRegistrar({ post_id: post.post_id, md5: post.md5, parent_id: post.parent_id, char_id: creado.id, estado: "ok" });
    return creado;
  });
}

export function topColeccionistas(categoria, limite = 10) {
  const filas = [];
  for (const [usuario, m] of propiedad) {
    let n = 0;
    let primero = Infinity;
    for (const [charId, prop] of m) {
      if (personajes.get(charId)?.categoria !== categoria) continue;
      n++;
      if (prop.obtenido < primero) primero = prop.obtenido;
    }
    if (n) filas.push({ usuario, cantidad: n, primero });
  }
  return filas
    .sort((a, b) => b.cantidad - a.cantidad || a.primero - b.primero)
    .slice(0, limite)
    .map(({ usuario, cantidad }) => ({ usuario, cantidad }));
}

export function transferirPersonaje(de, a, charId) {
  return enTransaccion(() => {
    const id = Number(charId);
    const fila = propiedad.get(de)?.get(id);
    if (!fila) return { estado: "no_tiene" };
    if (leTiene(a, id)) return { estado: "ya_lo_tiene" };
    const nivel = fila.nivel;
    quitarPropiedad(de, id);
    agregarPropiedad({ usuario: a, char_id: id, obtenido: ahora(), nivel });
    return { estado: "ok", nivel };
  });
}

export function transferirColeccion(de, a, categoria) {
  return enTransaccion(() => {
    let transferidos = 0;
    let omitidos = 0;
    let valor = 0;
    for (const { p, prop } of filasDe(de, categoria)) {
      if (leTiene(a, p.id)) {
        omitidos++;
        continue;
      }
      const nivel = prop.nivel;
      quitarPropiedad(de, p.id);
      agregarPropiedad({ usuario: a, char_id: p.id, obtenido: ahora(), nivel });
      transferidos++;
      valor += p.valor;
    }
    return { transferidos, omitidos, valor };
  });
}

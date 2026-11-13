import pino from "pino";
import * as baileys from "@fer2809fl/baileys";
import {
  sesionesDisponibles,
  cargarEstadoSub,
  guardarMetaSub,
  listarSubsGuardados,
  existeSub,
  eliminarSub,
  limpiarSesionesSignal,
  vigilarDescifrado,
  vinculacionCompleta
} from "../../motores/sesiones-mongo.js";
import { config, saveConfig, idCanonico } from "../../motores/db.js";
import { saltarAtrasoViejo } from "../../motores/saltar-atraso.js";
import { isOwner } from "../../motores/owner.js";

const MAX_SUBS = Math.max(1, Number(process.env.MAX_SUBBOTS) || 10);
const PAUSA_ENTRE_SUBS_MS = 4000;
const TIEMPO_VINCULACION_MS = 120000;
const REINTENTO_BASE_MS = 5000;
const REINTENTO_MAX_MS = 60000;


// Normaliza números de teléfono de cualquier país (52 / 521 en México, 54 / 549 en Argentina).
const PAIS_DEFECTO = String(process.env.CODIGO_PAIS_DEFECTO || "52").replace(/\D/g, "");

// Devuelve solo dígitos; acepta "+52 1 (55) 1234-5678", "0052...", "@s.whatsapp.net", "123:4@s.whatsapp.net".
export function soloDigitos(texto) {
  const base = String(texto || "").split("@")[0].split(":")[0];
  return base.replace(/\D/g, "").replace(/^00/, "");
}

// Forma canónica: la que WhatsApp usa hoy para vincular (México = 52 + 10 dígitos, Argentina = 54 + 10 dígitos).
export function canonico(texto) {
  let n = soloDigitos(texto);
  if (n.length === 10 && PAIS_DEFECTO) n = PAIS_DEFECTO + n;   // número local sin código de país
  if (/^521\d{10}$/.test(n)) n = "52" + n.slice(3);
  if (/^549\d{10,11}$/.test(n)) n = "54" + n.slice(3);
  return n;
}

// Todas las formas con las que podría aparecer el mismo número (para comparar o buscar sesiones guardadas).
export function variantes(texto) {
  const c = canonico(texto);
  const lista = new Set([c, soloDigitos(texto)]);
  if (/^52\d{10}$/.test(c)) lista.add("521" + c.slice(2));
  if (/^54\d{10}$/.test(c)) lista.add("549" + c.slice(2));
  return [...lista].filter(Boolean);
}

export function mismoNumero(a, b) {
  const ca = canonico(a);
  return Boolean(ca) && ca === canonico(b);
}

export function esNumeroValido(texto) {
  const n = canonico(texto);
  return n.length >= 8 && n.length <= 15;
}


// ───────────── Quién puede pedir .code ─────────────
// 1) Owners del bot  2) Usuarios con permiso (.permitircode)  3) Owners de la página  4) Quien cumpla la misión de la página.
// Cada código gasta la misión y activa un cooldown de 1 día; pasado ese día la página asigna OTRA misión distinta al azar.
const COOLDOWN_CODE_MS = 24 * 60 * 60 * 1000;
const JUEGOS_OFICIALES = new Set(["colorrush", "dino", "snake", "gusanos", "minigolf", "pou", "dodge", "simon", "tap"]);
// Misma lista que la página (modulos/bot.js). tipo: min = minutos en juegos del patrocinador, uno = minutos en un solo juego,
// dist = juegos distintos (3+ min en cada uno), par = partidas, ads = anuncios vistos.
export const MISIONES = {
  f1: { nivel: "fácil", tipo: "par", meta: 3, txt: "Completa *3 partidas* en juegos de nuestro patrocinador." },
  f2: { nivel: "fácil", tipo: "min", meta: 5, txt: "Juega *5 minutos* a juegos de nuestro patrocinador." },
  f3: { nivel: "fácil", tipo: "ads", meta: 3, txt: "Mira *3 anuncios* de nuestro patrocinador." },
  m1: { nivel: "media", tipo: "min", meta: 15, txt: "Juega *15 minutos* a juegos de nuestro patrocinador." },
  m2: { nivel: "media", tipo: "dist", meta: 2, txt: "Prueba *2 juegos distintos* del patrocinador (mínimo 3 min en cada uno)." },
  m3: { nivel: "media", tipo: "ads", meta: 8, txt: "Mira *8 anuncios* de nuestro patrocinador." },
  m4: { nivel: "media", tipo: "uno", meta: 10, txt: "Juega *10 minutos en un mismo juego* del patrocinador." },
  d1: { nivel: "difícil", tipo: "min", meta: 30, txt: "Juega *30 minutos* a juegos de nuestro patrocinador." },
  d2: { nivel: "difícil", tipo: "dist", meta: 4, txt: "Prueba *4 juegos distintos* del patrocinador (mínimo 3 min en cada uno)." },
  d3: { nivel: "difícil", tipo: "ads", meta: 15, txt: "Mira *15 anuncios* de nuestro patrocinador." },
  d4: { nivel: "difícil", tipo: "uno", meta: 20, txt: "Juega *20 minutos* en un mismo juego del patrocinador." }
};
let pagina = null;

export function usarPagina(PAG) {   // lo llama index.js cuando Firebase conecta
  pagina = PAG;
  try {
    PAG.fs.collection("bot").doc("codigo").set({ cd: COOLDOWN_CODE_MS, t: PAG.FV.serverTimestamp() }, { merge: true }).catch(() => {});
  } catch {}
}

const mismoId = (a, b) => a === b || (canonico(a) && canonico(a) === canonico(b));

export const permitidosCode = () => [...(config.codePermitidos || [])];

export async function permitirCode(id) {
  if (!config.codePermitidos) config.codePermitidos = [];
  if (config.codePermitidos.some((x) => mismoId(x, id))) return false;
  config.codePermitidos.push(id);
  await saveConfig();
  return true;
}

export async function quitarPermisoCode(id) {
  const antes = (config.codePermitidos || []).length;
  config.codePermitidos = (config.codePermitidos || []).filter((x) => !mismoId(x, id));
  if (config.codePermitidos.length === antes) return false;
  await saveConfig();
  return true;
}

function uidDe(sender) {
  if (!pagina || !pagina.vinc) return null;
  for (const [uid, v] of pagina.vinc) if (v.jid && mismoId(v.jid, sender)) return uid;
  return null;
}

// Progreso de una misión = lo que subió desde que se asignó (la página guarda la "base" al asignarla).
function progresoMision(d, mi) {
  const st = d.stats || {}, base = (d.codeMision && d.codeMision.base) || {};
  const pj = st.pj || {}, pp = st.pp || {}, bpj = base.pj || {}, bpp = base.pp || {};
  const juegos = Object.keys(pj).filter((id) => !JUEGOS_OFICIALES.has(id));
  const delta = (id) => Math.max(0, (Number(pj[id]) || 0) - (Number(bpj[id]) || 0));
  switch (mi.tipo) {
    case "min": return juegos.reduce((a, id) => a + delta(id), 0);
    case "uno": return juegos.reduce((a, id) => Math.max(a, delta(id)), 0);
    case "dist": return juegos.filter((id) => delta(id) >= 3).length;
    case "par": return Object.keys(pp).filter((id) => !JUEGOS_OFICIALES.has(id)).reduce((a, id) => a + Math.max(0, (Number(pp[id]) || 0) - (Number(bpp[id]) || 0)), 0);
    case "ads": return Math.max(0, (Number(st.ads) || 0) - (Number(base.ads) || 0));
    default: return 0;
  }
}

export async function permisoCode(sender) {
  if (isOwner(sender)) return { ok: true, via: "owner" };
  if ((config.codePermitidos || []).some((x) => mismoId(x, sender))) return { ok: true, via: "permiso" };
  if (!pagina || !pagina.fs) return { ok: false, motivo: "sin_pagina" };
  const uid = uidDe(sender);
  if (!uid) return { ok: false, motivo: "sin_vinculo" };
  try {
    const [pf, ow] = await Promise.all([pagina.fs.collection("perfiles").doc(uid).get(), pagina.fs.collection("owners").doc(uid).get()]);
    if (ow.exists) return { ok: true, via: "owner_web" };
    const d = pf.data() || {};
    const resta = (Number(d.codeUlt) || 0) + COOLDOWN_CODE_MS - Date.now();
    if (resta > 0) return { ok: false, motivo: "cooldown", resta };
    const id = d.codeMision && d.codeMision.id, mi = MISIONES[id];
    if (!mi) return { ok: false, motivo: "sin_mision" };
    const prog = progresoMision(d, mi);
    if (prog >= mi.meta) return { ok: true, via: "mision", uid, mision: id };
    return { ok: false, motivo: "mision", mi, prog: Math.floor(prog), falta: Math.ceil(mi.meta - prog) };
  } catch (e) {
    console.log("Permiso de .code: " + e.message);
    return { ok: false, motivo: "error" };
  }
}

export async function registrarUsoCode(uid, mision) {   // gasta la misión cumplida y empieza el cooldown de 1 día
  if (!uid || !pagina || !pagina.fs) return;
  await pagina.fs.collection("perfiles").doc(uid).set({
    codeUsos: pagina.FV.increment(1), codeUlt: Date.now(), codeUltId: mision || null, codeMision: pagina.FV.delete()
  }, { merge: true }).catch((e) => console.log("No se pudo registrar el uso de .code: " + e.message));
}

const CODIGO_VINCULACION = String(process.env.CODIGO_VINCULACION || "MAXIBOTS").toUpperCase();   // 8 letras/números
const logger = pino({ level: "silent" });
// Las listas de dispositivos de cada contacto son iguales para todos los subbots: una sola caché compartida
// ahorra memoria y evita consultar lo mismo varias veces a WhatsApp.
const dispositivos = new Map();
const cacheDispositivos = {
  get: (k) => { const e = dispositivos.get(k); if (!e) return undefined; if (e.vence < Date.now()) { dispositivos.delete(k); return undefined; } return e.v; },
  set: (k, v) => { if (dispositivos.size >= 1500) dispositivos.delete(dispositivos.keys().next().value); dispositivos.set(k, { v, vence: Date.now() + 5 * 60000 }); },
  del: (k) => { dispositivos.delete(k); },
  flushAll: () => dispositivos.clear()
};
const subs = new Map();
const fallosSeguidos = new Map();
let enlazar = null;
let versionWA = null;

function dormir(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function obtenerVersion() {
  if (!versionWA) {
    try {
      versionWA = (await baileys.fetchLatestBaileysVersion()).version;
    } catch {
      return undefined;   // sin internet un momento: Baileys usa su versión integrada y no se queda sin reconectar
    }
  }
  return versionWA;
}

function liberar(entrada) {
  clearTimeout(entrada.temporizador);
  const sock = entrada.sock;
  entrada.sock = null;
  if (!sock) return;
  try {
    sock.ev.removeAllListeners();
    sock.end(undefined);
  } catch {}
}

function terminarVinculacion(entrada, conectado, error) {
  const v = entrada.vinculando;
  if (!v) return;
  entrada.vinculando = null;
  clearTimeout(v.limite);
  if (entrada.numero) {
    if (conectado) fallosSeguidos.delete(entrada.numero);
    else if (entrada.codigoPedido) fallosSeguidos.set(entrada.numero, (fallosSeguidos.get(entrada.numero) || 0) + 1);
  }
  if (error) v.rechazarCodigo(error);
  v.resolverConectado(v.reemplazado ? null : conectado);
}

function alternativo(numero) {
  if (/^52\d{10}$/.test(numero)) return "521" + numero.slice(2);
  if (/^54\d{10}$/.test(numero)) return "549" + numero.slice(2);
  return numero;
}

function estrategiaDeCodigo(numero) {
  const fallos = fallosSeguidos.get(numero) || 0;
  return {
    numeroParaCodigo: fallos >= 2 && fallos % 2 === 0 ? alternativo(numero) : numero,
    codigoPersonalizado: fallos === 0 ? CODIGO_VINCULACION : undefined
  };
}

const ESPERA_REINTENTO = (entrada) => Math.min(REINTENTO_MAX_MS, REINTENTO_BASE_MS * 2 ** Math.min(entrada.reintentos++, 4));

// Una sola conexión a la vez por subbot: dos sockets con la misma sesión se pelean y la dañan.
async function conectar(numero) {
  const entrada = subs.get(numero);
  if (!entrada || entrada.detenido || entrada.conectando) return;
  entrada.conectando = true;
  try {
    await abrir(numero, entrada);
  } finally {
    entrada.conectando = false;
  }
}

// Reconexión que no se rinde: si falla (MongoDB o internet un momento), vuelve a intentar con espera creciente.
function programar(numero, espera) {
  const entrada = subs.get(numero);
  if (!entrada || entrada.detenido) return;
  clearTimeout(entrada.temporizador);
  entrada.temporizador = setTimeout(async () => {
    try {
      await entrada.guardando;
      await entrada.vaciar?.();   // las claves pendientes deben estar guardadas antes de releer la sesión
      await conectar(numero);
    } catch (e) {
      console.log(`[subbot ${numero}] no se pudo reconectar: ${e.message}`);
      programar(numero, ESPERA_REINTENTO(entrada));
    }
  }, espera);
}

// Si los mensajes llegan pero no se pueden descifrar (sesión dañada), borra SOLO las sesiones de cifrado y reconecta.
// Las credenciales se conservan: no hace falta volver a vincular.
async function reparar(numero, entrada) {
  console.log(`🛠 Subbot ${numero}: demasiados mensajes sin descifrar, se limpian las sesiones de cifrado (sin desvincular).`);
  liberar(entrada);
  entrada.enLinea = false;
  await entrada.guardando;
  await entrada.vaciar?.();
  await limpiarSesionesSignal(numero);
  entrada.reintentos = 0;
  programar(numero, 1500);
}

async function abrir(numero, entrada) {
  liberar(entrada);

  const { state, guardarCreds, vaciar } = await cargarEstadoSub(numero, logger);
  entrada.vaciar = vaciar;
  const version = await obtenerVersion();
  if (entrada.detenido) return;

  const sock = baileys.makeWASocket({
    auth: state,
    version,
    logger,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined,
    userDevicesCache: cacheDispositivos,
    cachedGroupMetadata: async (jid) => {   // evita pedir los datos del grupo a WhatsApp en cada mensaje
      const g = entrada.grupos.get(jid);
      if (g && g.vence > Date.now()) return g.meta;
      try {
        const meta = await entrada.sock.groupMetadata(jid);
        if (entrada.grupos.size >= 25) entrada.grupos.delete(entrada.grupos.keys().next().value);   // poca memoria
        entrada.grupos.set(jid, { meta, vence: Date.now() + 5 * 60000 });
        return meta;
      } catch {
        return g ? g.meta : undefined;
      }
    },
    shouldIgnoreJid: (jid) => typeof jid === "string" && (jid === "status@broadcast" || jid.endsWith("@broadcast") || jid.endsWith("@newsletter"))
  });
  entrada.sock = sock;
  sock.ev.on("groups.update", (c) => { for (const x of c) if (x.id) entrada.grupos.delete(x.id); });
  sock.ev.on("group-participants.update", (u) => entrada.grupos.delete(u.id));

  sock.ev.on("creds.update", () => {   // en fila: evita que una escritura vieja pise a una nueva
    entrada.guardando = (entrada.guardando || Promise.resolve())
      .then(() => guardarCreds())
      .catch((e) => console.log(`[subbot ${numero}] no se pudo guardar la sesión: ${e.message}`));
  });

  saltarAtrasoViejo(sock, `subbot ${numero}`);
  vigilarDescifrado(sock, `subbot ${numero}`, () => reparar(numero, entrada));

  sock.ev.on("connection.update", async (update) => {
    if (entrada.sock !== sock) return;   // eventos de un socket viejo
    const { connection, lastDisconnect, qr } = update;

    if (qr && !state.creds.registered && entrada.vinculando && !entrada.codigoPedido) {
      entrada.codigoPedido = true;
      try {
        const codigo = await sock.requestPairingCode(entrada.numeroParaCodigo || numero, entrada.codigoPersonalizado);
        entrada.vinculando.resolverCodigo(codigo);
      } catch (e) {
        terminarVinculacion(entrada, false, e);
        await quitarSubbot(numero);
      }
      return;
    }

    if (connection === "open") {
      entrada.reintentos = 0;
      entrada.enLinea = true;
      console.log(`✔ Subbot ${numero} conectado`);
      terminarVinculacion(entrada, true);
      return;
    }

    if (connection !== "close") return;
    entrada.enLinea = false;
    if (entrada.detenido) return;

    const codigo = lastDisconnect?.error?.output?.statusCode;
    if (codigo === baileys.DisconnectReason.loggedOut) {
      terminarVinculacion(entrada, false);
      await quitarSubbot(numero);
      return;
    }
    if (codigo !== baileys.DisconnectReason.restartRequired && entrada.vinculando && !vinculacionCompleta(state.creds)) {
      terminarVinculacion(entrada, false);
      await quitarSubbot(numero);
      return;
    }
    if (codigo === baileys.DisconnectReason.connectionReplaced) {
      console.log(`Subbot ${numero}: la sesión se abrió en otro lugar, se detiene.`);
      liberar(entrada);
      return;
    }

    programar(numero, codigo === baileys.DisconnectReason.restartRequired ? 500 : ESPERA_REINTENTO(entrada));
  });

  if (process.env.DEBUG_SUBS) {
    sock.ev.on("messages.upsert", (m) => console.log(`[subbot ${numero}] mensajes recibidos: ${(m.messages || []).length} (${m.type})`));
  }
  if (enlazar) enlazar(sock);
}

export async function iniciarSubbots(funcionEnlazar) {
  enlazar = funcionEnlazar;
  // MongoDB se conecta en paralelo al arrancar; si WhatsApp abre primero se espera (hasta 40 s) en vez de rendirse.
  for (let i = 0; i < 40 && !sesionesDisponibles(); i++) await new Promise((r) => setTimeout(r, 1000));
  if (!sesionesDisponibles()) {
    console.log("Subbots: MongoDB no está disponible, no se iniciaron.");
    return;
  }
  let guardados;
  try {
    guardados = await listarSubsGuardados();
  } catch (e) {
    console.log("Subbots: no se pudieron leer las sesiones: " + e.message);
    return;
  }

  for (const sub of guardados) {
    if (!sub.vinculado) {
      await eliminarSub(sub.numero).catch(() => {});
      continue;
    }
    if (subs.size >= MAX_SUBS) {
      console.log(`Subbots: se alcanzó el límite de ${MAX_SUBS}, ${sub.numero} no se inició.`);
      continue;
    }
    if (subs.has(sub.numero)) continue;
    subs.set(sub.numero, { sock: null, detenido: false, reintentos: 0, enLinea: false, temporizador: null, guardando: null, vinculando: null, codigoPedido: false, grupos: new Map(), conectando: false });
    try {
      await conectar(sub.numero);
    } catch (e) {
      console.log(`[subbot ${sub.numero}] no se pudo iniciar: ${e.message}`);
    }
    await dormir(PAUSA_ENTRE_SUBS_MS);
  }
  if (subs.size) console.log(`Subbots activos: ${subs.size}`);
}

async function existeAlguna(numero) {   // por si quedó guardado como 521... o 52...
  for (const v of variantes(numero)) if (subs.has(v) || (await existeSub(v))) return true;
  return false;
}

async function descartarIntentosIncompletos(numero) {
  for (const v of variantes(numero)) {
    const entrada = subs.get(v);
    if (entrada && entrada.vinculando) {
      entrada.vinculando.reemplazado = true;
      await quitarSubbot(v);
      continue;
    }
    if (entrada || !sesionesDisponibles()) continue;
    const guardado = await existeSub(v).catch(() => null);
    if (guardado && !guardado.vinculado) await quitarSubbot(v);
  }
}

export async function solicitarCodigo(numeroCrudo, dueno) {
  const numero = canonico(numeroCrudo);
  if (!sesionesDisponibles()) throw new Error("sin_mongo");
  await descartarIntentosIncompletos(numero);
  if (await existeAlguna(numero)) throw new Error("ya_existe");
  if (subs.size >= MAX_SUBS) throw new Error("limite");

  const { numeroParaCodigo, codigoPersonalizado } = estrategiaDeCodigo(numero);
  const entrada = { numero, numeroParaCodigo, codigoPersonalizado, sock: null, detenido: false, reintentos: 0, enLinea: false, temporizador: null, guardando: null, vinculando: null, codigoPedido: false, grupos: new Map(), conectando: false };
  const vinculando = {};
  const codigo = new Promise((resolver, rechazar) => {
    vinculando.resolverCodigo = resolver;
    vinculando.rechazarCodigo = rechazar;
  });
  const conectado = new Promise((resolver) => {
    vinculando.resolverConectado = resolver;
  });
  const vencer = () => {
    if (entrada.vinculando !== vinculando) return;
    if (vinculacionCompleta(entrada.sock?.authState?.creds) && !vinculando.prorrogado) {
      vinculando.prorrogado = true;
      vinculando.limite = setTimeout(vencer, 30000);
      return;
    }
    terminarVinculacion(entrada, false);
    quitarSubbot(numero).catch(() => {});
  };
  vinculando.limite = setTimeout(vencer, TIEMPO_VINCULACION_MS);
  entrada.vinculando = vinculando;
  subs.set(numero, entrada);

  try {
    await guardarMetaSub(numero, { dueno });
    cacheSubsGuardados = null;
    await conectar(numero);
  } catch (e) {
    terminarVinculacion(entrada, false);
    await quitarSubbot(numero);
    throw e;
  }
  return { codigo, conectado };
}

async function resolverClave(numeroCrudo) {
  const lista = variantes(numeroCrudo);
  for (const v of lista) if (subs.has(v)) return v;
  if (sesionesDisponibles()) for (const v of lista) if (await existeSub(v).catch(() => null)) return v;
  return canonico(numeroCrudo);
}

export async function quitarSubbot(numeroCrudo, { cerrarSesion = false } = {}) {
  const numero = await resolverClave(numeroCrudo);
  const entrada = subs.get(numero);
  const guardado = entrada ? true : sesionesDisponibles() && Boolean(await existeSub(numero).catch(() => null));
  if (entrada) {
    entrada.detenido = true;
    terminarVinculacion(entrada, false);
    if (cerrarSesion && entrada.sock) {
      try {
        await entrada.sock.logout();
      } catch {}
    }
    liberar(entrada);
    await entrada.vaciar?.().catch(() => {});   // que no queden claves a medio guardar al borrar la sesión
    subs.delete(numero);
  }
  if (sesionesDisponibles()) await eliminarSub(numero).catch((e) => console.log(`[subbot ${numero}] no se pudo borrar la sesión: ${e.message}`));
  cacheSubsGuardados = null;
  return guardado;
}

// Número (clave) del subbot al que pertenece este socket, o null si es el bot principal.
export function numeroSubbot(sock) {
  for (const [numero, entrada] of subs) if (entrada.sock === sock) return numero;
  return null;
}

// Número del subbot vinculado de este usuario (por ser el dueño que lo vinculó o por ser su mismo número), o null.
let cacheSubsGuardados = null;
const VIGENCIA_CACHE_SUBS_MS = 20000;

export async function subDeUsuario(sender) {
  for (const [numero, entrada] of subs) {
    if (entrada.sock?.authState?.creds?.me && mismoNumero(numero, sender)) return numero;
  }
  if (!sesionesDisponibles()) return null;
  try {
    if (!cacheSubsGuardados || cacheSubsGuardados.vence < Date.now()) {
      cacheSubsGuardados = { lista: await listarSubsGuardados(), vence: Date.now() + VIGENCIA_CACHE_SUBS_MS };
    }
  } catch {
    return null;
  }
  const yo = idCanonico(sender);
  for (const sub of cacheSubsGuardados.lista) {
    if (!sub.vinculado) continue;
    if (mismoNumero(sub.numero, sender)) return sub.numero;
    if (sub.dueno && (mismoId(sub.dueno, sender) || idCanonico(sub.dueno) === yo)) return sub.numero;
  }
  return null;
}

export function esSubbot(sock) {
  for (const entrada of subs.values()) if (entrada.sock === sock) return true;
  return false;
}

let socketDelPrincipal = null;
export function fijarSocketPrincipal(sock) {
  socketDelPrincipal = sock;
}
export function socketPrincipal() {
  return socketDelPrincipal;
}

export function socketsSubbots() {
  return [...subs.entries()].filter(([, e]) => e.sock).map(([numero, e]) => ({ numero, sock: e.sock }));
}

export function estadoSubbots() {
  return {
    limite: MAX_SUBS,
    lista: [...subs.entries()].map(([numero, e]) => ({ numero, enLinea: e.enLinea, reintentos: e.reintentos, vinculando: Boolean(e.vinculando) }))
  };
}

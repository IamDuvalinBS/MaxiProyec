import pino from "pino";
import * as baileys from "@fer2809fl/baileys";
import {
  sesionesDisponibles,
  cargarEstadoSub,
  guardarMetaSub,
  listarSubsGuardados,
  existeSub,
  eliminarSub
} from "../../motores/sesiones-mongo.js";

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

const logger = pino({ level: "silent" });
const subs = new Map();
let enlazar = null;
let versionWA = null;

function dormir(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function obtenerVersion() {
  if (!versionWA) versionWA = (await baileys.fetchLatestBaileysVersion()).version;
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
  if (error) v.rechazarCodigo(error);
  v.resolverConectado(conectado);
}

async function conectar(numero) {
  const entrada = subs.get(numero);
  if (!entrada || entrada.detenido) return;
  liberar(entrada);

  const { state, guardarCreds } = await cargarEstadoSub(numero, logger);
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
    shouldIgnoreJid: (jid) => typeof jid === "string" && (jid === "status@broadcast" || jid.endsWith("@broadcast") || jid.endsWith("@newsletter"))
  });
  entrada.sock = sock;

  sock.ev.on("creds.update", () => {   // en fila: evita que una escritura vieja pise a una nueva
    entrada.guardando = (entrada.guardando || Promise.resolve())
      .then(() => guardarCreds())
      .catch((e) => console.log(`[subbot ${numero}] no se pudo guardar la sesión: ${e.message}`));
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !state.creds.registered && entrada.vinculando && !entrada.codigoPedido) {
      entrada.codigoPedido = true;
      try {
        const codigo = await sock.requestPairingCode(numero);
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
    if (entrada.vinculando && !state.creds.me) {
      terminarVinculacion(entrada, false);
      await quitarSubbot(numero);
      return;
    }
    if (codigo === baileys.DisconnectReason.connectionReplaced) {
      console.log(`Subbot ${numero}: la sesión se abrió en otro lugar, se detiene.`);
      liberar(entrada);
      return;
    }

    const espera =
      codigo === baileys.DisconnectReason.restartRequired
        ? 500
        : Math.min(REINTENTO_MAX_MS, REINTENTO_BASE_MS * 2 ** Math.min(entrada.reintentos++, 4));
    entrada.temporizador = setTimeout(async () => {
      try {
        await entrada.guardando;
        await conectar(numero);
      } catch (e) {
        console.log(`[subbot ${numero}] no se pudo reconectar: ${e.message}`);
      }
    }, espera);
  });

  if (process.env.DEBUG_SUBS) {
    sock.ev.on("messages.upsert", (m) => console.log(`[subbot ${numero}] mensajes recibidos: ${(m.messages || []).length} (${m.type})`));
  }
  if (enlazar) enlazar(sock);
}

export async function iniciarSubbots(funcionEnlazar) {
  enlazar = funcionEnlazar;
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
    subs.set(sub.numero, { sock: null, detenido: false, reintentos: 0, enLinea: false, temporizador: null, guardando: null, vinculando: null, codigoPedido: false });
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

export async function solicitarCodigo(numeroCrudo, dueno) {
  const numero = canonico(numeroCrudo);
  if (!sesionesDisponibles()) throw new Error("sin_mongo");
  if (await existeAlguna(numero)) throw new Error("ya_existe");
  if (subs.size >= MAX_SUBS) throw new Error("limite");

  const entrada = { sock: null, detenido: false, reintentos: 0, enLinea: false, temporizador: null, guardando: null, vinculando: null, codigoPedido: false };
  const vinculando = {};
  const codigo = new Promise((resolver, rechazar) => {
    vinculando.resolverCodigo = resolver;
    vinculando.rechazarCodigo = rechazar;
  });
  const conectado = new Promise((resolver) => {
    vinculando.resolverConectado = resolver;
  });
  vinculando.limite = setTimeout(() => {
    if (entrada.vinculando && !entrada.sock?.authState?.creds?.me) {
      terminarVinculacion(entrada, false);
      quitarSubbot(numero).catch(() => {});
    }
  }, TIEMPO_VINCULACION_MS);
  entrada.vinculando = vinculando;
  subs.set(numero, entrada);

  try {
    await guardarMetaSub(numero, { dueno });
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
    subs.delete(numero);
  }
  if (sesionesDisponibles()) await eliminarSub(numero).catch((e) => console.log(`[subbot ${numero}] no se pudo borrar la sesión: ${e.message}`));
  return guardado;
}

export function esSubbot(sock) {
  for (const entrada of subs.values()) if (entrada.sock === sock) return true;
  return false;
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

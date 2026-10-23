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

  sock.ev.on("creds.update", () => {
    entrada.guardando = guardarCreds().catch((e) => console.log(`[subbot ${numero}] no se pudo guardar la sesión: ${e.message}`));
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

export async function solicitarCodigo(numero, dueno) {
  if (!sesionesDisponibles()) throw new Error("sin_mongo");
  if (subs.has(numero) || (await existeSub(numero))) throw new Error("ya_existe");
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

export async function quitarSubbot(numero, { cerrarSesion = false } = {}) {
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

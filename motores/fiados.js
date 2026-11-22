import fs from "fs";
import path from "path";
import { obtenerBase, enModoRespaldo, idCanonico, getAccount, saveAccount, addToWallet } from "./db.js";
import { karmaListo, cambiarKarma, ponerApodo, PUNTOS } from "./karma.js";
import { tarjeta, monto } from "../src/economia/formato.js";

// ═══════════════════════════════════════════════════════════════
//  MAMBO FIADO
//  Una persona le presta dinero de su mano a otra; Mambo Bot hace de banco y cobrador:
//  la deuda lleva interés (para el bot), tiene el plazo que elija quien presta (1 a 7 días) y, si vence, Mambo la cobra a la fuerza.
//  Se guarda en MongoDB (colección "fiados") o, sin Mongo, en data/fiados.json.
// ═══════════════════════════════════════════════════════════════

export const FIADO_MIN = 100;
export const FIADO_MAX = 50000;
export const INTERES = 0.2; // 500 -> 600
export const DIA_MS = 24 * 60 * 60 * 1000;
export const PLAZO_MS = DIA_MS; // plazo por defecto: 1 día
export const PLAZO_MIN_DIAS = 1;
export const PLAZO_MAX_DIAS = 7;
export const OFERTA_MS = 30 * 60 * 1000;
export const APODO_DEUDOR = "El Deudor";
export const APODO_MS = 3 * 24 * 60 * 60 * 1000;
export const KARMA_MOROSO = -20;
export const MAX_OFERTAS_ABIERTAS = 3;
const REVISION_MS = 60 * 1000;

const ARCHIVO = path.resolve("./data/fiados.json");
const fiados = new Map();
const sucios = new Set();
const socks = new Map(); // chat -> sock que lo usó (puede ser un subbot)
let sockActual = null;
let siguiente = 1;
let cargado = false;
let cargando = null;
let temporizador = null;
let intervalo = null;
let revisando = false;

const clave = (jid) => String(idCanonico(jid) || jid || "");
export const mismaPersona = (a, b) => clave(a) === clave(b);

// ───────────── Carga y guardado ─────────────

async function cargar() {
  const base = obtenerBase();
  if (base) {
    for await (const doc of base.collection("fiados").find({})) fiados.set(Number(doc._id), { ...doc, n: Number(doc._id) });
  } else if (fs.existsSync(ARCHIVO)) {
    for (const doc of Object.values(JSON.parse(fs.readFileSync(ARCHIVO, "utf8")))) fiados.set(Number(doc.n), doc);
  }
  siguiente = Math.max(0, ...fiados.keys()) + 1;
  cargado = true;
}

export function asegurarFiados() {
  if (cargado) return Promise.resolve();
  if (!obtenerBase() && process.env.MONGO_URI && !enModoRespaldo()) return Promise.resolve();
  if (!cargando) {
    cargando = cargar().catch((e) => console.log(`❌ No se pudieron cargar los fiados: ${e.message}`)).finally(() => { cargando = null; });
  }
  return cargando;
}

export const fiadosListo = () => cargado;

{
  const espera = setInterval(() => {
    if (cargado) return clearInterval(espera);
    asegurarFiados();
  }, 3000);
  espera.unref?.();
}

function programarGuardado() {
  if (temporizador) return;
  temporizador = setTimeout(() => { temporizador = null; guardarFiados(); }, 2000);
  temporizador.unref?.();
}

export function guardarFiado(f) {
  sucios.add(f.n);
  programarGuardado();
}

export async function guardarFiados() {
  if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  if (!cargado || !sucios.size) return;
  const ids = [...sucios];
  sucios.clear();
  try {
    const base = obtenerBase();
    if (base) {
      await base.collection("fiados").bulkWrite(ids.filter((n) => fiados.has(n)).map((n) => {
        const { n: _n, ...resto } = fiados.get(n);
        return { replaceOne: { filter: { _id: n }, replacement: { _id: n, ...resto }, upsert: true } };
      }), { ordered: false });
      return;
    }
    fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
    fs.writeFileSync(ARCHIVO, JSON.stringify(Object.fromEntries(fiados)));
  } catch (e) {
    console.log(`❌ Error guardando fiados: ${e.message}`);
    ids.forEach((n) => sucios.add(n));
    temporizador = setTimeout(() => { temporizador = null; guardarFiados(); }, 10000);
    temporizador.unref?.();
  }
}

// ───────────── Consultas ─────────────

export const getFiado = (n) => fiados.get(Number(n)) || null;

const estaAbierto = (f) => f.estado === "activo" || f.estado === "vencido";
const restanteDe = (f) => Math.max(0, f.deuda - f.pagado);
export { restanteDe };

function expirarOfertas() {
  const ahora = Date.now();
  for (const f of fiados.values()) {
    if (f.estado === "oferta" && f.ofertaExpira <= ahora) {
      f.estado = "expirada";
      guardarFiado(f);
    }
  }
}

export function ofertasPara(jid) {
  expirarOfertas();
  return [...fiados.values()].filter((f) => f.estado === "oferta" && f.deudor === clave(jid)).sort((a, b) => a.n - b.n);
}

export function ofertasDe(jid) {
  expirarOfertas();
  return [...fiados.values()].filter((f) => f.estado === "oferta" && f.prestamista === clave(jid));
}

// Fiados activos o vencidos donde esta persona es la que debe.
export function deudasDe(jid) {
  return [...fiados.values()].filter((f) => estaAbierto(f) && f.deudor === clave(jid)).sort((a, b) => a.n - b.n);
}

// Fiados activos o vencidos donde esta persona prestó.
export function prestadosDe(jid) {
  return [...fiados.values()].filter((f) => estaAbierto(f) && f.prestamista === clave(jid)).sort((a, b) => a.n - b.n);
}

export const tieneDeudaFiado = (jid) => deudasDe(jid).length > 0;
export const estaMoroso = (jid) => deudasDe(jid).some((f) => f.estado === "vencido");

export function deudoresDelChat(chat) {
  return [...fiados.values()].filter((f) => estaAbierto(f) && f.chat === chat).sort((a, b) => restanteDe(b) - restanteDe(a));
}

// ───────────── Dinero ─────────────

// Quita dinero de la mano y luego del banco. Devuelve cuánto pudo quitar.
function descontar(jid, cantidad) {
  const cuenta = getAccount(jid);
  const deMano = Math.min(Math.max(0, cuenta.wallet), cantidad);
  cuenta.wallet -= deMano;
  const deBanco = Math.min(Math.max(0, cuenta.bank || 0), cantidad - deMano);
  cuenta.bank = (cuenta.bank || 0) - deBanco;
  saveAccount(jid);
  return deMano + deBanco;
}

export function dineroTotal(jid) {
  const cuenta = getAccount(jid);
  return Math.max(0, cuenta.wallet) + Math.max(0, cuenta.bank || 0);
}

// Lo que se paga va primero a quien prestó (hasta recuperar lo prestado); el resto es el interés de Mambo.
function aplicarPago(f, cantidad) {
  const faltaAlPrestamista = Math.max(0, f.monto - f.entregado);
  const alPrestamista = Math.min(cantidad, faltaAlPrestamista);
  f.entregado += alPrestamista;
  f.pagado += cantidad;
  if (alPrestamista > 0) addToWallet(f.prestamistaJid, alPrestamista);
  return { alPrestamista, aMambo: cantidad - alPrestamista };
}

// ───────────── Acciones ─────────────

export const plazoDe = (f) => f.plazoMs || PLAZO_MS;

export function crearOferta({ prestamista, deudor, cantidad, chat, dias = 1 }) {
  const interes = Math.max(1, Math.round(cantidad * INTERES));
  const f = {
    n: siguiente++,
    prestamista: clave(prestamista),
    prestamistaJid: prestamista,
    deudor: clave(deudor),
    deudorJid: deudor,
    monto: cantidad,
    interes,
    deuda: cantidad + interes,
    dias,
    plazoMs: dias * DIA_MS,
    pagado: 0,
    entregado: 0,
    chat: chat || null,
    estado: "oferta",
    creadoEn: Date.now(),
    ofertaExpira: Date.now() + OFERTA_MS,
    aceptadoEn: null,
    vence: null,
    cerradoEn: null,
    aTiempo: false,
    cobradoForzoso: 0,
    penalizado: false,
    avisoPendiente: false
  };
  fiados.set(f.n, f);
  guardarFiado(f);
  return f;
}

// El deudor acepta: Mambo pasa el dinero de la mano del prestamista a la del deudor.
export function aceptarOferta(f) {
  expirarOfertas();
  if (f.estado !== "oferta") return { error: "cerrada" };
  if (estaMoroso(f.deudorJid)) return { error: "moroso" };
  if (tieneDeudaFiado(f.deudorJid)) return { error: "deuda_activa" };
  const prestamista = getAccount(f.prestamistaJid);
  if (prestamista.wallet < f.monto) {
    f.estado = "cancelada";
    guardarFiado(f);
    return { error: "sin_fondos_prestamista" };
  }
  prestamista.wallet -= f.monto;
  saveAccount(f.prestamistaJid);
  addToWallet(f.deudorJid, f.monto);
  f.estado = "activo";
  f.aceptadoEn = Date.now();
  f.vence = f.aceptadoEn + plazoDe(f);
  guardarFiado(f);
  return { ok: true };
}

// El deudor paga lo que falta (de la mano y, si no alcanza, del banco).
export function pagarDeuda(f) {
  const falta = restanteDe(f);
  if (dineroTotal(f.deudorJid) < falta) return { error: "fondos", falta, total: dineroTotal(f.deudorJid) };
  descontar(f.deudorJid, falta);
  const reparto = aplicarPago(f, falta);
  const aTiempo = f.estado === "activo" && Date.now() <= f.vence;
  f.estado = "pagado";
  f.aTiempo = aTiempo;
  f.cerradoEn = Date.now();
  guardarFiado(f);
  const karma = aTiempo ? cambiarKarma(f.deudorJid, PUNTOS.cumplir, { cuenta: "cumplido" }) : null;
  return { ok: true, falta, aTiempo, karma, ...reparto };
}

// ───────────── Cobrador automático ─────────────

function cobrarVencido(f) {
  const falta = restanteDe(f);
  const cobrado = descontar(f.deudorJid, falta);
  aplicarPago(f, cobrado);
  f.cobradoForzoso = cobrado;
  f.penalizado = true;
  f.estado = restanteDe(f) <= 0 ? "cobrado" : "vencido";
  if (f.estado === "cobrado") f.cerradoEn = Date.now();
  const karma = cambiarKarma(f.deudorJid, KARMA_MOROSO, { cuenta: "incumplido" });
  f.karmaAntes = karma.antes;
  f.karmaDespues = karma.despues;
  ponerApodo(f.deudorJid, APODO_DEUDOR, APODO_MS);
  f.avisoPendiente = true;
  guardarFiado(f);
}

const tag = (jid) => `@${String(jid || "").split("@")[0].split(":")[0]}`;

function textoCobro(f) {
  const falta = restanteDe(f);
  const lineas = [
    `👤 *DEUDOR::* ${tag(f.deudorJid)}`,
    `💰 *FIADO::* ${monto(f.monto)} ➜ ${monto(f.deuda)} a pagar`,
    `🧾 *COBRADO A LA FUERZA::* ${monto(f.cobradoForzoso)}`
  ];
  if (falta > 0) lineas.push(`⏳ *SIGUE DEBIENDO::* ${monto(falta)}`);
  if (f.entregado > 0) lineas.push(`📥 *RECUPERÓ ${tag(f.prestamistaJid)}::* ${monto(f.entregado)}`);
  lineas.push(`⭐ *KARMA::* ${f.karmaAntes} ➜ *${f.karmaDespues}* (${KARMA_MOROSO})`);
  lineas.push(`🏷️ *APODO::* ${APODO_DEUDOR} por 3 días`);
  return tarjeta({
    emoji: "🚨",
    titulo: "MAMBO COBRÓ",
    subtitulo: `Fiado #${f.n} vencido`,
    relato: `${tag(f.deudorJid)} no pagó a tiempo y Mambo fue por su dinero.`,
    lineas,
    tip: falta > 0 ? `No puede pedir otro fiado hasta pagar con *.pagarfiado ${tag(f.prestamistaJid)}*.` : "La deuda quedó saldada, pero el castigo se queda."
  });
}

async function enviarAvisos() {
  for (const f of fiados.values()) {
    if (!f.avisoPendiente) continue;
    const sock = socks.get(f.chat) || sockActual;
    if (!sock || !f.chat) continue;
    try {
      await sock.sendMessage(f.chat, { text: textoCobro(f), mentions: [f.deudorJid, f.prestamistaJid] });
      f.avisoPendiente = false;
      guardarFiado(f);
    } catch (e) {
      console.log(`❌ No se pudo avisar el cobro del fiado #${f.n}: ${e.message}`);
    }
  }
}

async function revisar() {
  if (revisando || !cargado || !karmaListo()) return;
  revisando = true;
  try {
    expirarOfertas();
    const ahora = Date.now();
    for (const f of [...fiados.values()]) {
      if (f.estado === "activo" && f.vence <= ahora) {
        try { cobrarVencido(f); } catch (e) { console.log(`❌ Error cobrando el fiado #${f.n}: ${e.message}`); }
      }
    }
    await enviarAvisos();
  } finally {
    revisando = false;
  }
}

export function registrarSock(chat, sock) {
  if (chat && sock) socks.set(chat, sock);
  if (sock && !sockActual) sockActual = sock;
}

export function iniciarCobranzaFiados(sock) {
  sockActual = sock;
  if (intervalo) return;
  intervalo = setInterval(() => revisar().catch((e) => console.log(`❌ Error en la cobranza de fiados: ${e.message}`)), REVISION_MS);
  intervalo.unref?.();
  asegurarFiados().then(() => revisar()).catch(() => {});
}

import { addToWallet, saveAccount } from "../../motores/db.js";
import { getProfile } from "../../motores/profile.js";

// ─────────────────────────────────────────────────────────────
//  CARRERA LABORAL (economía realista)
//
//  · Cada trabajo que haces (.trabajar, .crimen, .niñero, .allw... todos) es una "jornada". Un día con al menos
//    un trabajo cuenta como DÍA TRABAJADO.
//  · RACHA DE DÍAS: días seguidos trabajando. Sube el sueldo (+2% por día, hasta +30%).
//  · ESFUERZO: cada trabajo del día suma sueldo (se pagan hasta 5 trabajos por día).
//  · FALTAS: un día sin trabajar es una falta. Cada semana tienes 1 día de descanso gratis.
//    Cada falta rompe tu racha de días y descuenta 10% del sueldo (máximo 60%).
//  · SUELDO: se acumula y se cobra cada 7 días con .sueldo.
//  · REPETICIONES: cuanto más repites un oficio, más maestría tiene (+2% de ganancia por nivel, hasta Nv 10).
//  · RACHA DE VICTORIAS (por trabajo): con 2 victorias seguidas en un mismo trabajo empieza una racha que da
//    ganancia extra (+5% por victoria, hasta +30%). Solo cuenta con el comando individual: .allw no la suma,
//    no la rompe y no la usa.
//  · PUESTO: según tus días trabajados en total, subes de puesto y el sueldo por trabajo aumenta.
//
//  Todo se guarda en MongoDB, dentro del perfil de cada persona (profile.eco.carrera), igual que las misiones.
// ─────────────────────────────────────────────────────────────

const ZONA = process.env.GACHA_ZONA || "America/Mexico_City";
const DIA_MS = 24 * 60 * 60 * 1000;

export const DIAS_POR_SEMANA = 7;
export const TOPE_TRABAJOS_DIA = 5;
export const BONO_RACHA_POR_DIA = 2;
export const BONO_RACHA_MAX = 30;
export const DESCUENTO_POR_FALTA = 10;
export const DESCUENTO_MAX = 60;
export const REPS_POR_NIVEL = 25;
export const NIVEL_OFICIO_MAX = 10;
export const BONO_OFICIO_POR_NIVEL = 2;
export const VICTORIAS_PARA_RACHA = 2;
export const BONO_VICTORIA_POR_RACHA = 5;
export const BONO_VICTORIA_MAX = 30;

export const PUESTOS = [
  { nombre: "Aprendiz", emoji: "🧑‍🎓", desde: 0, pago: 1000 },
  { nombre: "Operario", emoji: "👷", desde: 10, pago: 1600 },
  { nombre: "Especialista", emoji: "🛠️", desde: 30, pago: 2400 },
  { nombre: "Experto", emoji: "🧑‍🔧", desde: 80, pago: 3500 },
  { nombre: "Maestro", emoji: "🏅", desde: 180, pago: 5000 }
];

const guardar = (jid) => saveAccount(jid);

// ── Fechas (el día cambia a medianoche en la zona del bot) ──
const formatoDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

export function numeroDeDia(ms = Date.now()) {
  const [a, m, d] = formatoDia.format(new Date(ms)).split("-").map(Number);
  return Math.floor(Date.UTC(a, m - 1, d) / DIA_MS);
}

const semanaDe = (u, dia) => Math.floor((dia - u.inicio) / DIAS_POR_SEMANA);

// ── Estado de cada persona ──
function nuevoEstado(hoy) {
  return {
    inicio: hoy, revisado: hoy - 1, dias: {}, racha: 0, mejorRacha: 0,
    faltas: 0, faltasTotal: 0, descansoSemana: -1,
    ultimaJornada: 0, jornadas: 0, trabajos: 0,
    acumulado: 0, cobrado: 0, sueldos: 0, oficios: {}, victorias: {}
  };
}

function estadoDe(jid, crear = false) {
  const perfil = getProfile(jid);
  if (!perfil.eco || typeof perfil.eco !== "object") perfil.eco = {};
  if (!perfil.eco.carrera && crear) perfil.eco.carrera = nuevoEstado(numeroDeDia());
  const u = perfil.eco.carrera || null;
  if (u && !u.victorias) u.victorias = {};
  return u;
}

// Cierra los días que ya pasaron: cada día sin trabajar usa el descanso semanal o cuenta como falta.
function cerrarDias(u, hoy) {
  for (let dia = u.revisado + 1; dia < hoy; dia++) {
    if ((u.dias[dia] || 0) > 0) continue;
    const semana = semanaDe(u, dia);
    if (u.descansoSemana !== semana) {
      u.descansoSemana = semana;
    } else {
      u.faltas++;
      u.faltasTotal++;
      u.racha = 0;
    }
  }
  if (hoy - 1 > u.revisado) u.revisado = hoy - 1;
  for (const clave of Object.keys(u.dias)) if (Number(clave) < u.revisado - 3) delete u.dias[clave];
}

export function puestoDe(jornadas) {
  let actual = PUESTOS[0];
  for (const p of PUESTOS) if (jornadas >= p.desde) actual = p;
  return actual;
}

export const siguientePuesto = (jornadas) => PUESTOS.find((p) => p.desde > jornadas) || null;
export const bonoRacha = (racha) => Math.min(BONO_RACHA_MAX, Math.max(0, racha) * BONO_RACHA_POR_DIA);
export const descuentoFaltas = (faltas) => Math.min(DESCUENTO_MAX, Math.max(0, faltas) * DESCUENTO_POR_FALTA);
export const nivelOficio = (reps) => Math.min(NIVEL_OFICIO_MAX, Math.floor((reps || 0) / REPS_POR_NIVEL));
export const bonoOficioPct = (reps) => nivelOficio(reps) * BONO_OFICIO_POR_NIVEL;

export const bonoVictorias = (racha) => (racha >= VICTORIAS_PARA_RACHA ? Math.min(BONO_VICTORIA_MAX, racha * BONO_VICTORIA_POR_RACHA) : 0);

export function rachaDeVictorias(jid, clave) {
  const u = estadoDe(jid);
  return (u && u.victorias[clave]) || 0;
}

export function rachasDeVictorias(jid) {
  const u = estadoDe(jid);
  return (u && u.victorias) || {};
}

// Lo que pagará un trabajo ganado: maestría del oficio + racha de victorias (si esta victoria la alarga).
export function bonosDeGanancia(jid, clave, { victoria = true, conRacha = true } = {}) {
  const u = estadoDe(jid);
  const maestria = bonoOficioPct(u && u.oficios[clave]);
  const rachaNueva = conRacha && victoria ? ((u && u.victorias[clave]) || 0) + 1 : 0;
  const racha = conRacha ? bonoVictorias(rachaNueva) : 0;
  return { maestria, racha, rachaNueva, multiplicador: 1 + (maestria + racha) / 100 };
}

// Se llama cada vez que haces un trabajo (ir a trabajar ya cuenta, aunque salga mal).
// conRacha=false (.allw): la racha de victorias no sube ni se rompe.
export function registrarTrabajo(jid, clave, { victoria = false, conRacha = true } = {}) {
  const u = estadoDe(jid, true);
  const ahora = Date.now();
  const hoy = numeroDeDia(ahora);
  cerrarDias(u, hoy);

  const nHoy = (u.dias[hoy] || 0) + 1;
  u.dias[hoy] = nHoy;
  const diaNuevo = nHoy === 1;
  if (diaNuevo) {
    u.racha++;
    u.jornadas++;
    if (u.racha > u.mejorRacha) u.mejorRacha = u.racha;
  }

  let pagado = 0;
  if (nHoy <= TOPE_TRABAJOS_DIA) {
    pagado = Math.round(puestoDe(u.jornadas).pago * (1 + bonoRacha(u.racha) / 100));
    u.acumulado += pagado;
  }

  const antes = nivelOficio(u.oficios[clave]);
  u.oficios[clave] = (u.oficios[clave] || 0) + 1;
  const despues = nivelOficio(u.oficios[clave]);

  let rachaVictorias = u.victorias[clave] || 0;
  let rachaPerdida = 0;
  if (conRacha) {
    if (victoria) {
      rachaVictorias++;
    } else {
      rachaPerdida = rachaVictorias >= VICTORIAS_PARA_RACHA ? rachaVictorias : 0;
      rachaVictorias = 0;
    }
    u.victorias[clave] = rachaVictorias;
  }

  u.trabajos++;
  u.ultimaJornada = ahora;
  guardar(jid);
  return {
    diaNuevo, racha: u.racha, pagado, subioOficio: despues > antes, nivelOficio: despues,
    faltas: u.faltas, descuento: descuentoFaltas(u.faltas),
    rachaVictorias, rachaPerdida, conRacha
  };
}

// Resumen para mostrar (no modifica nada salvo cerrar días ya pasados).
export function resumenCarrera(jid) {
  const u = estadoDe(jid);
  const hoy = numeroDeDia();
  if (!u) {
    return { sinDatos: true, puesto: PUESTOS[0], siguiente: PUESTOS[1], jornadas: 0, racha: 0, mejorRacha: 0, faltas: 0, faltasTotal: 0, trabajosHoy: 0, acumulado: 0, cobrado: 0, sueldos: 0, horasSinTrabajar: null, diaDeSemana: 1, diasParaCobrar: DIAS_POR_SEMANA, puedeCobrar: false, descansoDisponible: true };
  }
  cerrarDias(u, hoy);
  const transcurridos = hoy - u.inicio;
  const horas = u.ultimaJornada ? Math.floor((Date.now() - u.ultimaJornada) / 3600000) : null;
  guardar(jid);
  return {
    sinDatos: false,
    puesto: puestoDe(u.jornadas), siguiente: siguientePuesto(u.jornadas), jornadas: u.jornadas,
    racha: u.racha, mejorRacha: u.mejorRacha, faltas: u.faltas, faltasTotal: u.faltasTotal,
    trabajosHoy: u.dias[hoy] || 0, acumulado: u.acumulado, cobrado: u.cobrado, sueldos: u.sueldos,
    horasSinTrabajar: horas,
    diaDeSemana: (transcurridos % DIAS_POR_SEMANA) + 1,
    diasParaCobrar: Math.max(0, DIAS_POR_SEMANA - transcurridos),
    puedeCobrar: transcurridos >= DIAS_POR_SEMANA,
    descansoDisponible: u.descansoSemana !== semanaDe(u, hoy)
  };
}

// Cobra el sueldo si ya pasaron 7 días desde el último cobro.
export function cobrarSueldo(jid) {
  const u = estadoDe(jid);
  const hoy = numeroDeDia();
  if (!u) return { ok: false, motivo: "sin_datos" };
  cerrarDias(u, hoy);
  const transcurridos = hoy - u.inicio;
  if (transcurridos < DIAS_POR_SEMANA) return { ok: false, motivo: "falta_tiempo", dias: DIAS_POR_SEMANA - transcurridos };

  const bruto = u.acumulado;
  const pct = descuentoFaltas(u.faltas);
  const descuento = Math.round(bruto * pct / 100);
  const neto = bruto - descuento;
  const resultado = { ok: true, bruto, faltas: u.faltas, pct, descuento, neto, racha: u.racha };

  if (neto > 0) addToWallet(jid, neto);
  u.cobrado += neto;
  if (bruto > 0) u.sueldos++;
  u.acumulado = 0;
  u.faltas = 0;
  u.inicio = hoy;
  u.descansoSemana = -1;
  guardar(jid);
  return resultado;
}

export function resumenOficios(jid) {
  const u = estadoDe(jid);
  return (u && u.oficios) || {};
}

// Contadores simples para las misiones fijas.
export function contadoresCarrera(jid) {
  const u = estadoDe(jid);
  return { jornadas: u ? u.jornadas : 0, sueldos: u ? u.sueldos : 0 };
}

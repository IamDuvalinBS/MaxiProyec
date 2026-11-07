import { ZONAS, ITEMS, ORDEN_RAREZA, MAX_MINUTOS_EXPEDICION, PROB_BASURA, XP_POR_MINUTO, MAX_BOTIN } from "./mascotas-zonas.js";
import { RASGOS } from "./mascotas-datos.js";
import { nivelDe, explorando } from "./mascotas-logica.js";

const PESOS_BASURA = { comun: 55, poco_comun: 35, raro: 10 };
const HORA_MIN = 60;

export function parsearTiempo(token) {
  const m = String(token || "").toLowerCase().match(/^(\d+(?:[.,]\d+)?)(m|min|mins|h|hr|hrs)?$/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  const unidad = m[2] || "m";
  return Math.round(unidad.startsWith("h") ? n * HORA_MIN : n);
}

export function textoDuracion(minutos) {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function iniciarExpedicion(m, zona, minutos, ahora) {
  const nivel = nivelDe(m);
  if (m.expedicion) {
    return { ok: false, error: explorando(m, ahora) ? `${m.nombre} ya está investigando una zona.` : `${m.nombre} ya volvió de su expedición. Usa *.petreclamar* para recibir lo que encontró.` };
  }
  if (nivel < zona.nivel) return { ok: false, error: `${m.nombre} es nivel *${nivel}* y esta zona requiere nivel *${zona.nivel}*.` };
  if (m.dormido) return { ok: false, error: `${m.nombre} está durmiendo. Despiértalo antes de enviarlo a investigar.` };
  if (minutos < zona.minutos) return { ok: false, error: `El tiempo mínimo en *${zona.nombre}* es de ${textoDuracion(zona.minutos)}.` };
  if (minutos > MAX_MINUTOS_EXPEDICION) return { ok: false, error: `El tiempo máximo de una expedición es de ${textoDuracion(MAX_MINUTOS_EXPEDICION)}.` };
  if (m.energia < 25) return { ok: false, error: `${m.nombre} está muy cansado para investigar. Déjalo descansar.` };
  const hambreNecesaria = Math.ceil(15 + (minutos / 60) * 6 * (RASGOS[m.especie]?.hambre ?? 1));
  if (m.hambre < hambreNecesaria) {
    return { ok: false, error: `${m.nombre} necesita más comida para una expedición de ${textoDuracion(minutos)} (mínimo *${hambreNecesaria}* de comida, tiene *${Math.round(m.hambre)}*).` };
  }
  m.expedicion = { zona: zona.id, inicio: ahora, fin: ahora + minutos * 60000, minutos };
  return { ok: true, fin: m.expedicion.fin };
}

export function favorableClima(especie, c) {
  if (!c) return false;
  if (especie === "pinguino") return c.tipo === "nieve" || (c.temperatura !== null && c.temperatura <= 3);
  if (especie === "ajolote") return c.tipo === "lluvia" || c.tipo === "tormenta";
  if (especie === "dragon") return c.temperatura !== null && c.temperatura >= 26;
  if (especie === "zorro") return c.tipo === "niebla";
  if (especie === "gato") return c.tipo === "nublado";
  if (especie === "perro") return c.tipo === "despejado" && c.esDia;
  return false;
}

function elegirPonderado(pares, rnd) {
  const total = pares.reduce((a, [, p]) => a + p, 0);
  let punto = rnd() * total;
  for (const [valor, peso] of pares) {
    punto -= peso;
    if (punto < 0) return valor;
  }
  return pares[pares.length - 1][0];
}

function elegirItem(lista, pesos, indicePet, rnd) {
  const pares = ORDEN_RAREZA
    .filter((r) => lista.some((i) => i.rareza === r) && (pesos[r] || 0) > 0)
    .map((r) => [r, pesos[r] * (ORDEN_RAREZA.indexOf(r) >= 2 ? 1 + 0.05 * indicePet : 1)]);
  const rareza = elegirPonderado(pares, rnd);
  const candidatos = lista.filter((i) => i.rareza === rareza);
  return candidatos[Math.floor(rnd() * candidatos.length)];
}

export function cantidadBotin(zona, m, minutos, clima, rnd = Math.random) {
  const base = 2 * Math.pow(minutos / zona.minutos, 0.7);
  const mult = (zona.favoritas.includes(m.especie) ? 1.25 : 1) * (favorableClima(m.especie, clima) ? 1.1 : 1);
  const n = base * mult;
  return Math.max(1, Math.min(MAX_BOTIN, Math.floor(n) + (rnd() < n % 1 ? 1 : 0)));
}

export function generarBotin(zona, m, minutos, clima, rnd = Math.random) {
  const indicePet = Math.max(0, ORDEN_RAREZA.indexOf(m.rareza));
  const delaZona = Object.values(ITEMS).filter((i) => i.zona === zona.id);
  const universales = Object.values(ITEMS).filter((i) => !i.zona);
  const botin = {};
  const tiradas = cantidadBotin(zona, m, minutos, clima, rnd);
  for (let i = 0; i < tiradas; i++) {
    const it = rnd() < PROB_BASURA ? elegirItem(universales, PESOS_BASURA, indicePet, rnd) : elegirItem(delaZona, zona.pesos, indicePet, rnd);
    botin[it.id] = (botin[it.id] || 0) + 1;
  }
  return { botin, tiradas };
}

export function reclamarExpedicion(est, m, ahora, clima, rnd = Math.random) {
  const ex = m.expedicion;
  if (!ex) return { ok: false, error: `${m.nombre} no está en ninguna expedición.` };
  if (ahora < ex.fin) return { ok: false, espera: ex.fin - ahora };
  const zona = ZONAS[ex.zona];
  const nivelAntes = nivelDe(m);
  const { botin, tiradas } = generarBotin(zona, m, ex.minutos, clima, rnd);
  for (const [id, n] of Object.entries(botin)) est.items[id] = (est.items[id] || 0) + n;
  const xp = Math.round(ex.minutos * XP_POR_MINUTO * (zona.nivel / 15));
  m.xp = (m.xp || 0) + xp;
  delete m.expedicion;
  const valor = Object.entries(botin).reduce((a, [id, n]) => a + ITEMS[id].precio * n, 0);
  return { ok: true, zona, minutos: ex.minutos, botin, tiradas, xp, valor, nivelAntes, nivelDespues: nivelDe(m) };
}

export function valorDe(id, cantidad = 1) {
  return ITEMS[id].precio * cantidad;
}

export function vender(est, id, cantidad) {
  const tiene = est.items[id] || 0;
  if (tiene <= 0) return { ok: false, error: "No tienes ese ítem." };
  const n = cantidad === "todo" || !cantidad ? tiene : Math.min(tiene, cantidad);
  est.items[id] = tiene - n;
  if (est.items[id] <= 0) delete est.items[id];
  return { ok: true, cantidad: n, total: ITEMS[id].precio * n, item: ITEMS[id] };
}

export function venderTodo(est) {
  let total = 0;
  let cantidad = 0;
  for (const [id, n] of Object.entries(est.items)) {
    total += ITEMS[id].precio * n;
    cantidad += n;
  }
  est.items = {};
  return { total, cantidad };
}

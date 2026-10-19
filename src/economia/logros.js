import { getAccount, saveAccount, checkCooldown, addToWallet } from "../../motores/db.js";
import { getProfile, addXp } from "../../motores/profile.js";
import { initGachaDB } from "../../motores/gacha-db.js";
import { darTickets } from "../../motores/gacha-tickets.js";
import { darFragmentos } from "../../motores/gacha-niveles.js";
import { CAT } from "../../motores/gacha-categorias.js";
import { T } from "../../motores/gacha-tema.js";
import { trabajosRegistrados } from "./trabajos.js";
import { fmt, monto } from "./formato-evento.js";
import { tarjetaMarcada, mencion } from "./estilo-evento.js";
import { moneda } from "./temas.js";

export const CLAVE_DIARIAS = "misioneseco";
export const VIDA_DIARIAS_MS = 24 * 60 * 60 * 1000;
export const COMANDOS_LOGROS = new Set([".misioneseco", ".misioneseconomia", ".mecon", ".tareas", ".hitos", ".insigniaseco", ".logroseco", ".metas"]);

const PREMIAR_RETROACTIVOS = true;
const MISIONES_POR_DIA = 3;
const BONO_DIARIO = { dinero: 15000, xp: 250, tickets: 1 };
const HORA_MS = 60 * 60 * 1000;

let gachaOk = false;
initGachaDB().then(() => { gachaOk = true; }).catch(() => {});

export const gachaDisponible = () => gachaOk;

export const HITOS = [
  { id: "h1m", meta: 1_000_000, emoji: "🥉", nombre: "Primer Millón", dinero: 50_000, xp: 50_000 },
  { id: "h2m", meta: 2_000_000, emoji: "🥈", nombre: "Dos Millones", dinero: 120_000, xp: 75_000 },
  { id: "h5m", meta: 5_000_000, emoji: "🥇", nombre: "Cinco Millones", dinero: 250_000, xp: 100_000, tickets: 1 },
  { id: "h10m", meta: 10_000_000, emoji: "💎", nombre: "Diez Millones", dinero: 500_000, xp: 150_000, tickets: 1 },
  { id: "h25m", meta: 25_000_000, emoji: "👑", nombre: "Magnate", dinero: 1_250_000, xp: 250_000, tickets: 2 },
  { id: "h50m", meta: 50_000_000, emoji: "🏦", nombre: "Banquero", dinero: 2_500_000, xp: 400_000, tickets: 2, fragmentos: 5 },
  { id: "h100m", meta: 100_000_000, emoji: "🌟", nombre: "Centimillonario", dinero: 5_000_000, xp: 600_000, tickets: 3, fragmentos: 10 },
  { id: "h250m", meta: 250_000_000, emoji: "🏰", nombre: "Tycoon", dinero: 12_500_000, xp: 1_000_000, tickets: 4, fragmentos: 15 },
  { id: "h500m", meta: 500_000_000, emoji: "🔱", nombre: "Leyenda Financiera", dinero: 25_000_000, xp: 1_500_000, tickets: 5, fragmentos: 25 },
  { id: "h1000m", meta: 1_000_000_000, emoji: "🌌", nombre: "Billonario", dinero: 50_000_000, xp: 2_500_000, tickets: 10, fragmentos: 50 }
];

export const CADENAS = [
  {
    id: "trabajos", emoji: "⛏️", nombre: "Trabajador", stat: "trabajos", texto: (n) => `Realiza ${fmt(n)} trabajos`,
    tramos: [
      { meta: 25, dinero: 30_000, xp: 500 },
      { meta: 100, dinero: 100_000, xp: 2_000 },
      { meta: 500, dinero: 500_000, xp: 10_000, tickets: 1 },
      { meta: 2000, dinero: 2_000_000, xp: 40_000, tickets: 3, fragmentos: 5 }
    ]
  },
  {
    id: "daily", emoji: "🌻", nombre: "Constante", stat: "dailies", texto: (n) => `Reclama ${fmt(n)} veces tu .daily`,
    tramos: [
      { meta: 7, dinero: 50_000, xp: 1_000 },
      { meta: 30, dinero: 250_000, xp: 5_000, tickets: 1 },
      { meta: 100, dinero: 1_000_000, xp: 20_000, tickets: 2 },
      { meta: 365, dinero: 5_000_000, xp: 100_000, tickets: 5, fragmentos: 10 }
    ]
  },
  {
    id: "semanal", emoji: "📆", nombre: "Paciente", stat: "semanales", texto: (n) => `Reclama ${fmt(n)} veces tu .semanal`,
    tramos: [
      { meta: 4, dinero: 100_000, xp: 2_000 },
      { meta: 26, dinero: 1_000_000, xp: 20_000, tickets: 2 }
    ]
  },
  {
    id: "apuestas", emoji: "🎰", nombre: "Apostador", stat: "apuestas", texto: (n) => `Juega ${fmt(n)} apuestas`,
    tramos: [
      { meta: 25, dinero: 40_000, xp: 800 },
      { meta: 150, dinero: 300_000, xp: 4_000 },
      { meta: 750, dinero: 1_500_000, xp: 20_000, tickets: 2 }
    ]
  },
  {
    id: "ganadas", emoji: "🍀", nombre: "Afortunado", stat: "apuestas_ganadas", texto: (n) => `Gana ${fmt(n)} apuestas`,
    tramos: [
      { meta: 10, dinero: 50_000, xp: 1_000 },
      { meta: 75, dinero: 400_000, xp: 6_000 },
      { meta: 300, dinero: 2_000_000, xp: 25_000, tickets: 2 }
    ]
  },
  {
    id: "depositos", emoji: "🏛️", nombre: "Ahorrador", stat: "depositos", texto: (n) => `Haz ${fmt(n)} depósitos en el banco`,
    tramos: [
      { meta: 10, dinero: 20_000, xp: 300 },
      { meta: 100, dinero: 200_000, xp: 3_000 }
    ]
  },
  {
    id: "transferencias", emoji: "🤝", nombre: "Generoso", stat: "transferencias", texto: (n) => `Haz ${fmt(n)} transferencias a otras personas`,
    tramos: [
      { meta: 5, dinero: 30_000, xp: 500 },
      { meta: 50, dinero: 300_000, xp: 4_000 }
    ]
  },
  {
    id: "negocios", emoji: "🏪", nombre: "Empresario", stat: "negocios_cobros", texto: (n) => `Cobra ${fmt(n)} veces las ganancias de tus negocios`,
    tramos: [
      { meta: 10, dinero: 100_000, xp: 2_000 },
      { meta: 100, dinero: 1_000_000, xp: 15_000, tickets: 1 }
    ]
  },
  {
    id: "ganado", emoji: "📈", nombre: "Fortuna", stat: "ganado", texto: (n) => `Gana ${fmt(n)} ${moneda()} en total con tus actividades`,
    tramos: [
      { meta: 1_000_000, dinero: 50_000, xp: 2_000 },
      { meta: 10_000_000, dinero: 500_000, xp: 10_000, tickets: 1 },
      { meta: 100_000_000, dinero: 5_000_000, xp: 80_000, tickets: 3, fragmentos: 10 }
    ]
  },
  {
    id: "misiones", emoji: "📋", nombre: "Misionero", stat: "misiones_cobradas", texto: (n) => `Cobra ${fmt(n)} misiones diarias`,
    tramos: [
      { meta: 20, dinero: 80_000, xp: 1_500 },
      { meta: 100, dinero: 500_000, xp: 8_000, tickets: 1 }
    ]
  },
  {
    id: "trivias", emoji: "🧠", nombre: "Sabelotodo", stat: "trivias", texto: (n) => `Juega ${fmt(n)} trivias`,
    tramos: [
      { meta: 20, dinero: 40_000, xp: 700 },
      { meta: 100, dinero: 250_000, xp: 4_000 }
    ]
  },
  {
    id: "cofres", emoji: "🧰", nombre: "Cazatesoros", stat: "cofres", texto: (n) => `Abre ${fmt(n)} cofres`,
    tramos: [
      { meta: 10, dinero: 60_000, xp: 1_000 },
      { meta: 50, dinero: 400_000, xp: 6_000, tickets: 1 }
    ]
  }
];

const POOL = [
  { id: "trabajo", evento: "trabajos", rango: [3, 6], dinero: 4000, xp: 60, texto: (m) => `Trabaja ${m} ${m === 1 ? "vez" : "veces"}` },
  { id: "ganar", evento: "ganado", rango: [3, 10], unidad: 10_000, dinero: 2000, xp: 25, texto: (m) => `Gana ${fmt(m)} ${moneda()} entre trabajos, apuestas y recompensas` },
  { id: "apostar", evento: "apuestas", rango: [2, 5], dinero: 2500, xp: 40, texto: (m) => `Juega ${m} ${m === 1 ? "apuesta" : "apuestas"}` },
  { id: "ganarapuesta", evento: "apuestas_ganadas", rango: [1, 3], dinero: 6000, xp: 80, texto: (m) => `Gana ${m} ${m === 1 ? "apuesta" : "apuestas"}` },
  { id: "depositar", evento: "depositos", rango: [1, 3], dinero: 1500, xp: 25, texto: (m) => `Deposita dinero en el banco ${m} ${m === 1 ? "vez" : "veces"}` },
  { id: "transferir", evento: "transferencias", rango: [1, 2], dinero: 3000, xp: 40, texto: (m) => `Haz ${m} ${m === 1 ? "transferencia" : "transferencias"} a otra persona` },
  { id: "daily", evento: "dailies", rango: [1, 1], dinero: 5000, xp: 80, espera: { clave: "daily", ms: 24 * HORA_MS }, texto: () => "Reclama tu recompensa .daily" },
  { id: "cofre", evento: "cofres", rango: [1, 1], dinero: 6000, xp: 100, espera: { clave: "cofre", ms: 24 * HORA_MS }, texto: () => "Abre tu .cofre" },
  { id: "negocios", evento: "negocios_cobros", rango: [1, 1], dinero: 8000, xp: 120, requiere: "negocios", texto: () => "Cobra las ganancias de tus negocios" },
  { id: "trivia", evento: "trivias", rango: [1, 2], dinero: 3000, xp: 50, texto: (m) => `Juega ${m} ${m === 1 ? "trivia" : "trivias"}` }
];

const POOL_POR_ID = new Map(POOL.map((m) => [m.id, m]));

const COMANDOS_DEPOSITO = new Set([".depositar", ".dep", ".deposit"]);
const COMANDOS_TRANSFERENCIA = new Set([".transferir", ".pay", ".dar"]);
const COMANDOS_NEGOCIOS = new Set([".ngreclamar", ".ngcobrar", ".ngclaim", ".reclamarnegocios", ".cobrarnegocios"]);
const COMANDOS_SIN_GANANCIA = new Set([".prestamo", ".préstamo", ".loan"]);
const CATEGORIAS_GANANCIA = new Set(["Economía", "Trabajos", "Apuestas"]);

const ZONA = process.env.GACHA_ZONA || "America/Mexico_City";
export const fechaCorta = (ms) => new Date(ms).toLocaleDateString("es-MX", { timeZone: ZONA, day: "2-digit", month: "short", year: "numeric" });

function ecoDe(jid) {
  const p = getProfile(jid);
  if (!p.eco || typeof p.eco !== "object") p.eco = {};
  const e = p.eco;
  if (!e.stats) e.stats = {};
  if (!e.fijas) e.fijas = {};
  if (!e.fAv) e.fAv = {};
  if (!e.hitos) e.hitos = {};
  return e;
}

const sumar = (eco, clave, n = 1) => { eco.stats[clave] = (eco.stats[clave] || 0) + n; };
const patrimonioDe = (acc) => (acc.wallet || 0) + (acc.bank || 0);
const categoriaAzar = () => {
  const claves = Object.keys(CAT);
  return claves[Math.floor(Math.random() * claves.length)];
};
const necesitaGacha = (p) => Boolean(p.tickets || p.fragmentos);

export function patrimonio(jid) {
  return patrimonioDe(getAccount(jid));
}

export function estadisticaEco(jid, clave) {
  return ecoDe(jid).stats[clave] || 0;
}

function viable(def, acc, ahora) {
  if (def.requiere === "negocios") return Object.keys(acc.negocios || {}).length > 0;
  if (def.espera) {
    const libre = (acc.cooldowns[def.espera.clave] || 0) + def.espera.ms;
    return libre <= ahora + VIDA_DIARIAS_MS - 2 * HORA_MS;
  }
  return true;
}

function generarDiarias(acc) {
  const ahora = Date.now();
  const candidatas = POOL.filter((def) => viable(def, acc, ahora));
  for (let i = candidatas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
  }
  const lista = candidatas.slice(0, MISIONES_POR_DIA).map((def) => {
    const [min, max] = def.rango;
    const k = min + Math.floor(Math.random() * (max - min + 1));
    return {
      id: def.id, meta: k * (def.unidad || 1), avance: 0, cobrada: false, avisada: false,
      dinero: k * def.dinero, xp: k * def.xp
    };
  });
  return { lista, bono: false };
}

function diariasVigentes(jid) {
  const eco = ecoDe(jid);
  const acc = getAccount(jid);
  const restante = checkCooldown(jid, CLAVE_DIARIAS, VIDA_DIARIAS_MS);
  if (restante === 0 || !eco.diarias) {
    eco.diarias = generarDiarias(acc);
    saveAccount(jid);
  }
  return { diarias: eco.diarias, restante: restante || VIDA_DIARIAS_MS };
}

export function misionesDiarias(jid) {
  const { diarias, restante } = diariasVigentes(jid);
  const lista = diarias.lista
    .filter((m) => POOL_POR_ID.has(m.id))
    .map((m) => ({ ...m, texto: POOL_POR_ID.get(m.id).texto(m.meta), completa: m.avance >= m.meta }));
  return { lista, restante, bono: diarias.bono, todasCobradas: lista.length > 0 && lista.every((m) => m.cobrada) };
}

export function cadenasDe(jid) {
  const eco = ecoDe(jid);
  return CADENAS.map((c) => {
    const progreso = eco.stats[c.stat] || 0;
    const cobrados = eco.fijas[c.id] || 0;
    const tramo = c.tramos[cobrados] || null;
    return {
      ...c, progreso, cobrados, total: c.tramos.length, tramo,
      completa: cobrados >= c.tramos.length,
      lista: Boolean(tramo) && progreso >= tramo.meta
    };
  });
}

export function hitosDe(jid) {
  const eco = ecoDe(jid);
  return HITOS.map((h) => ({ ...h, logrado: eco.hitos[h.id] || 0 }));
}

export function resumenPerfil(jid) {
  const eco = ecoDe(jid);
  const logrados = HITOS.filter((h) => eco.hitos[h.id]);
  const mejor = logrados[logrados.length - 1];
  return {
    insignias: `${mejor ? `${mejor.emoji} ${mejor.nombre} · ` : ""}${logrados.length}/${HITOS.length}`,
    misiones: fmt(eco.stats.misiones_cobradas || 0)
  };
}

export function premioEnTexto(p) {
  const partes = [];
  if (p.dinero) partes.push(monto(p.dinero));
  if (p.xp) partes.push(`${fmt(p.xp)} XP`);
  if (p.tickets) partes.push(`${p.tickets} ${p.tickets === 1 ? "ticket" : "tickets"} de gacha al azar`);
  if (p.fragmentos) partes.push(`${p.fragmentos} ${p.fragmentos === 1 ? "fragmento" : "fragmentos"}`);
  return partes.join(" + ");
}

export const bonoTexto = () => premioEnTexto(BONO_DIARIO);

function entregar(jid, p) {
  const entrega = { dinero: p.dinero || 0, xp: p.xp || 0, tickets: {}, fragmentos: p.fragmentos || 0, subioNivel: false, nivel: getProfile(jid).level };
  if (entrega.dinero) addToWallet(jid, entrega.dinero);
  if (entrega.xp) {
    const r = addXp(jid, entrega.xp);
    entrega.subioNivel = r.leveledUp;
    entrega.nivel = r.newLevel;
  }
  for (let i = 0; i < (p.tickets || 0); i++) {
    const categoria = categoriaAzar();
    darTickets(jid, categoria, 1);
    entrega.tickets[categoria] = (entrega.tickets[categoria] || 0) + 1;
  }
  if (entrega.fragmentos) darFragmentos(jid, entrega.fragmentos);
  return entrega;
}

function juntar(total, entrega) {
  total.dinero += entrega.dinero;
  total.xp += entrega.xp;
  total.fragmentos += entrega.fragmentos;
  for (const [cat, n] of Object.entries(entrega.tickets)) total.tickets[cat] = (total.tickets[cat] || 0) + n;
  if (entrega.subioNivel) total.subioNivel = true;
  total.nivel = entrega.nivel;
}

export function lineasDeEntrega(total) {
  const lineas = [];
  if (total.dinero) lineas.push(`💴 *Dinero* ›› +${monto(total.dinero)}`);
  if (total.xp) lineas.push(`✨ *Experiencia* ›› +${fmt(total.xp)} XP`);
  const tickets = Object.entries(total.tickets);
  if (tickets.length) lineas.push(`🎟️ *Tickets* ›› ${tickets.map(([cat, n]) => `${n} de ${CAT[cat].plural}`).join(", ")}`);
  if (total.fragmentos) lineas.push(`🧩 *Fragmentos de ascensión* ›› +${total.fragmentos}`);
  if (total.subioNivel) lineas.push(`🎉 *Nivel* ›› Subiste al nivel ${total.nivel}`);
  return lineas;
}

const entregaVacia = () => ({ dinero: 0, xp: 0, tickets: {}, fragmentos: 0, subioNivel: false, nivel: 0 });

export function cobrarTodo(jid) {
  const eco = ecoDe(jid);
  const total = entregaVacia();
  const resultado = { diarias: [], fijas: [], bono: false, bonoPendiente: false, esperandoGacha: false, total };
  const { diarias } = diariasVigentes(jid);

  for (const m of diarias.lista) {
    const def = POOL_POR_ID.get(m.id);
    if (!def || m.cobrada || m.avance < m.meta) continue;
    m.cobrada = true;
    juntar(total, entregar(jid, { dinero: m.dinero, xp: m.xp }));
    sumar(eco, "misiones_cobradas");
    resultado.diarias.push(def.texto(m.meta));
  }

  const todas = diarias.lista.length > 0 && diarias.lista.every((m) => m.cobrada);
  if (todas && !diarias.bono) {
    if (gachaOk) {
      diarias.bono = true;
      sumar(eco, "dias_completos");
      juntar(total, entregar(jid, BONO_DIARIO));
      resultado.bono = true;
    } else {
      resultado.bonoPendiente = true;
    }
  }

  for (const c of CADENAS) {
    let cobrados = eco.fijas[c.id] || 0;
    const progreso = eco.stats[c.stat] || 0;
    while (cobrados < c.tramos.length && progreso >= c.tramos[cobrados].meta) {
      const tramo = c.tramos[cobrados];
      if (necesitaGacha(tramo) && !gachaOk) {
        resultado.esperandoGacha = true;
        break;
      }
      juntar(total, entregar(jid, tramo));
      resultado.fijas.push(`${c.emoji} ${c.nombre} ${cobrados + 1}/${c.tramos.length}`);
      cobrados++;
    }
    eco.fijas[c.id] = cobrados;
  }

  if (resultado.diarias.length || resultado.fijas.length || resultado.bono) saveAccount(jid);
  return resultado;
}

export function revisarHitos(jid) {
  const acc = getAccount(jid);
  const eco = ecoDe(jid);
  const actual = patrimonioDe(acc);
  const primeraRevision = !eco.hitosRevisados;
  const nuevos = [];
  const total = entregaVacia();

  for (const h of HITOS) {
    if (eco.hitos[h.id]) continue;
    if (actual < h.meta) break;
    if (necesitaGacha(h) && !gachaOk) break;
    const retroactivo = primeraRevision && !PREMIAR_RETROACTIVOS;
    if (!retroactivo) juntar(total, entregar(jid, h));
    eco.hitos[h.id] = Date.now();
    nuevos.push(h);
  }

  if (nuevos.length || primeraRevision) {
    eco.hitosRevisados = true;
    saveAccount(jid);
  }
  return { nuevos, total };
}

export function antesDeComando(jid) {
  const acc = getAccount(jid);
  return { wallet: acc.wallet || 0, bank: acc.bank || 0, cooldowns: { ...acc.cooldowns } };
}

function eventosDe({ comando, categoria, antes, acc }) {
  const eventos = [];
  if (COMANDOS_LOGROS.has(comando)) return eventos;
  const cambio = (clave) => (acc.cooldowns[clave] || 0) !== (antes.cooldowns[clave] || 0);
  const dMano = (acc.wallet || 0) - antes.wallet;
  const dBanco = (acc.bank || 0) - antes.bank;
  const dTotal = dMano + dBanco;

  for (const clave of trabajosRegistrados.keys()) if (cambio(clave)) eventos.push({ tipo: "trabajos" });
  if (cambio("daily")) eventos.push({ tipo: "dailies" });
  if (cambio("semanal")) eventos.push({ tipo: "semanales" });
  if (cambio("cofre")) eventos.push({ tipo: "cofres" });
  if (cambio("trivia")) eventos.push({ tipo: "trivias" });

  if (categoria === "Apuestas" && dMano !== 0) {
    eventos.push({ tipo: "apuestas" });
    if (dMano > 0) eventos.push({ tipo: "apuestas_ganadas" });
  }
  if (COMANDOS_DEPOSITO.has(comando) && dBanco > 0) eventos.push({ tipo: "depositos" });
  if (COMANDOS_TRANSFERENCIA.has(comando) && dMano < 0) eventos.push({ tipo: "transferencias" });
  if (COMANDOS_NEGOCIOS.has(comando) && dTotal > 0) eventos.push({ tipo: "negocios_cobros" });
  if (dTotal > 0 && CATEGORIAS_GANANCIA.has(categoria) && !COMANDOS_SIN_GANANCIA.has(comando)) {
    eventos.push({ tipo: "ganado", cantidad: dTotal });
  }
  return eventos;
}

function registrarEventos(jid, eventos) {
  const eco = ecoDe(jid);
  const { diarias } = diariasVigentes(jid);
  for (const e of eventos) {
    const cantidad = e.cantidad ?? 1;
    sumar(eco, e.tipo, cantidad);
    for (const m of diarias.lista) {
      const def = POOL_POR_ID.get(m.id);
      if (def && def.evento === e.tipo && !m.cobrada) m.avance = Math.min(m.meta, m.avance + cantidad);
    }
  }
  saveAccount(jid);
}

function nuevasCompletadas(jid) {
  const eco = ecoDe(jid);
  const { diarias } = diariasVigentes(jid);
  const completadas = [];
  for (const m of diarias.lista) {
    const def = POOL_POR_ID.get(m.id);
    if (def && !m.avisada && m.avance >= m.meta) {
      m.avisada = true;
      completadas.push(def.texto(m.meta));
    }
  }
  for (const c of CADENAS) {
    const progreso = eco.stats[c.stat] || 0;
    const logrados = c.tramos.filter((t) => progreso >= t.meta).length;
    const avisados = eco.fAv[c.id] || 0;
    for (let i = avisados; i < logrados; i++) completadas.push(`${c.nombre}: ${c.texto(c.tramos[i].meta)}`);
    if (logrados > avisados) eco.fAv[c.id] = logrados;
  }
  if (completadas.length) saveAccount(jid);
  return completadas;
}

function textoAvisos(jid, completadas, hitos) {
  const partes = [];
  if (completadas.length) {
    partes.push(tarjetaMarcada({
      emoji: "📋",
      titulo: T("MISIÓN COMPLETADA", "MISIÓN MALDITA COMPLETADA"),
      relato: `${mencion(jid)} completó ${completadas.length === 1 ? "una misión" : `${completadas.length} misiones`} de economía.`,
      lineas: completadas.map((t) => `> ✅ *${t}*`),
      tip: "Cobra tu recompensa con *.misioneseco cobrar*."
    }));
  }
  if (hitos.nuevos.length) {
    const lineas = hitos.nuevos.map((h) => `${h.emoji} *${h.nombre}* ›› ${monto(h.meta)}`);
    const entrega = lineasDeEntrega(hitos.total);
    partes.push(tarjetaMarcada({
      emoji: "🏅",
      titulo: T("NUEVA INSIGNIA DE MONEDAS", "NUEVA INSIGNIA DE LA NOCHE"),
      relato: `${mencion(jid)} alcanzó ${hitos.nuevos.length === 1 ? "una nueva meta" : `${hitos.nuevos.length} metas`} de patrimonio.`,
      lineas: entrega.length ? [...lineas, "", ...entrega] : lineas,
      tip: "Usa *.hitos* para ver tus insignias de monedas."
    }));
  }
  return partes.join("\n\n");
}

export async function despuesDeComando({ antes, sender, comando, categoria, reply }) {
  try {
    const acc = getAccount(sender);
    const eventos = eventosDe({ comando, categoria, antes, acc });
    let completadas = [];
    if (eventos.length) {
      registrarEventos(sender, eventos);
      completadas = nuevasCompletadas(sender);
    }
    const hitos = revisarHitos(sender);
    if (!completadas.length && !hitos.nuevos.length) return;
    await reply({ text: textoAvisos(sender, completadas, hitos), mentions: [sender] });
  } catch (e) {
    console.log("[logros] " + e.message);
  }
}

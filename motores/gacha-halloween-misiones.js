import { addToWallet } from "./db.js";
import { cantidadItem, sumarItem, itemsDe } from "./gacha-db.js";
import { darFragmentos } from "./gacha-niveles.js";
import { darTickets } from "./gacha-tickets.js";
import { CAT } from "./gacha-categorias.js";
import { esHalloween } from "../src/economia/temas.js";
import { otorgar, tieneInsignia, definicion } from "./gacha-insignias.js";
import { darReliquia, reliquiaPorId } from "./gacha-reliquias.js";
import { claveDia } from "./gacha-config.js";

// Termina a la medianoche (hora de México) del 30 de noviembre de 2026.
export const FIN_EVENTO = Date.parse("2026-12-01T06:00:00Z");
export const eventoActivo = () => esHalloween() && Date.now() < FIN_EVENTO;

const LEYENDA = /legendar|m[ií]tic|ultra/i;

export const MISIONES_HW = [
  { id: "hw_almas", emoji: "🎃", nombre: "Cosecha de Almas", desc: "Reclama 10 personajes de cualquier gacha.", meta: 10, tipo: "reclamar", dinero: 40000, fragmentos: 2, ticket: false },
  { id: "hw_vigilia", emoji: "🕯️", nombre: "Vigilia Embrujada", desc: "Haz 30 tiradas en cualquier gacha.", meta: 30, tipo: "tirada", dinero: 30000, fragmentos: 2, ticket: false },
  { id: "hw_aquelarre", emoji: "🔮", nombre: "Aquelarre Universal", desc: "Haz una tirada en cada uno de los gachas.", meta: Object.keys(CAT).length, tipo: "variedad", dinero: 60000, fragmentos: 1, ticket: true },
  { id: "hw_leyenda", emoji: "👑", nombre: "Leyenda de Ultratumba", desc: "Reclama un personaje Legendario o superior.", meta: 1, tipo: "leyenda", dinero: 100000, fragmentos: 3, ticket: true },
  { id: "hw_duelo", emoji: "⚔️", nombre: "Duelo de Medianoche", desc: "Gana 5 combates PvP en cualquier gacha.", meta: 5, tipo: "pvp", dinero: 50000, fragmentos: 2, ticket: false },
  { id: "hw_ejercito", emoji: "💀", nombre: "Ejército de Huesos", desc: "Gana 3 batallas por equipos.", meta: 3, tipo: "equipo", dinero: 70000, fragmentos: 2, ticket: true },
  { id: "hw_cosecha2", emoji: "🪦", nombre: "Cosecha Maldita", desc: "Reclama 40 personajes de cualquier gacha.", meta: 40, tipo: "reclamar", dinero: 150000, fragmentos: 4, ticket: true },
  { id: "hw_vigilia2", emoji: "🌙", nombre: "Noche Sin Fin", desc: "Haz 150 tiradas en cualquier gacha.", meta: 150, tipo: "tirada", dinero: 200000, fragmentos: 5, ticket: true },
  { id: "hw_leyenda2", emoji: "🏺", nombre: "Panteón de Leyendas", desc: "Reclama 3 personajes Legendarios o superiores.", meta: 3, tipo: "leyenda", dinero: 300000, fragmentos: 6, ticket: true },
  { id: "hw_duelo2", emoji: "🗡️", nombre: "Gladiador de la Cripta", desc: "Gana 20 combates PvP en cualquier gacha.", meta: 20, tipo: "pvp", dinero: 150000, fragmentos: 4, ticket: true },
  { id: "hw_ejercito2", emoji: "☠️", nombre: "Legión de Huesos", desc: "Gana 10 batallas por equipos.", meta: 10, tipo: "equipo", dinero: 200000, fragmentos: 5, ticket: true },
  { id: "hw_alquimista", emoji: "⚗️", nombre: "Alquimista Nocturno", desc: "Sube 40 niveles a tus personajes.", meta: 40, tipo: "mejorar", dinero: 120000, fragmentos: 3, ticket: false },
  { id: "hw_mercader", emoji: "🕯️", nombre: "Mercader de Sombras", desc: "Compra 15 artículos en las tiendas del gacha.", meta: 15, tipo: "tienda", dinero: 90000, fragmentos: 2, ticket: false }
];

const kProg = (id) => `hw:p:${id}`;
const kCobro = (id) => `hw:c:${id}`;
const kVar = "hw:v:";

const avanceDe = (usuario, m) => (m.tipo === "variedad" ? itemsDe(usuario, kVar).length : cantidadItem(usuario, kProg(m.id)));

export function misionesHalloween(usuario) {
  const vivo = eventoActivo();
  return MISIONES_HW.map((m) => {
    const avance = Math.min(m.meta, avanceDe(usuario, m));
    const hecha = cantidadItem(usuario, kCobro(m.id)) > 0;
    const premio = `${m.dinero.toLocaleString("en-US")} 🎃${m.fragmentos ? ` + ${m.fragmentos} frag.` : ""}${m.ticket ? " + ticket" : ""}`;
    return { id: m.id, emoji: m.emoji, nombre: m.nombre, desc: m.desc, meta: m.meta, avance: hecha ? m.meta : avance, hecha, premio, vivo };
  }).filter((m) => m.vivo || m.hecha);
}

export function avanzarHalloween(usuario, evento) {
  if (!eventoActivo()) return [];
  registrarContadores(usuario, evento);
  const insigniasPrevias = [];
  const cantidad = evento.cantidad ?? 1;
  const terminadas = [];
  for (const m of MISIONES_HW) {
    if (cantidadItem(usuario, kCobro(m.id))) continue;
    const antes = avanceDe(usuario, m);
    if (m.tipo === "variedad") {
      if (evento.tipo !== "tirada" || !evento.categoria) continue;
      const clave = `${kVar}${evento.categoria}`;
      if (!cantidadItem(usuario, clave)) sumarItem(usuario, clave, 1);
    } else if (m.tipo === "leyenda") {
      if (evento.tipo !== "reclamar" || !LEYENDA.test(evento.rareza || "")) continue;
      sumarItem(usuario, kProg(m.id), 1);
    } else {
      if (evento.tipo !== m.tipo) continue;
      sumarItem(usuario, kProg(m.id), cantidad);
    }
    if (antes < m.meta && avanceDe(usuario, m) >= m.meta) {
      sumarItem(usuario, kCobro(m.id), 1);
      addToWallet(usuario, m.dinero);
      if (m.fragmentos) darFragmentos(usuario, m.fragmentos);
      let ticket = null;
      if (m.ticket) {
        const cats = Object.keys(CAT);
        ticket = cats[Math.floor(Math.random() * cats.length)];
        darTickets(usuario, ticket, 1);
      }
      terminadas.push({ ...m, ticketCat: ticket });
    }
  }
  const nuevas = [...insigniasPrevias, ...revisarInsigniasHalloween(usuario)];
  if (nuevas.length) {
    if (terminadas.length) terminadas[terminadas.length - 1].insignias = nuevas;
    else terminadas.push({ soloInsignias: true, insignias: nuevas });
  }
  return terminadas;
}


// ── Contadores del evento (solo cuentan mientras el evento está activo) ──
const kN = (t) => `hw:n:${t}`;
const kDia = "hw:d:";

function registrarContadores(usuario, evento) {
  const cantidad = evento.cantidad ?? 1;
  if (["tirada", "reclamar", "pvp", "equipo", "mejorar", "tienda"].includes(evento.tipo) && cantidad > 0) sumarItem(usuario, kN(evento.tipo), cantidad);
  if (evento.tipo === "reclamar" && LEYENDA.test(evento.rareza || "")) sumarItem(usuario, kN("leyenda"), 1);
  if (evento.tipo === "tirada" || evento.tipo === "reclamar") {
    const dia = `${kDia}${claveDia()}`;
    if (!cantidadItem(usuario, dia)) sumarItem(usuario, dia, 1);
  }
}

const hechaMision = (usuario, id) => cantidadItem(usuario, kCobro(id)) > 0;

// Requisitos y premios de las insignias de temporada (difíciles, pero alcanzables durante todo el mes).
export const REQ_INSIGNIAS_HW = {
  hwi_vigilante: { tipo: "dias", meta: 15, unidad: "días" },
  hwi_cazador: { tipo: "n", clave: "reclamar", meta: 120, unidad: "reclamos" },
  hwi_invocador: { tipo: "n", clave: "tirada", meta: 400, unidad: "tiradas" },
  hwi_verdugo: { tipo: "n", clave: "pvp", meta: 50, unidad: "victorias PvP" },
  hwi_general: { tipo: "n", clave: "equipo", meta: 20, unidad: "batallas de equipo" },
  hwi_cripta: { tipo: "n", clave: "leyenda", meta: 5, unidad: "legendarios" },
  hwi_alquimista: { tipo: "n", clave: "mejorar", meta: 300, unidad: "niveles" },
  hwi_heraldo: { tipo: "misiones", meta: 10, unidad: "misiones" },
  hwi_supremo: { tipo: "insignias", meta: 8, unidad: "insignias" }
};

export const PREMIOS_INSIGNIAS_HW = {
  hwi_vigilante: { dinero: 300000, fragmentos: 8, tickets: 2 },
  hwi_cazador: { dinero: 500000, fragmentos: 12, tickets: 3, reliquia: "linterna" },
  hwi_invocador: { dinero: 500000, fragmentos: 12, tickets: 3, reliquia: "telarana" },
  hwi_verdugo: { dinero: 600000, fragmentos: 15, tickets: 3 },
  hwi_general: { dinero: 600000, fragmentos: 15, tickets: 3 },
  hwi_cripta: { dinero: 800000, fragmentos: 20, tickets: 4 },
  hwi_alquimista: { dinero: 500000, fragmentos: 12, tickets: 2 },
  hwi_heraldo: { dinero: 700000, fragmentos: 15, tickets: 3 },
  hwi_supremo: { dinero: 3000000, fragmentos: 50, tickets: 6, reliquia: "corona" }
};

export function textoPremioInsignia(id) {
  const p = PREMIOS_INSIGNIAS_HW[id];
  if (!p) return "";
  const rel = p.reliquia ? reliquiaPorId(p.reliquia) : null;
  return `${p.dinero.toLocaleString("en-US")} 🎃 + ${p.fragmentos} frag. + ${p.tickets} tickets${rel ? ` + ${rel.emoji} ${rel.nombre}` : ""}`;
}

function avanceInsignia(usuario, id) {
  const r = REQ_INSIGNIAS_HW[id];
  if (r.tipo === "dias") return itemsDe(usuario, kDia).length;
  if (r.tipo === "n") return cantidadItem(usuario, kN(r.clave));
  if (r.tipo === "misiones") return MISIONES_HW.filter((m) => hechaMision(usuario, m.id)).length;
  return Object.keys(REQ_INSIGNIAS_HW).filter((x) => x !== "hwi_supremo" && tieneInsignia(usuario, x)).length;
}

export function progresoInsigniasHw(usuario) {
  const salida = {};
  for (const [id, r] of Object.entries(REQ_INSIGNIAS_HW)) {
    salida[id] = { avance: Math.min(r.meta, avanceInsignia(usuario, id)), meta: r.meta, unidad: r.unidad, premio: textoPremioInsignia(id) };
  }
  return salida;
}

export function revisarInsigniasHalloween(usuario) {
  const nuevas = [];
  for (const id of Object.keys(REQ_INSIGNIAS_HW)) {
    if (tieneInsignia(usuario, id)) continue;
    if (avanceInsignia(usuario, id) < REQ_INSIGNIAS_HW[id].meta) continue;
    if (!otorgar(usuario, id)) continue;
    const p = PREMIOS_INSIGNIAS_HW[id];
    addToWallet(usuario, p.dinero);
    darFragmentos(usuario, p.fragmentos);
    const cats = Object.keys(CAT);
    for (let i = 0; i < p.tickets; i++) darTickets(usuario, cats[Math.floor(Math.random() * cats.length)], 1);
    if (p.reliquia) darReliquia(usuario, p.reliquia);
    nuevas.push({ ...definicion(id), premioTxt: textoPremioInsignia(id) });
  }
  return nuevas;
}

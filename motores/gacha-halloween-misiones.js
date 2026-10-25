import { addToWallet } from "./db.js";
import { cantidadItem, sumarItem, itemsDe } from "./gacha-db.js";
import { darFragmentos } from "./gacha-niveles.js";
import { darTickets } from "./gacha-tickets.js";
import { CAT } from "./gacha-categorias.js";
import { esHalloween } from "../src/economia/temas.js";

export const FIN_EVENTO = Date.parse("2026-11-03T06:00:00Z");
export const eventoActivo = () => esHalloween() && Date.now() < FIN_EVENTO;

const LEYENDA = /legendar|m[ií]tic|ultra/i;

export const MISIONES_HW = [
  { id: "hw_almas", emoji: "🎃", nombre: "Cosecha de Almas", desc: "Reclama 10 personajes de cualquier gacha.", meta: 10, tipo: "reclamar", dinero: 40000, fragmentos: 2, ticket: false },
  { id: "hw_vigilia", emoji: "🕯️", nombre: "Vigilia Embrujada", desc: "Haz 30 tiradas en cualquier gacha.", meta: 30, tipo: "tirada", dinero: 30000, fragmentos: 2, ticket: false },
  { id: "hw_aquelarre", emoji: "🔮", nombre: "Aquelarre Universal", desc: "Haz una tirada en cada uno de los gachas.", meta: Object.keys(CAT).length, tipo: "variedad", dinero: 60000, fragmentos: 1, ticket: true },
  { id: "hw_leyenda", emoji: "👑", nombre: "Leyenda de Ultratumba", desc: "Reclama un personaje Legendario o superior.", meta: 1, tipo: "leyenda", dinero: 100000, fragmentos: 3, ticket: true },
  { id: "hw_duelo", emoji: "⚔️", nombre: "Duelo de Medianoche", desc: "Gana 5 combates PvP en cualquier gacha.", meta: 5, tipo: "pvp", dinero: 50000, fragmentos: 2, ticket: false },
  { id: "hw_ejercito", emoji: "💀", nombre: "Ejército de Huesos", desc: "Gana 3 batallas por equipos.", meta: 3, tipo: "equipo", dinero: 70000, fragmentos: 2, ticket: true }
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
  return terminadas;
}

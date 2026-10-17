// Pases de los gachas: cada pase tiene un código de reclamación y da tickets de una categoría.
// Se reclama una sola vez por persona con  .pase CÓDIGO  (los códigos salen en la sección Pases de la página).
// Para agregar o cambiar pases edita solo la lista PASES.
import { cantidadItem, sumarItem } from "./gacha-db.js";
import { darTickets, ticketsDe } from "./gacha-tickets.js";

export const PASES = [
  {
    id: "waifu",
    codigo: "PASEWAIFU",
    nombre: "Pase Waifu",
    emoji: "🌸",
    gacha: "Waifus",
    categoria: "waifu",
    tickets: 2,
    descripcion: "Reclama 2 tickets de waifu y elige a la waifu que quieras con .ticket."
  },
  {
    id: "pokemon",
    codigo: "PASEPOKE",
    nombre: "Pase Pokémon",
    emoji: "🌱",
    gacha: "Pokémon",
    categoria: "pokemon",
    tickets: 2,
    descripcion: "Reclama 2 tickets de Pokémon y elige al que quieras con .ticketpoke."
  }
];

const limpiar = (t) => String(t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const itemPase = (pase) => `pase:${pase.id}`;

export const pasePorCodigo = (texto) => {
  const c = limpiar(texto);
  return c ? PASES.find((p) => limpiar(p.codigo) === c) || null : null;
};
export const paseReclamado = (usuario, pase) => cantidadItem(usuario, itemPase(pase)) > 0;
export const pasesReclamados = (usuario) => PASES.filter((p) => paseReclamado(usuario, p)).map((p) => p.id);

// Aviso opcional para que la página se entere al instante (lo registra index.js)
let aviso = null;
export const alReclamarPase = (fn) => { aviso = fn; };

export function reclamarPase(usuario, texto) {
  const pase = pasePorCodigo(texto);
  if (!pase) return { error: "nocodigo" };
  if (paseReclamado(usuario, pase)) return { error: "repetido", pase };
  sumarItem(usuario, itemPase(pase), 1);           // se marca primero: así no se puede reclamar dos veces
  darTickets(usuario, pase.categoria, pase.tickets);
  try { aviso?.(usuario); } catch {}
  return { ok: true, pase, total: ticketsDe(usuario, pase.categoria) };
}

// Lo que ve la página (bot/pases en Firestore)
export const pasesParaPagina = () => PASES.map((p) => ({
  id: p.id, n: p.nombre, e: p.emoji, g: p.gacha, d: p.descripcion, t: p.tickets, c: p.codigo
}));

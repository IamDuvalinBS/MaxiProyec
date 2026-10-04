import { cantidadItem, sumarItem, personajePorId, reclamar, leTiene, propietarios } from "./gacha-db.js";

export const PROBABILIDAD_TICKET = 0.01;

export const itemTicket = (categoria) => `ticket:${categoria}`;

export const ticketsDe = (usuario, categoria) => cantidadItem(usuario, itemTicket(categoria));

export function darTickets(usuario, categoria, cantidad) {
  sumarItem(usuario, itemTicket(categoria), cantidad);
  return ticketsDe(usuario, categoria);
}

export function sorteoTicket(usuario, categoria) {
  if (Math.random() >= PROBABILIDAD_TICKET) return false;
  darTickets(usuario, categoria, 1);
  return true;
}

export function usarTicket({ sender, categoria, charId }) {
  if (ticketsDe(sender, categoria) < 1) return { error: "sinticket" };
  const personaje = personajePorId(charId);
  if (!personaje || personaje.categoria !== categoria) return { error: "noexiste" };
  if (leTiene(sender, personaje.id)) return { error: "repetido", personaje };

  const resultado = reclamar(sender, personaje);
  if (resultado === "ocupado") return { error: "ocupado", personaje, duenos: propietarios(personaje.id) };
  if (resultado === "repetido") return { error: "repetido", personaje };

  sumarItem(sender, itemTicket(categoria), -1);
  return { ok: true, personaje, restantes: ticketsDe(sender, categoria) };
}

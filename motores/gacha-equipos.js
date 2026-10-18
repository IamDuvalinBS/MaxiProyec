import { cantidadItem, sumarItem, quitarItem, mejorDe, mejoresDe } from "./gacha-db.js";

export const TAMANO_EQUIPO = 3;

const clave = (categoria, puesto) => `equipo:${categoria}:${puesto}`;

export function idsGuardados(usuario, categoria) {
  const ids = [];
  for (let i = 1; i <= TAMANO_EQUIPO; i++) {
    const id = cantidadItem(usuario, clave(categoria, i));
    if (id > 0) ids.push(id);
  }
  return ids;
}

export function guardarEquipo(usuario, categoria, ids) {
  for (let i = 1; i <= TAMANO_EQUIPO; i++) {
    const nuevo = ids[i - 1] || 0;
    const previo = cantidadItem(usuario, clave(categoria, i));
    if (nuevo === previo) continue;
    if (!nuevo) quitarItem(usuario, clave(categoria, i));
    else sumarItem(usuario, clave(categoria, i), nuevo - previo);
  }
}

export function equipoGuardado(usuario, categoria) {
  const personajes = [];
  for (const id of idsGuardados(usuario, categoria)) {
    const p = mejorDe(usuario, categoria, id);
    if (p && !personajes.some((x) => x.id === p.id)) personajes.push(p);
  }
  return personajes;
}

export function equipoDe(usuario, categoria) {
  const guardado = equipoGuardado(usuario, categoria);
  if (guardado.length) return { personajes: guardado, automatico: false };
  return { personajes: mejoresDe(usuario, categoria, TAMANO_EQUIPO), automatico: true };
}

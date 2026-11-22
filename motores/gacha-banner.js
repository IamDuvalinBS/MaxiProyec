import {
  cantidadItem, sumarItem, fijarCantidadItem, leTiene, propietarios,
  personajePorId, personajesDeCategoria, personajeAleatorioMinRareza
} from "./gacha-db.js";
import { pokemonPorId, IDS_DESTACADOS } from "./gacha-pokemon.js";
import {
  PITY_TIRADAS, PITY_RANGO_MINIMO, PROBABILIDAD_BANNER, rangoDeRareza, semilla, claveSemana
} from "./gacha-config.js";

import { pityMaximoDe, probBannerDe } from "./gacha-reliquias.js";
import { nivelDe } from "./karma.js";

const cache = new Map();

export async function destacadoDe(categoria) {
  const semana = claveSemana();
  const guardado = cache.get(categoria);
  if (guardado && guardado.semana === semana) {
    const vigente = personajePorId(guardado.id);
    if (vigente) return vigente;
  }

  let elegido = null;
  if (categoria === "pokemon") {
    const id = IDS_DESTACADOS[semilla(`banner:pokemon:${semana}`) % IDS_DESTACADOS.length];
    elegido = await pokemonPorId(id);
  } else {
    const todos = personajesDeCategoria(categoria);
    if (!todos.length) return null;
    const buenos = todos.filter((f) => rangoDeRareza(f.rareza) >= 3);
    const base = (buenos.length ? buenos : todos).sort((a, b) => b.valor - a.valor || a.id - b.id);
    const cima = base.slice(0, Math.max(1, Math.ceil(base.length * 0.15)));
    elegido = cima[semilla(`banner:${categoria}:${semana}`) % cima.length];
  }

  if (elegido) cache.set(categoria, { semana, id: elegido.id });
  return elegido;
}

const clavePity = (categoria) => `pity:${categoria}`;

export const pityDe = (usuario, categoria) => cantidadItem(usuario, clavePity(categoria));

export const pityDespuesDe = (usuario, categoria, personaje) =>
  rangoDeRareza(personaje.rareza) >= PITY_RANGO_MINIMO ? 0 : pityDe(usuario, categoria) + 1;

export function registrarTirada(usuario, categoria, personaje) {
  if (rangoDeRareza(personaje.rareza) >= PITY_RANGO_MINIMO) fijarCantidadItem(usuario, clavePity(categoria), 0);
  else sumarItem(usuario, clavePity(categoria), 1);
}

function elegibleParaUsuario(personaje, usuario, categoria) {
  if (!personaje || leTiene(usuario, personaje.id)) return false;
  if (propietarios(personaje.id).length) return false;
  return true;
}

async function garantizado(categoria, usuario) {
  const opciones = { soloLibres: categoria === "waifu", excluirDe: usuario };
  const guardado = personajeAleatorioMinRareza(categoria, PITY_RANGO_MINIMO, opciones);
  if (guardado) return guardado;
  if (categoria !== "pokemon") return null;

  const ids = [...IDS_DESTACADOS].sort(() => Math.random() - 0.5).slice(0, 4);
  for (const id of ids) {
    try {
      const p = await pokemonPorId(id);
      if (p && rangoDeRareza(p.rareza) >= PITY_RANGO_MINIMO && !leTiene(usuario, p.id)) return p;
    } catch {}
  }
  return null;
}

export async function elegirConGarantia({ categoria, sender, obtener, previo = null }) {
  if (pityDe(sender, categoria) >= pityMaximoDe(sender) - 1) {
    try {
      const p = await garantizado(categoria, sender);
      if (p) return { personaje: p, via: "pity" };
    } catch (e) {
      console.log(`[gacha] Garantía omitida (${categoria}): ${e.message}`);
    }
  }

  // El karma cambia la suerte del gacha (la garantía de arriba nunca se pierde).
  const nivelKarma = nivelDe(sender);

  if (Math.random() < Math.min(0.9, probBannerDe(sender) * nivelKarma.banner)) {
    try {
      const destacado = await destacadoDe(categoria);
      if (elegibleParaUsuario(destacado, sender, categoria)) return { personaje: destacado, via: "banner" };
    } catch (e) {
      console.log(`[gacha] Personaje destacado omitido (${categoria}): ${e.message}`);
    }
  }

  // LEYENDA y CONFIABLE: probabilidad extra de que la tirada sea Legendaria o mejor.
  if (nivelKarma.legendario && Math.random() < nivelKarma.legendario) {
    const legendario = personajeAleatorioMinRareza(categoria, 7, { soloLibres: categoria === "waifu", excluirDe: sender });
    if (legendario) return { personaje: legendario, via: "normal" };
  }

  let personaje = previo || (await obtener());

  // POCO CONFIABLE y TRAIDOR: la tirada se repite en secreto buscando una rareza más baja (casi siempre común).
  const reintento = nivelKarma.rerollComun;
  if (reintento && personaje && Math.random() < reintento[0]) {
    const intentos = categoria === "pokemon" ? Math.min(reintento[1], 3) : reintento[1];
    for (let i = 0; i < intentos && rangoDeRareza(personaje.rareza) > reintento[2]; i++) {
      try {
        const otro = await obtener();
        if (otro && rangoDeRareza(otro.rareza) < rangoDeRareza(personaje.rareza)) personaje = otro;
      } catch {}
    }
  }

  return { personaje, via: "normal" };
}

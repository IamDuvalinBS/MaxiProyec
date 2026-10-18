import {
  cantidadItem, sumarItem, fijarCantidadItem, leTiene, propietarios,
  personajePorId, personajesDeCategoria, personajeAleatorioMinRareza
} from "./gacha-db.js";
import { pokemonPorId, IDS_DESTACADOS } from "./gacha-pokemon.js";
import {
  PITY_TIRADAS, PITY_RANGO_MINIMO, PROBABILIDAD_BANNER, rangoDeRareza, semilla, claveSemana
} from "./gacha-config.js";

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
  if (categoria === "waifu" && propietarios(personaje.id).length) return false;
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
  if (pityDe(sender, categoria) >= PITY_TIRADAS - 1) {
    try {
      const p = await garantizado(categoria, sender);
      if (p) return { personaje: p, via: "pity" };
    } catch (e) {
      console.log(`[gacha] Garantía omitida (${categoria}): ${e.message}`);
    }
  }

  if (Math.random() < PROBABILIDAD_BANNER) {
    try {
      const destacado = await destacadoDe(categoria);
      if (elegibleParaUsuario(destacado, sender, categoria)) return { personaje: destacado, via: "banner" };
    } catch (e) {
      console.log(`[gacha] Personaje destacado omitido (${categoria}): ${e.message}`);
    }
  }

  return { personaje: previo || (await obtener()), via: "normal" };
}

// motores/gacha-niveles.js
//
// Niveles, estadísticas y tiendas del gacha. TODOS los precios y rangos se editan acá arriba.
import { getAccount, addToWallet } from "./db.js";
import { mejorDe, setNivel, cantidadItem, sumarItem } from "./gacha-db.js";

export const NIVEL_MAX = { pokemon: 100, brawler: 30, snake: 50 };
export const TIENE_NIVELES = (categoria) => categoria in NIVEL_MAX;

// La rareza define qué tan fuertes son las estadísticas.
export const MULT_RAREZA = {
  "Común": 1.0, "Poco común": 1.1, "Rara": 1.2, "Súper rara": 1.3,
  "Épica": 1.45, "Mítica": 1.6, "Legendaria": 1.8, "Ultra legendaria": 2.0
};

const entre = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Devuelve las estadísticas reales de un personaje a cierto nivel.
export function statsEfectivas(p, nivel = 1) {
  const s = p.stats || { hp: 60, atk: 60, def: 60, spe: 60, tipos: [] };
  const L = Math.max(1, nivel);
  if (p.categoria === "pokemon") {
    // Fórmula de la franquicia (sin IV/EV) con multiplicador de rareza sobre las stats base.
    const m = MULT_RAREZA[p.rareza] || 1;
    const otra = (b) => Math.floor((2 * b * m * L) / 100) + 5;
    return {
      hp: Math.floor((2 * s.hp * m * L) / 100) + L + 10,
      atk: otra(s.atk), def: otra(s.def), spe: otra(s.spe),
      tipos: s.tipos || [], nivel: L, nivelCombate: L
    };
  }
  // Brawlers y snakes: la stat base ya depende de la rareza; el nivel la multiplica.
  const paso = p.categoria === "brawler" ? 0.06 : 0.05;
  const f = 1 + paso * (L - 1);
  return {
    hp: Math.round(s.hp * f), atk: Math.round(s.atk * f), def: Math.round(s.def * f), spe: Math.round(s.spe * f),
    tipos: s.tipos || [], nivel: L, nivelCombate: 50
  };
}

// ---------------- tiendas de comida / orbes (subida VARIABLE) ----------------
export const TIENDAS = {
  pokemon: {
    comando: "pokecomida", titulo: "COMIDA POKÉMON", emoji: "🍖",
    items: [
      { nombre: "Baya Aranja",    emoji: "🫐", precio: 1500,  min: 1,  max: 2 },
      { nombre: "Pokélito",       emoji: "🍬", precio: 4500,  min: 2,  max: 4 },
      { nombre: "Galleta Lava",   emoji: "🍪", precio: 11000, min: 4,  max: 7 },
      { nombre: "Curry Especial", emoji: "🍛", precio: 26000, min: 7,  max: 12 },
      { nombre: "Caramelo Raro",  emoji: "🍭", precio: 60000, min: 12, max: 20 }
    ]
  },
  snake: {
    comando: "orbes", titulo: "ORBES SNAKE", emoji: "🔮",
    items: [
      { nombre: "Orbe Chico",     emoji: "🟢", precio: 1000,  min: 1,  max: 2 },
      { nombre: "Orbe Brillante", emoji: "🔵", precio: 4000,  min: 3,  max: 5 },
      { nombre: "Orbe Arcoíris",  emoji: "🌈", precio: 12000, min: 6,  max: 10 },
      { nombre: "Mega Orbe",      emoji: "💎", precio: 35000, min: 12, max: 18 }
    ]
  }
};

export function alimentar({ categoria, sender, nItem, charId }) {
  const tienda = TIENDAS[categoria];
  const item = tienda.items[nItem - 1];
  if (!item) return { error: "item" };
  const p = mejorDe(sender, categoria, charId);
  if (!p) return { error: charId ? "ajeno" : "sinpersonajes" };
  const max = NIVEL_MAX[categoria];
  if (p.nivel >= max) return { error: "maximo", p };
  if (getAccount(sender).wallet < item.precio) return { error: "saldo", item, p };

  addToWallet(sender, -item.precio);
  const ganado = Math.min(entre(item.min, item.max), max - p.nivel);
  const despues = p.nivel + ganado;
  setNivel(sender, p.id, despues);
  return { ok: true, item, p, antes: p.nivel, despues, ganado, stats: statsEfectivas(p, despues) };
}

// ---------------- cubitos de fuerza (subida FIJA, solo Brawlers) ----------------
export const PRECIO_CUBITO = 2000;
export const ITEM_CUBITO = "cubito";

// Cubitos que cuesta pasar del nivel L al L+1 (fijo).
export function cubitosParaSubir(L) {
  if (L < 10) return 2;
  if (L < 20) return 4;
  return 6;
}

export function comprarCubitos(sender, cantidad) {
  const total = PRECIO_CUBITO * cantidad;
  if (getAccount(sender).wallet < total) return { error: "saldo", total };
  addToWallet(sender, -total);
  sumarItem(sender, ITEM_CUBITO, cantidad);
  return { ok: true, total, tiene: cantidadItem(sender, ITEM_CUBITO) };
}

// Sube `veces` niveles (o los que alcance / hasta el máximo si veces = Infinity).
export function subirBrawler({ sender, charId, veces = 1 }) {
  const p = mejorDe(sender, "brawler", charId);
  if (!p) return { error: charId ? "ajeno" : "sinpersonajes" };
  const max = NIVEL_MAX.brawler;
  if (p.nivel >= max) return { error: "maximo", p };

  let nivel = p.nivel, gastados = 0, tiene = cantidadItem(sender, ITEM_CUBITO), subidos = 0;
  while (subidos < veces && nivel < max) {
    const costo = cubitosParaSubir(nivel);
    if (tiene < costo) break;
    tiene -= costo; gastados += costo; nivel++; subidos++;
  }
  if (!subidos) return { error: "cubitos", p, faltan: cubitosParaSubir(p.nivel) - tiene, necesarios: cubitosParaSubir(p.nivel), tiene };

  sumarItem(sender, ITEM_CUBITO, -gastados);
  setNivel(sender, p.id, nivel);
  return { ok: true, p, antes: p.nivel, despues: nivel, gastados, restantes: tiene, stats: statsEfectivas(p, nivel) };
}

export const cubitosDe = (sender) => cantidadItem(sender, ITEM_CUBITO);

import { getAccount, addToWallet } from "./db.js";
import { mejorDe, setNivel, cantidadItem, sumarItem } from "./gacha-db.js";

export const NIVEL_MAX = { pokemon: 100, brawler: 30, snake: 50, cod: 50, dragon: 50, clash: 15 };
export const TIENE_NIVELES = (categoria) => categoria in NIVEL_MAX;

export const MULT_RAREZA = {
  "Común": 1.0, "Poco común": 1.1, "Rara": 1.2, "Súper rara": 1.3,
  "Épica": 1.45, "Mítica": 1.6, "Legendaria": 1.8, "Ultra legendaria": 2.0
};

export function statsEfectivas(p, nivel = 1) {
  const s = p.stats || { hp: 60, atk: 60, def: 60, spe: 60, tipos: [] };
  const L = Math.max(1, nivel);
  if (p.categoria === "pokemon") {
    const m = MULT_RAREZA[p.rareza] || 1;
    const otra = (b) => Math.floor((2 * b * m * L) / 100) + 5;
    return {
      hp: Math.floor((2 * s.hp * m * L) / 100) + L + 10,
      atk: otra(s.atk), def: otra(s.def), spe: otra(s.spe),
      tipos: s.tipos || [], nivel: L, nivelCombate: L
    };
  }
  const paso = p.categoria === "brawler" ? 0.06 : 0.05;
  const f = 1 + paso * (L - 1);
  return {
    hp: Math.round(s.hp * f), atk: Math.round(s.atk * f), def: Math.round(s.def * f), spe: Math.round(s.spe * f),
    tipos: s.tipos || [], nivel: L, nivelCombate: 50
  };
}

export const TIENDAS = {
  pokemon: {
    titulo: "POKEMON FOOD",
    emoji: "🥙",
    nombre: "comida",
    plural: "comidas",
    comandoTienda: ".pokecomida",
    comandoComprar: ".pokefood",
    comandoDar: ".pokedar",
    items: [
      { nombre: "Baya Aranja", emoji: "🫐", precio: 1500, niveles: 1 },
      { nombre: "Pokélito", emoji: "🍬", precio: 4500, niveles: 3 },
      { nombre: "Galleta Lava", emoji: "🍪", precio: 11000, niveles: 5 },
      { nombre: "Curry Especial", emoji: "🍛", precio: 26000, niveles: 9 },
      { nombre: "Caramelo Raro", emoji: "🍭", precio: 60000, niveles: 16 }
    ]
  },
  cod: {
    titulo: "COD ARSENAL",
    emoji: "🔫",
    nombre: "mejora",
    plural: "mejoras",
    comandoTienda: ".codtienda",
    comandoComprar: ".codcomprar",
    comandoDar: ".codmejorar",
    items: [
      { nombre: "Kit de Munición", emoji: "🔹", precio: 1200, niveles: 1 },
      { nombre: "Mira Holográfica", emoji: "🎯", precio: 4000, niveles: 4 },
      { nombre: "Silenciador Táctico", emoji: "🔇", precio: 9500, niveles: 8 },
      { nombre: "Camuflaje Dorado", emoji: "🥇", precio: 30000, niveles: 15 }
    ]
  },
  dragon: {
    titulo: "DRAGON FOOD",
    emoji: "🍖",
    nombre: "comida",
    plural: "comidas",
    comandoTienda: ".dragonfood",
    comandoComprar: ".dragoncomprar",
    comandoDar: ".dragondar",
    items: [
      { nombre: "Carne Seca", emoji: "🥩", precio: 1200, niveles: 1 },
      { nombre: "Pastel de Fuego", emoji: "🍰", precio: 4000, niveles: 4 },
      { nombre: "Fruta Mágica", emoji: "🍎", precio: 12000, niveles: 8 },
      { nombre: "Elixir Ancestral", emoji: "🧪", precio: 35000, niveles: 15 }
    ]
  },
  clash: {
    titulo: "CLASH COFRES",
    emoji: "💰",
    nombre: "cofre",
    plural: "cofres",
    comandoTienda: ".clashtienda",
    comandoComprar: ".clashcomprar",
    comandoDar: ".clashmejorar",
    items: [
      { nombre: "Bolsa de Oro", emoji: "👝", precio: 1200, niveles: 1 },
      { nombre: "Cofre de Plata", emoji: "🥈", precio: 4500, niveles: 2 },
      { nombre: "Cofre Dorado", emoji: "🥇", precio: 12000, niveles: 4 },
      { nombre: "Cofre Mágico", emoji: "🔮", precio: 32000, niveles: 7 }
    ]
  },
  snake: {
    titulo: "ORBES SNAKE",
    emoji: "🔮",
    nombre: "orbe",
    plural: "orbes",
    comandoTienda: ".orbes",
    comandoComprar: ".orbe",
    comandoDar: ".darorbe",
    items: [
      { nombre: "Orbe Chico", emoji: "🟢", precio: 1000, niveles: 1 },
      { nombre: "Orbe Brillante", emoji: "🔵", precio: 4000, niveles: 4 },
      { nombre: "Orbe Arcoíris", emoji: "🌈", precio: 12000, niveles: 8 },
      { nombre: "Mega Orbe", emoji: "💎", precio: 35000, niveles: 15 }
    ]
  }
};

export const claveComida = (categoria, n) => `${categoria}:comida:${n}`;

export const comidaDe = (sender, categoria, n) => cantidadItem(sender, claveComida(categoria, n));

export function comprarComida({ categoria, sender, nItem, cantidad = 1 }) {
  const item = TIENDAS[categoria].items[nItem - 1];
  if (!item) return { error: "item" };
  const total = item.precio * cantidad;
  if (getAccount(sender).wallet < total) return { error: "saldo", item, total };

  addToWallet(sender, -total);
  sumarItem(sender, claveComida(categoria, nItem), cantidad);
  return { ok: true, item, cantidad, total, tiene: comidaDe(sender, categoria, nItem) };
}

export function darComida({ categoria, sender, nItem, charId, cantidad = 1 }) {
  const item = TIENDAS[categoria].items[nItem - 1];
  if (!item) return { error: "item" };

  const p = mejorDe(sender, categoria, charId);
  if (!p) return { error: charId ? "ajeno" : "sinpersonajes" };

  const max = NIVEL_MAX[categoria];
  if (p.nivel >= max) return { error: "maximo", p };

  const tiene = comidaDe(sender, categoria, nItem);
  if (tiene < 1) return { error: "sincomida", item, p };

  const necesarias = Math.ceil((max - p.nivel) / item.niveles);
  const unidades = Math.min(cantidad, tiene, necesarias);
  const ganado = Math.min(unidades * item.niveles, max - p.nivel);
  const despues = p.nivel + ganado;

  sumarItem(sender, claveComida(categoria, nItem), -unidades);
  setNivel(sender, p.id, despues);
  return {
    ok: true, item, p, unidades, ganado, antes: p.nivel, despues,
    restantes: tiene - unidades, stats: statsEfectivas(p, despues)
  };
}

export const PRECIO_CUBITO = 2000;
export const ITEM_CUBITO = "cubito";

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

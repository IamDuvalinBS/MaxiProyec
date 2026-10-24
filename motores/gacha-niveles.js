import { getAccount, addToWallet } from "./db.js";
import { mejorDe, setNivel, setEstrellas, cantidadItem, sumarItem } from "./gacha-db.js";
import { estadisticasDeRango } from "./gacha-catalogos.js";
import { esHalloween } from "../src/economia/temas.js";

export const NIVEL_MAX = { waifu: 50, pokemon: 100, brawler: 30, snake: 50, cod: 50, dragon: 50, clash: 15 };
export const TIENE_NIVELES = (categoria) => categoria in NIVEL_MAX;
export const nivelAleatorio = (categoria) => (categoria in NIVEL_MAX ? 1 + Math.floor(Math.random() * NIVEL_MAX[categoria]) : 1);

export const MAX_ESTRELLAS = 5;
export const NIVELES_POR_ESTRELLA = 10;
export const BONO_POR_ESTRELLA = 0.08;
export const ITEM_FRAGMENTO = "fragmentos";

export const nivelMaxDe = (categoria, estrellas = 0) => NIVEL_MAX[categoria] + NIVELES_POR_ESTRELLA * Math.min(MAX_ESTRELLAS, estrellas || 0);
export const RAREZA_NOMBRES = { 1: "Común", 2: "Poco común", 3: "Rara", 4: "Súper rara", 5: "Épica", 6: "Mítica", 7: "Legendaria" };
export const estrellasTexto = (n) => (n ? "★".repeat(n) : "");

const RANGO_RAREZA = {
  "Común": 1, "Poco común": 2, "Rara": 3, "Súper rara": 4, "Épica": 5, "Mítica": 6, "Legendaria": 7, "Ultra legendaria": 7
};

export function statsBase(p) {
  if (p.stats) return p.stats;
  return estadisticasDeRango(`${p.categoria}:${p.clave ?? p.id}`, RANGO_RAREZA[p.rareza] || 1);
}

export const MULT_RAREZA = {
  "Común": 1.0, "Poco común": 1.1, "Rara": 1.2, "Súper rara": 1.3,
  "Épica": 1.45, "Mítica": 1.6, "Legendaria": 1.8, "Ultra legendaria": 2.0
};

const CRECIMIENTO_NIVEL = 2.45;
const BONO_NIVEL_EXTRA = 0.02;
export const FACTOR_POKEMON = 1.0;
export const NIVEL_COMBATE = 50;

export function statsEfectivas(p, nivel = 1) {
  const s = statsBase(p);
  const L = Math.max(1, nivel);
  const max = NIVEL_MAX[p.categoria] || 50;
  const estrellas = 1 + BONO_POR_ESTRELLA * Math.min(MAX_ESTRELLAS, p.estrellas || 0);
  const dentro = Math.min(L, max) - 1;
  const extra = Math.max(0, L - max);
  const f = (1 + (CRECIMIENTO_NIVEL * dentro) / Math.max(1, max - 1) + BONO_NIVEL_EXTRA * extra) * estrellas;
  const m = p.categoria === "pokemon" ? (MULT_RAREZA[p.rareza] || 1) * FACTOR_POKEMON : 1;
  const calcular = (base) => Math.max(1, Math.round(base * f * m));
  return {
    hp: calcular(s.hp), atk: calcular(s.atk), def: calcular(s.def), spe: calcular(s.spe),
    tipos: s.tipos || [], nivel: L, nivelCombate: NIVEL_COMBATE
  };
}

const TIENDAS_BASE = {
  waifu: {
    titulo: "REGALOS WAIFU",
    emoji: "🎁",
    nombre: "regalo",
    plural: "regalos",
    comandoTienda: ".waifushop",
    comandoComprar: ".waifucomprar",
    comandoDar: ".waifudar",
    items: [
      { nombre: "Chocolate", emoji: "🍫", precio: 1200, niveles: 1 },
      { nombre: "Peluche", emoji: "🧸", precio: 4000, niveles: 4 },
      { nombre: "Ramo de Flores", emoji: "💐", precio: 11000, niveles: 8 },
      { nombre: "Anillo de Joya", emoji: "💍", precio: 32000, niveles: 15 }
    ]
  },
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

// Extensión de Halloween: solo nombres y emojis (se emparejan por posición con los artículos
// normales; los precios y los niveles que dan salen siempre de la tienda normal).
const TIENDAS_HALLOWEEN = {
  waifu: {
    titulo: "REGALOS MALDITOS WAIFU",
    items: [
      { nombre: "Chocolate Embrujado", emoji: "🍫" },
      { nombre: "Peluche Fantasma", emoji: "🧸" },
      { nombre: "Ramo de Rosas Negras", emoji: "🥀" },
      { nombre: "Anillo Maldito", emoji: "💍" }
    ]
  },
  pokemon: {
    titulo: "POKEMON FOOD MACABRO",
    items: [
      { nombre: "Baya Maldita", emoji: "🫐" },
      { nombre: "Pokélito de Calabaza", emoji: "🎃" },
      { nombre: "Galleta de Cementerio", emoji: "🍪" },
      { nombre: "Curry de Bruja", emoji: "🍛" },
      { nombre: "Caramelo Embrujado", emoji: "🍭" }
    ]
  },
  cod: {
    titulo: "ARSENAL DE ULTRATUMBA",
    items: [
      { nombre: "Munición de Plata", emoji: "🔹" },
      { nombre: "Mira Espectral", emoji: "🎯" },
      { nombre: "Silenciador de Sombras", emoji: "🔇" },
      { nombre: "Camuflaje de Calavera", emoji: "💀" }
    ]
  },
  dragon: {
    titulo: "FESTÍN DE DRAGONES",
    items: [
      { nombre: "Hueso Seco", emoji: "🦴" },
      { nombre: "Pastel de Calabaza Ardiente", emoji: "🎃" },
      { nombre: "Fruta Embrujada", emoji: "🍎" },
      { nombre: "Elixir de Vampiro", emoji: "🧪" }
    ]
  },
  clash: {
    titulo: "COFRES MALDITOS",
    items: [
      { nombre: "Bolsa de Calabazas", emoji: "🎃" },
      { nombre: "Cofre de Hueso", emoji: "🦴" },
      { nombre: "Ataúd Dorado", emoji: "⚰️" },
      { nombre: "Cofre de Bruja", emoji: "🔮" }
    ]
  },
  snake: {
    titulo: "ORBES MALDITOS",
    items: [
      { nombre: "Orbe de Niebla", emoji: "🟢" },
      { nombre: "Orbe Espectral", emoji: "🔵" },
      { nombre: "Orbe Hechizado", emoji: "🌈" },
      { nombre: "Mega Orbe Maldito", emoji: "💎" }
    ]
  }
};

// Vista "viva": consulta el evento activo en cada acceso.
export const TIENDAS = {};
for (const [clave, base] of Object.entries(TIENDAS_BASE)) {
  const vista = { ...base };
  Object.defineProperty(vista, "titulo", {
    enumerable: true,
    get: () => (esHalloween() ? TIENDAS_HALLOWEEN[clave]?.titulo ?? base.titulo : base.titulo)
  });
  Object.defineProperty(vista, "items", {
    enumerable: true,
    get: () => {
      const h = esHalloween() ? TIENDAS_HALLOWEEN[clave]?.items : null;
      return h ? base.items.map((item, i) => ({ ...item, ...(h[i] || {}) })) : base.items;
    }
  });
  TIENDAS[clave] = vista;
}

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

  const max = nivelMaxDe(categoria, p.estrellas);
  if (p.nivel >= max) return { error: "maximo", p, max };

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
  const max = nivelMaxDe("brawler", p.estrellas);
  if (p.nivel >= max) return { error: "maximo", p, max };

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

export const FRAGMENTOS_POR_RAREZA = {
  "Común": 1, "Poco común": 1, "Rara": 2, "Súper rara": 2, "Épica": 3, "Mítica": 4, "Legendaria": 5, "Ultra legendaria": 6
};

export const fragmentosDe = (sender) => cantidadItem(sender, ITEM_FRAGMENTO);

export function darFragmentos(sender, cantidad) {
  if (cantidad > 0) sumarItem(sender, ITEM_FRAGMENTO, cantidad);
  return fragmentosDe(sender);
}

export const costoAscension = (estrellas) => ({ fragmentos: (estrellas + 1) * 5, dinero: (estrellas + 1) * 50000 });

export function ascender({ sender, categoria, charId }) {
  const p = mejorDe(sender, categoria, charId);
  if (!p) return { error: charId ? "ajeno" : "sinpersonajes" };

  const estrellas = p.estrellas || 0;
  if (estrellas >= MAX_ESTRELLAS) return { error: "estrellas", p };

  const max = nivelMaxDe(categoria, estrellas);
  if (p.nivel < max) return { error: "nivel", p, max };

  const costo = costoAscension(estrellas);
  const fragmentos = fragmentosDe(sender);
  if (fragmentos < costo.fragmentos) return { error: "fragmentos", p, costo, fragmentos };
  if (getAccount(sender).wallet < costo.dinero) return { error: "saldo", p, costo };

  sumarItem(sender, ITEM_FRAGMENTO, -costo.fragmentos);
  addToWallet(sender, -costo.dinero);
  setEstrellas(sender, p.id, estrellas + 1);

  const mejorada = { ...p, estrellas: estrellas + 1 };
  return {
    ok: true, p: mejorada, antes: estrellas, despues: estrellas + 1, costo,
    nuevoMax: nivelMaxDe(categoria, estrellas + 1), stats: statsEfectivas(mejorada, p.nivel),
    restantes: fragmentosDe(sender)
  };
}

import axios from "axios";
import { crearPersonaje, contarPersonajes } from "./gacha-db.js";

const API = "https://api.brawlapi.com/v1/brawlers";
const CDN = (id) => `https://cdn.brawlify.com/brawlers/borders/${id}.png`;

const RANGO = [
  ["ultra", 7], ["legend", 6], ["mythic", 5], ["epic", 4], ["super", 3], ["rare", 2]
];
function rangoDe(nombreRareza = "") {
  const n = nombreRareza.toLowerCase();
  for (const [clave, valor] of RANGO) if (n.includes(clave)) return valor;
  return 1;
}
const RAREZA_ES = { 1: "Común", 2: "Rara", 3: "Súper rara", 4: "Épica", 5: "Mítica", 6: "Legendaria", 7: "Ultra legendaria" };

function estadisticas(id, rango, clase = "") {
  const c = clase.toLowerCase();
  const semilla = (n) => ((Number(id) * 2654435761 + n * 40503) >>> 0) % 21;
  let hp = 60 + rango * 11, atk = 60 + rango * 9, def = 55 + rango * 8, spe = 60 + rango * 7;
  if (c.includes("tank")) { hp += 25; def += 15; spe -= 10; }
  else if (c.includes("assassin")) { atk += 20; spe += 20; hp -= 15; }
  else if (c.includes("marksman") || c.includes("sniper")) { atk += 20; hp -= 10; def -= 5; }
  else if (c.includes("artillery")) { atk += 15; def -= 10; }
  else if (c.includes("support") || c.includes("controller")) { def += 10; spe += 5; }
  return { hp: hp + semilla(1), atk: atk + semilla(2), def: def + semilla(3), spe: spe + semilla(4), tipos: [] };
}

export async function sincronizarBrawlers() {
  const { data } = await axios.get(API, { timeout: 25000, headers: { "User-Agent": "MaxiBot/1.0" } });
  const lista = Array.isArray(data) ? data : (data.list || data.brawlers || []);
  let nuevos = 0;
  for (const b of lista) {
    if (b.released === false) continue;
    const rango = rangoDe(b.rarity?.name);
    const st = estadisticas(b.id, rango, b.class?.name);
    const suma = st.hp + st.atk + st.def + st.spe;
    const creado = crearPersonaje({
      categoria: "brawler",
      clave: String(b.id),
      nombre: b.name.charAt(0) + b.name.slice(1).toLowerCase(),
      serie: b.class?.name ? `Brawl Stars · ${b.class.name}` : "Brawl Stars",
      genero: "",
      rareza: RAREZA_ES[rango],
      valor: suma * 10 + rango * 1500,
      img: b.imageUrl || CDN(b.id),
      stats: st,
      meta: { rango, clase: b.class?.name || null }
    });
    if (creado) nuevos++;
  }
  return { total: lista.length, nuevos };
}

export async function asegurarBrawlers() {
  if (contarPersonajes("brawler") === 0) await sincronizarBrawlers();
}

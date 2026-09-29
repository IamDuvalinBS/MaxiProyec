// motores/gacha-pokemon.js
//
// Proveedor de Pokémon: PokeAPI (https://pokeapi.co). Gratis, sin API key.
// Las imágenes son el "official artwork" alojado en el repo PokeAPI/sprites (GitHub);
// en la base solo se guarda la URL. El Pokémon se descarga de la API la primera vez que
// sale y desde entonces se lee de SQLite.
import axios from "axios";
import { crearPersonaje, personajePorClave } from "./gacha-db.js";

const API = "https://pokeapi.co/api/v2/pokemon";
const ULTIMO_DEX = 1025;
const ARTWORK = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const TIPOS_ES = {
  normal: "Normal", fire: "Fuego", water: "Agua", electric: "Eléctrico", grass: "Planta", ice: "Hielo",
  fighting: "Lucha", poison: "Veneno", ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
  rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro", steel: "Acero", fairy: "Hada"
};
export const tipoEs = (t) => TIPOS_ES[t] || t;

function rarezaPorBST(bst) {
  if (bst >= 600) return "Legendaria";
  if (bst >= 530) return "Épica";
  if (bst >= 450) return "Rara";
  if (bst >= 350) return "Poco común";
  return "Común";
}

function bonito(nombre) {
  return nombre.replace(/-/g, " ").replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

async function traer(id) {
  const { data } = await axios.get(`${API}/${id}`, { timeout: 20000, headers: { "User-Agent": "MaxiBot/1.0" } });
  const st = Object.fromEntries(data.stats.map((s) => [s.stat.name, s.base_stat]));
  const bst = Object.values(st).reduce((a, b) => a + b, 0);
  const img =
    data.sprites?.other?.["official-artwork"]?.front_default ||
    data.sprites?.front_default ||
    ARTWORK(id);
  return {
    categoria: "pokemon",
    clave: String(id),
    nombre: bonito(data.name),
    serie: "Pokémon",
    genero: "",
    rareza: rarezaPorBST(bst),
    valor: bst * 20,
    img,
    stats: {
      hp: st.hp, atk: st.attack, def: st.defense, spa: st["special-attack"], spd: st["special-defense"], spe: st.speed,
      bst, tipos: data.types.map((t) => t.type.name)
    }
  };
}

// Devuelve un Pokémon al azar (de SQLite si ya lo conocemos, si no de PokeAPI).
export async function pokemonAleatorio() {
  for (let intento = 0; intento < 4; intento++) {
    const id = Math.floor(Math.random() * ULTIMO_DEX) + 1;
    const guardado = personajePorClave("pokemon", id);
    if (guardado) return guardado;
    try {
      const datos = await traer(id);
      crearPersonaje(datos);
      return personajePorClave("pokemon", id);
    } catch (e) {
      // 404 / red: probamos con otro
    }
  }
  return null;
}

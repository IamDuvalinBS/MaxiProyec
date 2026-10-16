import { config, saveConfig } from "./db.js";
import { enviarConBoton } from "./botones.js";

export const FIRMA_CLAIM = "ByDuvalinBS";
export const PREFIJO_CLAIM = "#✿ ";
export const TEXTO_CLAIM_BASE = "{user} reclamó a {personaje} para seguir con su colección de {variante} ✨";
export const LIMITE_TEXTO_CLAIM = 400;

export const VARIANTES = {
  waifu: { nombre: "Waifus", alias: ["waifu", "waifus", "harem", "rw"] },
  pokemon: { nombre: "Pokémon", alias: ["pokemon", "poke", "pokemons"] },
  brawler: { nombre: "Brawl Stars", alias: ["brawl", "brawlstars", "brawler", "brawlers", "bs"] },
  snake: { nombre: "Snake", alias: ["snake", "snakes", "gusanito", "gusanitos"] },
  cod: { nombre: "Call of Duty", alias: ["cod", "callofduty", "call"] },
  dragon: { nombre: "Dragon Mania Legends", alias: ["dragon", "dragones", "dragonmania", "dragonmanialegends", "dml"] },
  clash: { nombre: "Clash Royale", alias: ["clash", "clashroyale", "royale", "cr"] }
};

const normalizar = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
const arroba = (jid) => `@${jid.split("@")[0]}`;

export function resolverVariante(texto) {
  const clave = normalizar(texto);
  if (!clave) return null;
  if (["todos", "todas", "all"].includes(clave)) return "todos";
  for (const [categoria, v] of Object.entries(VARIANTES)) {
    if (v.alias.includes(clave) || normalizar(v.nombre) === clave) return categoria;
  }
  return null;
}

export const listaVariantes = () => Object.values(VARIANTES).map((v) => v.nombre).join(", ");

export function mensajeReclamo({ categoria, sender, personaje }) {
  const variante = VARIANTES[categoria]?.nombre || categoria;
  const base = config.gachaClaim?.[categoria] || TEXTO_CLAIM_BASE;
  const mentions = [];
  const texto = PREFIJO_CLAIM + base
    .replace(/\{user\}/gi, () => {
      if (!mentions.includes(sender)) mentions.push(sender);
      return arroba(sender);
    })
    .replace(/\{(personaje|nombre)\}/gi, `*${personaje.nombre}*`)
    .replace(/\{variante\}/gi, `*${variante}*`);

  return { texto, mentions };
}

export async function enviarReclamo({ sock, from, msg, texto, mentions, reply }) {
  let enviado = false;
  if (sock) {
    enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto,
      footer: FIRMA_CLAIM,
      boton: null,
      mentions
    });
  }
  if (!enviado) await reply({ text: `${texto}\n\n${FIRMA_CLAIM}`, mentions });
}

export async function guardarClaim(categoria, texto) {
  const claves = categoria === "todos" ? Object.keys(VARIANTES) : [categoria];
  const actual = { ...(config.gachaClaim || {}) };
  for (const c of claves) {
    if (texto) actual[c] = texto;
    else delete actual[c];
  }
  config.gachaClaim = actual;
  await saveConfig();
}

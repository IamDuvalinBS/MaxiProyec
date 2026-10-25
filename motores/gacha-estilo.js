import { encabezado } from "../src/economia/estilo.js";
import { fmt } from "../src/economia/formato.js";
import { estilo, moneda } from "../src/economia/temas.js";
import { CAT } from "./gacha-categorias.js";
import { statsEfectivas, NIVEL_MAX, TIENE_NIVELES } from "./gacha-niveles.js";
import { tipoEs } from "./gacha-pokemon.js";

export const LIMITE_CAPTION = 1000;

// El dinero se ve como calabazas en Halloween (el valor guardado es el mismo).
const monto = (n) => `${fmt(n)} ${moneda()}`;

const ESTILOS = {
  normal: {
    tituloCuriosidades: "CURIOSIDADES",
    tituloEstadisticas: "ESTADÍSTICAS",
    descEstadisticas: (cat) => `Estadísticas ${cat.de} ${cat.singular} según su nivel y su rareza.`,
    salud: "❤️ *Salud*",
    dano: "⚔️ *Daño*",
    defensa: "🛡️ *Defensa*",
    velocidad: "💨 *Velocidad*",
    tituloValor: "VALOR TOTAL",
    valor: "💴 *Valor*"
  },
  halloween: {
    tituloCuriosidades: "SECRETOS OCULTOS",
    tituloEstadisticas: "ESTADÍSTICAS MACABRAS",
    descEstadisticas: (cat) => `Estadísticas ${cat.de} ${cat.singular} según su nivel y su rareza, bajo la luz de la luna.`,
    salud: "🩸 *Salud*",
    dano: "🗡️ *Daño*",
    defensa: "🛡️ *Defensa*",
    velocidad: "🦇 *Velocidad*",
    tituloValor: "TESORO TOTAL",
    valor: "🪙 *Valor*"
  }
};

export function fuenteDe(p) {
  if (p.categoria === "waifu") return p.serie || "Desconocida";
  if (p.categoria === "pokemon") return "Pokémon";
  if (p.categoria === "brawler") return "Brawl Stars";
  if (p.categoria === "cod") return "Call of Duty";
  if (p.categoria === "dragon") return "Dragon Mania Legends";
  if (p.categoria === "clash") return "Clash Royale";
  return "Snake";
}

export const textoStats = (s) => `❤️ ${s.hp}  ⚔️ ${s.atk}  🛡️ ${s.def}  💨 ${s.spe}`;

const dos = (n) => String(n).padStart(2, "0");

export function bloqueCabecera(categoria, titulo, lineas = []) {
  const cat = CAT[categoria];
  const partes = [encabezado(cat.emoji, titulo || cat.titulo)];
  if (lineas.length) partes.push("", ...lineas.map((l) => (l.startsWith(">") ? l : `> ${l}`)));
  return partes.join("\n");
}

export function bloqueCuriosidades(p) {
  const lineas = [
    encabezado("🔍", estilo(ESTILOS).tituloCuriosidades),
    "",
    `❖ *ID* ›› #${p.id}`,
    `❀ *Nombre* ›› ${p.nombre}`,
    `✧ *Fuente* ›› ${fuenteDe(p)}`
  ];
  if (p.categoria === "waifu" && p.genero) lineas.push(`⚥ *Género* ›› ${p.genero}`);
  if (p.categoria === "pokemon" && p.stats?.tipos?.length) lineas.push(`✿ *Tipo* ›› ${p.stats.tipos.map(tipoEs).join(" / ")}`);
  if (p.categoria === "brawler" && String(p.serie || "").includes("·")) lineas.push(`✪ *Clase* ›› ${p.serie.split("·")[1].trim()}`);
  if (["cod", "dragon", "clash"].includes(p.categoria) && p.meta?.tipo) lineas.push(`✿ *Tipo* ›› ${p.meta.tipo}`);
  if (p.categoria === "clash" && p.meta?.elixir != null) lineas.push(`◈ *Elixir* ›› ${p.meta.elixir}`);
  lineas.push(`✦ *Rareza* ›› ${p.rareza}`);
  lineas.push(`☆ *Valor* ›› ${monto(p.valor)}`);
  return lineas.join("\n");
}

export function bloqueEstadisticas(p, nivel = 1) {
  if (!TIENE_NIVELES(p.categoria)) return "";
  const s = statsEfectivas(p, nivel);
  const E = estilo(ESTILOS);
  const calidad = s.hp + s.atk + s.def + s.spe;
  return [
    encabezado("🛡️", E.tituloEstadisticas),
    "",
    `> Estadísticas de *${p.nombre}* *(${p.rareza})*`,
    "",
    `✚ *Nivel* ›› ${nivel}/${NIVEL_MAX[p.categoria]}`,
    `♡ *Salud* ›› ${s.hp}`,
    `✠ *Daño* ›› ${s.atk}`,
    `◈ *Defensa* ›› ${s.def}`,
    `➳ *Velocidad* ›› ${s.spe}`,
    `❂ *Calidad* ›› ${fmt(calidad)}`
  ].join("\n");
}

export function bloqueValor(p) {
  const E = estilo(ESTILOS);
  return [encabezado("💎", E.tituloValor), "", `${E.valor} ›› ${monto(p.valor)}`].join("\n");
}

export function bloquesDePersonaje(p, nivel = 1) {
  return [bloqueCuriosidades(p), bloqueEstadisticas(p, nivel)].filter(Boolean);
}

export function repartirBloques(bloques, limite = LIMITE_CAPTION) {
  const principal = [];
  const resto = [];
  let largo = 0;
  for (const bloque of bloques) {
    const nuevo = largo + bloque.length + (principal.length ? 2 : 0);
    if (!resto.length && nuevo <= limite) {
      principal.push(bloque);
      largo = nuevo;
    } else {
      resto.push(bloque);
    }
  }
  return { principal: principal.join("\n\n"), resto: resto.join("\n\n") };
}

export function lineasPersonaje(p, nivel = null) {
  const lineas = [`🆔 *ID* ›› #${p.id}`, `✍🏻 *Nombre* ›› ${p.nombre}`, `🌐 *Fuente* ›› ${fuenteDe(p)}`, `✨ *Rareza* ›› ${p.rareza}`];
  if (TIENE_NIVELES(p.categoria)) {
    const n = nivel ?? 1;
    lineas.push(`📊 *Nivel* ›› ${n}/${NIVEL_MAX[p.categoria]}`, textoStats(statsEfectivas(p, n)));
  }
  lineas.push(`${estilo(ESTILOS).valor} ›› ${monto(p.valor)}`);
  return lineas;
}

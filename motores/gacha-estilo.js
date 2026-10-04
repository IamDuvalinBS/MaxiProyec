import { encabezado } from "../src/economia/estilo.js";
import { monto } from "../src/economia/formato.js";
import { CAT } from "./gacha-categorias.js";
import { statsEfectivas, NIVEL_MAX, TIENE_NIVELES } from "./gacha-niveles.js";
import { tipoEs } from "./gacha-pokemon.js";

export const LIMITE_CAPTION = 1000;

export function fuenteDe(p) {
  if (p.categoria === "waifu") return p.serie || "Desconocida";
  if (p.categoria === "pokemon") return "Pokémon";
  if (p.categoria === "brawler") return "Brawl Stars";
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
    encabezado("🔍", "CURIOSIDADES"),
    "",
    `🆔 *ID* :: #${p.id}`,
    `✍🏻 *Nombre* ›› ${p.nombre}`,
    `🌐 *Fuente* ›› ${fuenteDe(p)}`
  ];
  if (p.categoria === "waifu" && p.genero) lineas.push(`⚥ *Género* ›› ${p.genero}`);
  if (p.categoria === "pokemon" && p.stats?.tipos?.length) lineas.push(`🌲 *Tipo* ›› ${p.stats.tipos.map(tipoEs).join(" / ")}`);
  if (p.categoria === "brawler" && String(p.serie || "").includes("·")) lineas.push(`🎯 *Clase* ›› ${p.serie.split("·")[1].trim()}`);
  lineas.push(`✨ *Rareza* ›› ${p.rareza}`);
  return lineas.join("\n");
}

export function bloqueEstadisticas(p, nivel = 1) {
  if (!TIENE_NIVELES(p.categoria)) return "";
  const cat = CAT[p.categoria];
  const s = statsEfectivas(p, nivel);
  return [
    encabezado("🛡️", "ESTADÍSTICAS"),
    "",
    `> Estadísticas ${cat.de} ${cat.singular} según su nivel y su rareza.`,
    "",
    `📊 *Nivel* ›› ${nivel}/${NIVEL_MAX[p.categoria]}`,
    "",
    `❤️ *Salud* ›› ${dos(s.hp)}`,
    "> La vida de tu personaje.",
    `⚔️ *Daño* ›› ${dos(s.atk)}`,
    "> El daño que inflige al atacar.",
    `🛡️ *Defensa* ›› ${dos(s.def)}`,
    "> Reduce el daño que recibe del rival.",
    `💨 *Velocidad* ›› ${dos(s.spe)}`,
    "> Define quién ataca primero en un combate PVP: ataca primero quien tenga la velocidad más alta."
  ].join("\n");
}

export function bloqueValor(p) {
  return [encabezado("💎", "VALOR TOTAL"), "", `💴 *Valor* ›› ${monto(p.valor)}`].join("\n");
}

export function bloquesDePersonaje(p, nivel = 1) {
  return [bloqueCuriosidades(p), bloqueEstadisticas(p, nivel), bloqueValor(p)].filter(Boolean);
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
  lineas.push(`💴 *Valor* ›› ${monto(p.valor)}`);
  return lineas;
}

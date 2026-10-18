// Versión "con eventos" de formato.js, SOLO para los comandos de economía
// (economía, trabajos, apuestas, negocios y sus owner). Todo lo demás del bot
// (gacha, grupos, descargas, perfil...) sigue usando formato.js sin cambios.
import { formatTime } from "../../motores/ui.js";
import { fmt } from "./formato.js";
import { esHalloween, moneda, bandaSuperior, bandaInferior } from "./temas.js";

// Todo lo que no cambia con el evento se reexporta tal cual.
export * from "./formato.js";

export function monto(n) {
  return `${fmt(n)} ${moneda()}`;
}

export function montoConSigno(n) {
  return `${n < 0 ? "-" : "+"}${monto(Math.abs(n))}`;
}

export function tarjeta({ emoji, titulo, subtitulo, relato, lineas = [], tip }) {
  const partes = [];
  const arriba = bandaSuperior();
  if (arriba) partes.push(arriba);
  partes.push(`⧼${emoji}⧽ \`\`\`##\`\`\` *${titulo}*`);
  if (subtitulo) partes.push(`     ➥ ${subtitulo}`);
  partes.push("");
  if (relato) partes.push(`> ${relato}`, "");
  partes.push(...lineas);
  if (tip) partes.push("", ...[].concat(tip).map((linea) => `> ${linea}`));
  const abajo = bandaInferior();
  if (abajo) partes.push("", abajo);
  return partes.join("\n").trimEnd();
}

export function textoEspera(ms) {
  if (esHalloween()) return `⏳ 🕸️ Los espíritus aún están descansando. Vuelve en *${formatTime(ms)}*. 🦇`;
  return `⏳ Este comando se encuentra en espera. Tiempo restante: *${formatTime(ms)}*.`;
}

export function avisoNivel(nivel) {
  if (esHalloween()) return `🎃 *¡NUEVO NIVEL!* Tu alma embrujada alcanzó el nivel *${nivel}*. 🦇`;
  return `🎉 *¡NUEVO NIVEL!* Se alcanzó el nivel *${nivel}*.`;
}

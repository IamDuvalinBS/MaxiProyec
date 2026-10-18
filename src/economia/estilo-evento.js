// Versión "con eventos" de estilo.js, SOLO para los comandos de economía.
// Grupos, gacha, descargas y perfil siguen usando estilo.js sin cambios.
import { bandaSuperior, bandaInferior } from "./temas.js";

export * from "./estilo.js";

export function encabezado(emoji, titulo) {
  const arriba = bandaSuperior();
  const linea = `⧼${emoji}⧽ \`\`\`##\`\`\` *${titulo}*`;
  return arriba ? `${arriba}\n${linea}` : linea;
}

export function tarjetaMarcada({ emoji, titulo, relato, lineas = [], tip }) {
  const partes = [encabezado(emoji, titulo), ""];
  if (relato) partes.push(`> ${relato}`, "");
  partes.push(...lineas);
  if (tip) partes.push("", ...[].concat(tip).map((linea) => `> ${linea}`));
  const abajo = bandaInferior();
  if (abajo) partes.push("", abajo);
  return partes.join("\n").trimEnd();
}

import { fmt } from "./formato.js";

export function encabezado(emoji, titulo) {
  return `⧼${emoji}⧽ \`\`\`##\`\`\` *${titulo}*`;
}

export function numeroDe(jid) {
  return String(jid || "").split("@")[0].split(":")[0];
}

export function mencion(jid) {
  return `@${numeroDe(jid)}`;
}

export function tarjetaMarcada({ emoji, titulo, relato, lineas = [], tip }) {
  const partes = [encabezado(emoji, titulo), ""];
  if (relato) partes.push(`> ${relato}`, "");
  partes.push(...lineas);
  if (tip) partes.push("", ...[].concat(tip).map((linea) => `> ${linea}`));
  return partes.join("\n").trimEnd();
}

export function tiempoLargo(ms) {
  const totalMinutos = Math.max(0, Math.ceil(ms / 60000));
  const dias = Math.floor(totalMinutos / 1440);
  const horas = Math.floor((totalMinutos % 1440) / 60);
  const minutos = totalMinutos % 60;
  const partes = [];
  if (dias) partes.push(`${dias}d`);
  if (horas) partes.push(`${horas}h`);
  if (minutos || !partes.length) partes.push(`${minutos}m`);
  return partes.join(" ");
}

export { fmt };

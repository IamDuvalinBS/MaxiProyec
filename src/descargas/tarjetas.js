import { encabezado, mencion } from "../economia/estilo.js";

export function campo(emoji, etiqueta, valor) {
  return `${emoji} *${etiqueta}::*\n> ${valor}`;
}

export function tarjetaDescarga({ emoji, titulo, sender, campos = [], nota }) {
  const partes = [encabezado(emoji, titulo), "", `> Petición solicitada por ${mencion(sender)}.`];
  if (campos.length) partes.push("", ...campos);
  if (nota) partes.push("", `> ${nota}`);
  return partes.join("\n");
}

export function tarjetaFormato() {
  return [
    encabezado("⚙️", "SELECCIÓN DE FORMATO"),
    "",
    "*Audio::* 1",
    "*Video::* 2",
    "",
    "> Elige el formato del archivo que deseas."
  ].join("\n");
}

export function tarjetaUso({ comando, ejemplo, nota }) {
  const partes = [
    encabezado("📌", "MODO DE USO"),
    "",
    campo("⌨️", "Comando", comando),
    campo("💡", "Ejemplo", ejemplo)
  ];
  if (nota) partes.push("", `> ${nota}`);
  return partes.join("\n");
}

export function tarjetaError(motivo, detalle) {
  const partes = [encabezado("❌", "ERROR DE DESCARGA"), "", `> ${motivo}`];
  if (detalle) partes.push("", campo("💭", "Motivo", detalle));
  return partes.join("\n");
}

export function tarjetaAviso(titulo, mensaje) {
  return [encabezado("⚠️", titulo), "", `> ${mensaje}`].join("\n");
}

export function duracionLarga(segundos) {
  const total = Math.max(0, Math.round(Number(segundos) || 0));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const restantes = total % 60;
  const partes = [];
  if (horas) partes.push(`${horas} ${horas === 1 ? "hora" : "horas"}`);
  if (minutos || horas) partes.push(`${minutos} ${minutos === 1 ? "minuto" : "minutos"}`);
  if (!horas) partes.push(`${restantes} ${restantes === 1 ? "segundo" : "segundos"}`);
  return partes.join(" ");
}

export function fechaCorta(valor) {
  if (!valor) return "No disponible";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return `${fecha.getUTCDate()}/${fecha.getUTCMonth() + 1}/${fecha.getUTCFullYear()}`;
}

export function etiquetasComoHashtags(etiquetas) {
  if (!Array.isArray(etiquetas) || !etiquetas.length) return "Sin hashtags";
  return etiquetas
    .slice(0, 5)
    .map((e) => `#${String(e).trim().replace(/\s+/g, "")}`)
    .join(" ");
}

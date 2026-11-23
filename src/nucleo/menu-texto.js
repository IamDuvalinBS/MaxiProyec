// Textos cortos para los menús: el menú solo muestra una explicación breve, no ejemplos ni todos los alias.
// Sin imports a propósito (lo usan los dos menús).

const MAX_ALIAS = 3;      // alias que se muestran junto al comando
const MAX_ARGS = 32;      // largo máximo de los argumentos mostrados (<cantidad> [@usuario]...)
const MAX_DESC = 70;      // largo máximo de la descripción

// Corta en el último espacio antes de `max` (sin dejar palabras partidas ni signos colgando).
function cortarEn(texto, max) {
  if (texto.length <= max) return texto;
  const hasta = texto.slice(0, max + 1);
  const espacio = hasta.lastIndexOf(" ");
  const corte = (espacio > 20 ? hasta.slice(0, espacio) : texto.slice(0, max)).replace(/[\s,;:.\-–—(]+$/, "");
  return corte.replace(/(?:\s+(?:a|al|de|del|el|la|los|las|en|con|y|o|e|un|una|para|por|que|se|tu|tus|su|sus|mi|mis))+$/i, "");
}

// Quita palabras del final hasta que los corchetes [ ] y < > queden cerrados.
function balancear(args) {
  const faltan = (t) => (t.match(/\[/g) || []).length !== (t.match(/\]/g) || []).length || (t.match(/</g) || []).length !== (t.match(/>/g) || []).length;
  let partes = args.split(" ");
  while (partes.length && faltan(partes.join(" "))) partes.pop();
  return partes.join(" ").trim();
}

// ".cmd <a> | .cmd2 <b>"  →  "<a>"   (solo la primera forma de uso, sin paréntesis explicativos)
export function argumentosDe(info) {
  const principal = info.names[0];
  const usage = info.usage || principal;
  if (!usage.startsWith(principal)) return "";
  let args = usage.slice(principal.length).trim();
  if (args.startsWith("|")) return "";
  args = args.replace(/\s*\([^)]*\)/g, "").split(/\s+\|\s+/)[0].trim();
  if (args.length > MAX_ARGS) args = cortarEn(args, MAX_ARGS);
  return balancear(args);
}

export function etiquetaDe(info) {
  const nombres = info.names.slice(0, MAX_ALIAS).join(" / ");
  const args = argumentosDe(info);
  return args ? `${nombres} ${args}` : nombres;
}

// Deja la descripción en una frase corta: quita ejemplos (": .comando <args>", "(ej: ...)") y recorta lo que sobre.
export function resumirDesc(desc) {
  let d = String(desc || "").replace(/\s+/g, " ").trim();
  const nota = (d.match(/\((?:solo|owners?|admins?)[^)]*\)/i) || [""])[0];   // "(solo owners)" sí se conserva
  d = d
    .replace(/\s*\((?:ej|ejemplo|p\. ?ej)[^)]*\)/gi, "")
    .replace(/\s*[:.]?\s*ej(?:emplos?)?\s*[:.].*$/i, "")
    .replace(/\s*:\s*\*?[.!#/][\p{L}\p{N}_]+.*$/u, "")      // ": .comando <args> ..."
    .replace(/\s*\([^)]*\)\s*$/g, "");                         // paréntesis final
  if (d.length > MAX_DESC) {
    const corte = [...d.matchAll(/[.;,:]\s|\s\(|\s[—–-]\s/g)].map((m) => m.index).filter((i) => i >= 25 && i <= MAX_DESC)[0];
    d = corte ? d.slice(0, corte) : cortarEn(d, MAX_DESC);
  }
  d = d.replace(/[\s,;:.\-–—]+$/, "");
  return nota && !d.includes(nota) ? `${d} ${nota}` : d;
}

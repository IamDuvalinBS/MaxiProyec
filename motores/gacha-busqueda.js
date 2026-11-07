import { filasPersonajes } from "./gacha-db.js";

const sinAcentos = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const palabras = (s) => sinAcentos(s).replace(/_\([^)]*\)/g, " ").split(/[^a-z0-9]+/).filter(Boolean);

function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const guardado = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = guardado;
    }
  }
  return fila[b.length];
}

function puntajeDe(consulta, nombre) {
  const q = palabras(consulta);
  const n = palabras(nombre);
  if (!q.length || !n.length) return Infinity;

  const qTexto = q.join("");
  const nTexto = n.join("");
  if (qTexto === nTexto) return 0;
  if ([...q].sort().join("") === [...n].sort().join("")) return 0.5;

  const cubre = (palabra) => n.some((x) => x === palabra || (palabra.length >= 3 && x.startsWith(palabra)));
  if (q.every(cubre)) return 1 + Math.max(0, n.length - q.length) * 0.01;
  if (qTexto.length >= 3 && nTexto.includes(qTexto)) return 1.5;

  const aproxima = (palabra) => {
    const tolerancia = Math.floor(palabra.length / 4);
    if (!tolerancia) return false;
    return n.some((x) => Math.abs(x.length - palabra.length) <= tolerancia && distancia(x, palabra) <= tolerancia);
  };
  if (q.every((p) => cubre(p) || aproxima(p))) return 2;
  return Infinity;
}

export function buscarWaifus(consulta, limite = 5) {
  const encontrados = [];
  for (const p of filasPersonajes("waifu")) {
    const s = Math.min(puntajeDe(consulta, p.nombre), puntajeDe(consulta, p.clave));
    if (s !== Infinity) encontrados.push({ p, s });
  }
  encontrados.sort((a, b) => a.s - b.s || (b.p.meta?.votos || 0) - (a.p.meta?.votos || 0) || b.p.valor - a.p.valor || a.p.id - b.p.id);
  return encontrados.slice(0, limite);
}

export function galeriaDe(p) {
  return [...new Set([p.img, ...(p.meta?.galeria || []), ...(p.meta?.alt || [])].filter(Boolean))];
}

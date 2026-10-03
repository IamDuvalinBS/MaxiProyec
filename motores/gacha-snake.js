import fs from "fs";
import { crearPersonaje, contarPersonajes, enTransaccion } from "./gacha-db.js";
import { Lienzo } from "./gacha-png.js";

const CURADAS = [
  { clave: "verde-clasico",  nombre: "Verde Clásico",  rareza: "Común", patron: "liso", pal: ["#3ddc84", "#1fa85a"] },
  { clave: "rojo-fuego",     nombre: "Rojo Fuego",     rareza: "Común", patron: "liso", pal: ["#ff4d4d", "#c92a2a"] },
  { clave: "azul-oceano",    nombre: "Azul Océano",    rareza: "Común", patron: "liso", pal: ["#4dabf7", "#1c7ed6"] },
  { clave: "amarillo-sol",   nombre: "Amarillo Sol",   rareza: "Común", patron: "liso", pal: ["#ffd43b", "#f59f00"] },
  { clave: "naranja-citrico",nombre: "Naranja Cítrico",rareza: "Común", patron: "liso", pal: ["#ff922b", "#e8590c"] },
  { clave: "rosa-chicle",    nombre: "Rosa Chicle",    rareza: "Común", patron: "liso", pal: ["#f783ac", "#d6336c"] },
  { clave: "morado-uva",     nombre: "Morado Uva",     rareza: "Común", patron: "liso", pal: ["#9775fa", "#6741d9"] },
  { clave: "gris-roca",      nombre: "Gris Roca",      rareza: "Común", patron: "liso", pal: ["#adb5bd", "#6c757d"] },
  { clave: "cebra",          nombre: "Cebra",          rareza: "Poco común", patron: "rayas",  pal: ["#f8f9fa", "#212529"] },
  { clave: "abeja",          nombre: "Abeja",          rareza: "Poco común", patron: "rayas",  pal: ["#ffd43b", "#212529"] },
  { clave: "caramelo",       nombre: "Caramelo",       rareza: "Poco común", patron: "rayas",  pal: ["#ff6b6b", "#ffffff"] },
  { clave: "sandia",         nombre: "Sandía",         rareza: "Poco común", patron: "rayas",  pal: ["#51cf66", "#2b8a3e"] },
  { clave: "dalmata",        nombre: "Dálmata",        rareza: "Poco común", patron: "puntos", pal: ["#f8f9fa", "#212529"] },
  { clave: "leopardo",       nombre: "Leopardo",       rareza: "Poco común", patron: "puntos", pal: ["#ffa94d", "#5c3d1e"] },
  { clave: "menta",          nombre: "Menta",          rareza: "Poco común", patron: "bicolor",pal: ["#63e6be", "#20c997"] },
  { clave: "coral",          nombre: "Coral",          rareza: "Poco común", patron: "bicolor",pal: ["#ff8787", "#ffd8a8"] },
  { clave: "atardecer",      nombre: "Atardecer",      rareza: "Rara", patron: "degradado", pal: ["#ffa94d", "#f06595", "#7048e8"] },
  { clave: "oceano-profundo",nombre: "Océano Profundo",rareza: "Rara", patron: "degradado", pal: ["#66d9e8", "#1c7ed6", "#0b2545"] },
  { clave: "aurora",         nombre: "Aurora",         rareza: "Rara", patron: "degradado", pal: ["#69db7c", "#22b8cf", "#9775fa"] },
  { clave: "lava",           nombre: "Lava",           rareza: "Rara", patron: "degradado", pal: ["#fa5252", "#ff922b", "#ffe066"] },
  { clave: "hielo",          nombre: "Hielo",          rareza: "Rara", patron: "degradado", pal: ["#ffffff", "#a5d8ff", "#4dabf7"] },
  { clave: "bosque-encantado",nombre: "Bosque Encantado",rareza: "Rara", patron: "degradado", pal: ["#d8f5a2", "#51cf66", "#0b5d1e"] },
  { clave: "cereza",         nombre: "Cereza",         rareza: "Rara", patron: "degradado", pal: ["#ffc9c9", "#fa5252", "#7a0c0c"] },
  { clave: "arcoiris",       nombre: "Arcoíris",       rareza: "Épica", patron: "arcoiris",  pal: ["#ff4d4d"] },
  { clave: "galaxia",        nombre: "Galaxia",        rareza: "Épica", patron: "degradado", pal: ["#845ef7", "#3b5bdb", "#0b1b4d"], accesorio: "halo" },
  { clave: "neon",           nombre: "Neón",           rareza: "Épica", patron: "rayas",     pal: ["#22e6ff", "#ff2bd6"] },
  { clave: "oro-puro",       nombre: "Oro Puro",       rareza: "Épica", patron: "degradado", pal: ["#fff3bf", "#fcc419", "#e67700"] },
  { clave: "diablillo",      nombre: "Diablillo",      rareza: "Épica", patron: "rayas",     pal: ["#e03131", "#1a1a1a"], accesorio: "cuernos" },
  { clave: "dragon-esmeralda",nombre: "Dragón Esmeralda",rareza: "Legendaria", patron: "degradado", pal: ["#b2f2bb", "#12b886", "#0b6e4f"], accesorio: "cuernos" },
  { clave: "rey-neon",       nombre: "Rey Neón",       rareza: "Legendaria", patron: "arcoiris",  pal: ["#ff4d4d"], accesorio: "corona" },
  { clave: "fantasma-cosmico",nombre: "Fantasma Cósmico",rareza: "Legendaria", patron: "degradado", pal: ["#ffffff", "#b197fc", "#5f3dc4"], accesorio: "halo" },
  { clave: "fenix",          nombre: "Fénix",          rareza: "Legendaria", patron: "degradado", pal: ["#ffec99", "#ff922b", "#e03131"], accesorio: "corona" }
];

const COLORES = [
  ["rojo", "Rojo", "#ff6b6b", "#c92a2a"], ["naranja", "Naranja", "#ffa94d", "#e8590c"],
  ["amarillo", "Amarillo", "#ffe066", "#f08c00"], ["lima", "Lima", "#c0eb75", "#66a80f"],
  ["verde", "Verde", "#69db7c", "#2b8a3e"], ["turquesa", "Turquesa", "#63e6be", "#087f5b"],
  ["celeste", "Celeste", "#74c0fc", "#1971c2"], ["azul", "Azul", "#4c6ef5", "#1b2a8a"],
  ["indigo", "Índigo", "#7950f2", "#3b1a99"], ["violeta", "Violeta", "#da77f2", "#862e9c"],
  ["magenta", "Magenta", "#f06595", "#a61e4d"], ["rosa", "Rosa", "#faa2c1", "#c2255c"],
  ["coral", "Coral", "#ff8787", "#e03131"], ["marron", "Marrón", "#c69c6d", "#5c3d1e"],
  ["gris", "Gris", "#ced4da", "#495057"], ["negro", "Negro", "#495057", "#141517"]
];
const PATRONES = { liso: "Sólido", rayas: "Rayado", puntos: "Moteado", bicolor: "Dúo", degradado: "Degradé" };
const ACCESORIOS = { ninguno: "", antenas: "Antenas", gafas: "Gafas", cuernos: "Cuernos", halo: "Halo", corona: "Corona" };
const PUNTOS_PATRON = { liso: 0, rayas: 1, puntos: 1, bicolor: 1, degradado: 2, arcoiris: 3 };
const PUNTOS_ACC = { ninguno: 0, antenas: 1, gafas: 1, cuernos: 2, halo: 2, corona: 3 };
const FORMAS = ["onda", "serpentina", "arco"];
const LISOS_CURADOS = new Set(["verde", "rojo", "azul", "amarillo", "naranja", "rosa", "violeta", "gris"]);

function rarezaPorPuntos(n) {
  return n <= 1 ? "Común" : n === 2 ? "Poco común" : n === 3 ? "Rara" : n === 4 ? "Épica" : "Legendaria";
}

function hash(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function generar() {
  const lista = [];
  const agregar = (clave, nombre, patron, pal, acc) => lista.push({
    clave, nombre, patron, pal, accesorio: acc, forma: FORMAS[hash(clave) % 3],
    rareza: rarezaPorPuntos(PUNTOS_PATRON[patron] + PUNTOS_ACC[acc])
  });
  COLORES.forEach(([id, nom, claro, oscuro], i) => {
    const [, , claro2, oscuro2] = COLORES[(i + 8) % COLORES.length];
    for (const acc of Object.keys(ACCESORIOS)) {
      const sufijo = ACCESORIOS[acc] ? ` con ${ACCESORIOS[acc]}` : "";
      if (!LISOS_CURADOS.has(id)) agregar(`gen-liso-${id}-${acc}`, `Sólido ${nom}${sufijo}`, "liso", [claro, oscuro], acc);
      agregar(`gen-rayas-${id}-${acc}`, `Rayado ${nom}${sufijo}`, "rayas", [claro, oscuro2], acc);
      agregar(`gen-puntos-${id}-${acc}`, `Moteado ${nom}${sufijo}`, "puntos", [claro, claro2], acc);
      agregar(`gen-bicolor-${id}-${acc}`, `Dúo ${nom}${sufijo}`, "bicolor", [claro, claro2], acc);
      agregar(`gen-degrade-${id}-${acc}`, `Degradé ${nom}${sufijo}`, "degradado", [claro, claro2, oscuro2], acc);
    }
  });
  for (const acc of Object.keys(ACCESORIOS)) {
    const sufijo = ACCESORIOS[acc] ? ` con ${ACCESORIOS[acc]}` : "";
    agregar(`gen-prisma-${acc}`, `Prisma${sufijo}`, "arcoiris", ["#ff4d4d"], acc);
  }
  return lista;
}

export const SKINS = [...CURADAS.map((s) => ({ accesorio: "ninguno", forma: "onda", ...s })), ...generar()];
const POR_CLAVE = new Map(SKINS.map((s) => [s.clave, s]));

const BASE_RAREZA = { "Común": 55, "Poco común": 65, "Rara": 78, "Épica": 92, "Legendaria": 110 };
const BONO_VALOR = { "Común": 500, "Poco común": 1500, "Rara": 3500, "Épica": 8000, "Legendaria": 18000 };

export const PESOS_SNAKE = { "Común": 50, "Poco común": 27, "Rara": 14, "Épica": 6, "Legendaria": 2 };

function estadisticas(sk) {
  const b = BASE_RAREZA[sk.rareza];
  const v = (n) => hash(sk.clave + n) % 15;
  return { hp: b + v("a"), atk: b + v("b"), def: b + v("c"), spe: b + v("d"), tipos: [] };
}

export async function asegurarSnakes() {
  if (contarPersonajes("snake") >= SKINS.length) return;
  enTransaccion(() => {
    for (const sk of SKINS) {
      const st = estadisticas(sk);
      crearPersonaje({
        categoria: "snake", clave: sk.clave, nombre: sk.nombre, serie: "Snake", genero: "",
        rareza: sk.rareza,
        valor: (st.hp + st.atk + st.def + st.spe) * 8 + BONO_VALOR[sk.rareza],
        img: `snake:${sk.clave}`, stats: st,
        meta: { patron: sk.patron, accesorio: sk.accesorio }
      });
    }
  });
}

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mezcla = (a, b, t) => a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return [f(0), f(8), f(4)];
}
function prng(semilla) {
  let s = semilla || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function colorSegmento(sk, pal, i, t) {
  switch (sk.patron) {
    case "rayas":     return pal[Math.floor(i / 2) % 2];
    case "bicolor":   return pal[Math.floor(i / 3) % 2];
    case "puntos":    return pal[0];
    case "arcoiris":  return hsl(Math.round(t * 300), 90, 58);
    case "degradado": {
      const x = Math.min(0.9999, t) * (pal.length - 1), k = Math.floor(x);
      return mezcla(pal[k], pal[k + 1], x - k);
    }
    default:          return pal[i % 2];
  }
}

function trazado(forma, N) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = 110 + t * 580;
    const y = forma === "serpentina" ? 420 + Math.sin(t * Math.PI * 3.6 + 0.3) * 125
      : forma === "arco" ? 590 - Math.sin(t * Math.PI) * 340 + t * 20
      : 420 + Math.sin(t * Math.PI * 2.2 + 0.5) * 165;
    pts.push({ x, y, r: 20 + 24 * Math.pow(t, 0.8), t });
  }
  return pts;
}

export function dibujarSkin(sk) {
  const W = 800, H = 800, N = sk.forma === "serpentina" ? 30 : 26;
  const L = new Lienzo(W, H);
  const pal = sk.pal.map(rgb);
  const NEGRO = [17, 17, 17];
  L.fondoRadial([43, 36, 80], [10, 9, 22]);

  const rnd = prng(hash(sk.clave));
  for (let k = 0; k < 34; k++) {
    const x = rnd() * W, y = rnd() * H, r = 3 + Math.round(rnd() * 9);
    const col = sk.patron === "arcoiris" ? hsl(Math.round(rnd() * 360), 95, 65) : pal[k % pal.length];
    L.circulo(x, y, r * 2.4, col, 0.10);
    L.circulo(x, y, r, col, 0.75);
  }

  const pts = trazado(sk.forma, N);
  pts.forEach((p, i) => {
    L.circulo(p.x, p.y, p.r, colorSegmento(sk, pal, i, p.t));
    L.anillo(p.x, p.y, p.r, 3, [0, 0, 0], 0.35);
    if (sk.patron === "puntos" && i % 2 === 1 && i < N - 1) L.circulo(p.x + 4, p.y + 2, p.r * 0.38, pal[1]);
    L.circulo(p.x - p.r * 0.3, p.y - p.r * 0.35, p.r * 0.32, [255, 255, 255], 0.22);
  });

  const h = pts[N - 1], q = pts[N - 2];
  let dx = h.x - q.x, dy = h.y - q.y;
  const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
  const ojos = [-1, 1].map((lado) => [h.x + dx * 16 - dy * lado * 19, h.y + dy * 16 + dx * lado * 19]);
  for (const [ex, ey] of ojos) {
    L.circulo(ex, ey, 14, NEGRO);
    L.circulo(ex, ey, 12, [255, 255, 255]);
    L.circulo(ex + dx * 5, ey + dy * 5, 6.5, NEGRO);
  }
  const acc = sk.accesorio;
  if (acc === "gafas") {
    for (const [ex, ey] of ojos) L.anillo(ex, ey, 19, 5, [25, 25, 25]);
    L.linea(ojos[0][0], ojos[0][1], ojos[1][0], ojos[1][1], 5, [25, 25, 25]);
  } else if (acc === "antenas") {
    for (const s of [-1, 1]) {
      L.linea(h.x + s * 14, h.y - 38, h.x + s * 34, h.y - 92, 5, [30, 30, 30]);
      L.circulo(h.x + s * 34, h.y - 96, 9, pal[0]);
      L.anillo(h.x + s * 34, h.y - 96, 9, 3, [30, 30, 30]);
    }
  } else if (acc === "cuernos") {
    L.poligono([[h.x - 34, h.y - 30], [h.x - 20, h.y - 78], [h.x - 6, h.y - 38]], [241, 243, 245], 1, NEGRO);
    L.poligono([[h.x + 6, h.y - 38], [h.x + 20, h.y - 78], [h.x + 34, h.y - 30]], [241, 243, 245], 1, NEGRO);
  } else if (acc === "corona") {
    L.poligono([[h.x - 36, h.y - 34], [h.x - 36, h.y - 80], [h.x - 18, h.y - 58], [h.x, h.y - 88],
      [h.x + 18, h.y - 58], [h.x + 36, h.y - 80], [h.x + 36, h.y - 34]], [252, 196, 25], 1, [122, 74, 0]);
    L.circulo(h.x, h.y - 50, 6, [224, 49, 49]);
  } else if (acc === "halo") {
    L.elipseAnillo(h.x, h.y - 62, 38, 11, 7, [255, 224, 102]);
  }
  return L;
}

export async function renderSnake(clave, ruta) {
  const sk = POR_CLAVE.get(clave);
  if (!sk) throw new Error("skin desconocida: " + clave);
  await fs.promises.writeFile(ruta, dibujarSkin(sk).png());
}

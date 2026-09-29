// motores/gacha-snake.js
//
// Minijuego "Snake": colección de gusanitos (skins) estilo snake.io. NO hay imágenes que descargar:
// cada skin se dibuja como SVG y se convierte a PNG con sharp (que ya está en tu package.json) en un
// archivo temporal justo al enviarla. En la base solo queda una referencia "snake:<clave>".
import { crearPersonaje, contarPersonajes } from "./gacha-db.js";

// patrón: liso | rayas | puntos | bicolor | degradado | arcoiris
// accesorio: ninguno | cuernos | corona | halo
export const SKINS = [
  // ---- Común ----
  { clave: "verde-clasico",  nombre: "Verde Clásico",  rareza: "Común", patron: "liso", pal: ["#3ddc84", "#1fa85a"] },
  { clave: "rojo-fuego",     nombre: "Rojo Fuego",     rareza: "Común", patron: "liso", pal: ["#ff4d4d", "#c92a2a"] },
  { clave: "azul-oceano",    nombre: "Azul Océano",    rareza: "Común", patron: "liso", pal: ["#4dabf7", "#1c7ed6"] },
  { clave: "amarillo-sol",   nombre: "Amarillo Sol",   rareza: "Común", patron: "liso", pal: ["#ffd43b", "#f59f00"] },
  { clave: "naranja-citrico",nombre: "Naranja Cítrico",rareza: "Común", patron: "liso", pal: ["#ff922b", "#e8590c"] },
  { clave: "rosa-chicle",    nombre: "Rosa Chicle",    rareza: "Común", patron: "liso", pal: ["#f783ac", "#d6336c"] },
  { clave: "morado-uva",     nombre: "Morado Uva",     rareza: "Común", patron: "liso", pal: ["#9775fa", "#6741d9"] },
  { clave: "gris-roca",      nombre: "Gris Roca",      rareza: "Común", patron: "liso", pal: ["#adb5bd", "#6c757d"] },
  // ---- Poco común ----
  { clave: "cebra",          nombre: "Cebra",          rareza: "Poco común", patron: "rayas",  pal: ["#f8f9fa", "#212529"] },
  { clave: "abeja",          nombre: "Abeja",          rareza: "Poco común", patron: "rayas",  pal: ["#ffd43b", "#212529"] },
  { clave: "caramelo",       nombre: "Caramelo",       rareza: "Poco común", patron: "rayas",  pal: ["#ff6b6b", "#ffffff"] },
  { clave: "sandia",         nombre: "Sandía",         rareza: "Poco común", patron: "rayas",  pal: ["#51cf66", "#2b8a3e"] },
  { clave: "dalmata",        nombre: "Dálmata",        rareza: "Poco común", patron: "puntos", pal: ["#f8f9fa", "#212529"] },
  { clave: "leopardo",       nombre: "Leopardo",       rareza: "Poco común", patron: "puntos", pal: ["#ffa94d", "#5c3d1e"] },
  { clave: "menta",          nombre: "Menta",          rareza: "Poco común", patron: "bicolor",pal: ["#63e6be", "#20c997"] },
  { clave: "coral",          nombre: "Coral",          rareza: "Poco común", patron: "bicolor",pal: ["#ff8787", "#ffd8a8"] },
  // ---- Rara ----
  { clave: "atardecer",      nombre: "Atardecer",      rareza: "Rara", patron: "degradado", pal: ["#ffa94d", "#f06595", "#7048e8"] },
  { clave: "oceano-profundo",nombre: "Océano Profundo",rareza: "Rara", patron: "degradado", pal: ["#66d9e8", "#1c7ed6", "#0b2545"] },
  { clave: "aurora",         nombre: "Aurora",         rareza: "Rara", patron: "degradado", pal: ["#69db7c", "#22b8cf", "#9775fa"] },
  { clave: "lava",           nombre: "Lava",           rareza: "Rara", patron: "degradado", pal: ["#fa5252", "#ff922b", "#ffe066"] },
  { clave: "hielo",          nombre: "Hielo",          rareza: "Rara", patron: "degradado", pal: ["#ffffff", "#a5d8ff", "#4dabf7"] },
  { clave: "bosque-encantado",nombre: "Bosque Encantado",rareza: "Rara", patron: "degradado", pal: ["#d8f5a2", "#51cf66", "#0b5d1e"] },
  { clave: "cereza",         nombre: "Cereza",         rareza: "Rara", patron: "degradado", pal: ["#ffc9c9", "#fa5252", "#7a0c0c"] },
  // ---- Épica ----
  { clave: "arcoiris",       nombre: "Arcoíris",       rareza: "Épica", patron: "arcoiris",  pal: ["#ff4d4d"] },
  { clave: "galaxia",        nombre: "Galaxia",        rareza: "Épica", patron: "degradado", pal: ["#845ef7", "#3b5bdb", "#0b1b4d"], accesorio: "halo" },
  { clave: "neon",           nombre: "Neón",           rareza: "Épica", patron: "rayas",     pal: ["#22e6ff", "#ff2bd6"] },
  { clave: "oro-puro",       nombre: "Oro Puro",       rareza: "Épica", patron: "degradado", pal: ["#fff3bf", "#fcc419", "#e67700"] },
  { clave: "diablillo",      nombre: "Diablillo",      rareza: "Épica", patron: "rayas",     pal: ["#e03131", "#1a1a1a"], accesorio: "cuernos" },
  // ---- Legendaria ----
  { clave: "dragon-esmeralda",nombre: "Dragón Esmeralda",rareza: "Legendaria", patron: "degradado", pal: ["#b2f2bb", "#12b886", "#0b6e4f"], accesorio: "cuernos" },
  { clave: "rey-neon",       nombre: "Rey Neón",       rareza: "Legendaria", patron: "arcoiris",  pal: ["#ff4d4d"], accesorio: "corona" },
  { clave: "fantasma-cosmico",nombre: "Fantasma Cósmico",rareza: "Legendaria", patron: "degradado", pal: ["#ffffff", "#b197fc", "#5f3dc4"], accesorio: "halo" },
  { clave: "fenix",          nombre: "Fénix",          rareza: "Legendaria", patron: "degradado", pal: ["#ffec99", "#ff922b", "#e03131"], accesorio: "corona" }
];

const BASE_RAREZA = { "Común": 55, "Poco común": 65, "Rara": 78, "Épica": 92, "Legendaria": 110 };
const BONO_VALOR = { "Común": 500, "Poco común": 1500, "Rara": 3500, "Épica": 8000, "Legendaria": 18000 };

function hash(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function estadisticas(sk) {
  const b = BASE_RAREZA[sk.rareza];
  const v = (n) => hash(sk.clave + n) % 15; // 0..14, fijo por skin
  return { hp: b + v("a"), atk: b + v("b"), def: b + v("c"), spe: b + v("d"), tipos: [] };
}

export async function asegurarSnakes() {
  if (contarPersonajes("snake") >= SKINS.length) return;
  for (const sk of SKINS) {
    const st = estadisticas(sk);
    crearPersonaje({
      categoria: "snake", clave: sk.clave, nombre: sk.nombre, serie: "Snake", genero: "",
      rareza: sk.rareza,
      valor: (st.hp + st.atk + st.def + st.spe) * 8 + BONO_VALOR[sk.rareza],
      img: `snake:${sk.clave}`,
      stats: st,
      meta: { patron: sk.patron, accesorio: sk.accesorio || "ninguno" }
    });
  }
}

// ---------------- dibujo ----------------
function prng(semilla) {
  let s = semilla || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

function mezclar(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
  const ch = (sh) => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function colorSegmento(sk, i, t) {
  const pal = sk.pal;
  switch (sk.patron) {
    case "rayas":     return pal[Math.floor(i / 2) % 2];
    case "bicolor":   return pal[Math.floor(i / 3) % 2];
    case "puntos":    return pal[0];
    case "arcoiris":  return `hsl(${Math.round(t * 300)},90%,58%)`;
    case "degradado": {
      const tramos = pal.length - 1;
      const x = Math.min(0.9999, t) * tramos;
      const k = Math.floor(x);
      return mezclar(pal[k], pal[k + 1], x - k);
    }
    default:          return pal[i % 2];
  }
}

export function svgSnake(sk) {
  const W = 800, H = 800, N = 26;
  const rnd = prng(hash(sk.clave));

  // fondo: degradado oscuro + orbes de luz
  let orbes = "";
  for (let k = 0; k < 34; k++) {
    const x = Math.round(rnd() * W), y = Math.round(rnd() * H), r = 3 + Math.round(rnd() * 9);
    const col = sk.patron === "arcoiris" ? `hsl(${Math.round(rnd() * 360)},95%,65%)` : sk.pal[k % sk.pal.length];
    orbes += `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${col}" opacity="0.10"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="0.75"/>`;
  }

  // cuerpo: onda de la cola (izquierda) a la cabeza (derecha)
  const pts = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = 110 + t * 580;
    const y = 420 + Math.sin(t * Math.PI * 2.2 + 0.5) * 165;
    const r = 20 + 24 * Math.pow(t, 0.8);
    pts.push({ x, y, r, t });
  }

  let cuerpo = "";
  pts.forEach((p, i) => {
    const col = colorSegmento(sk, i, p.t);
    cuerpo += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="${col}" stroke="rgba(0,0,0,0.35)" stroke-width="3"/>`;
    if (sk.patron === "puntos" && i % 2 === 1 && i < N - 1) {
      cuerpo += `<circle cx="${(p.x + 4).toFixed(1)}" cy="${(p.y + 2).toFixed(1)}" r="${(p.r * 0.38).toFixed(1)}" fill="${sk.pal[1]}"/>`;
    }
    cuerpo += `<circle cx="${(p.x - p.r * 0.3).toFixed(1)}" cy="${(p.y - p.r * 0.35).toFixed(1)}" r="${(p.r * 0.32).toFixed(1)}" fill="#fff" opacity="0.22"/>`;
  });

  // cabeza: ojos y accesorio
  const h = pts[N - 1], q = pts[N - 2];
  let dx = h.x - q.x, dy = h.y - q.y;
  const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
  const nx = -dy, ny = dx;
  let cabeza = "";
  for (const lado of [-1, 1]) {
    const ex = h.x + dx * 16 + nx * lado * 19, ey = h.y + dy * 16 + ny * lado * 19;
    cabeza += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="13" fill="#fff" stroke="#111" stroke-width="2"/>` +
              `<circle cx="${(ex + dx * 5).toFixed(1)}" cy="${(ey + dy * 5).toFixed(1)}" r="6.5" fill="#111"/>`;
  }
  const hx = h.x.toFixed(1), hy = h.y.toFixed(1);
  if (sk.accesorio === "cuernos") {
    cabeza += `<polygon points="${h.x - 34},${h.y - 30} ${h.x - 20},${h.y - 78} ${h.x - 6},${h.y - 38}" fill="#f1f3f5" stroke="#111" stroke-width="3"/>` +
              `<polygon points="${h.x + 6},${h.y - 38} ${h.x + 20},${h.y - 78} ${h.x + 34},${h.y - 30}" fill="#f1f3f5" stroke="#111" stroke-width="3"/>`;
  } else if (sk.accesorio === "corona") {
    cabeza += `<polygon points="${h.x - 36},${h.y - 34} ${h.x - 36},${h.y - 80} ${h.x - 18},${h.y - 58} ${h.x},${h.y - 88} ${h.x + 18},${h.y - 58} ${h.x + 36},${h.y - 80} ${h.x + 36},${h.y - 34}" fill="#fcc419" stroke="#7a4a00" stroke-width="3"/>` +
              `<circle cx="${h.x}" cy="${h.y - 50}" r="6" fill="#e03131"/>`;
  } else if (sk.accesorio === "halo") {
    cabeza += `<ellipse cx="${hx}" cy="${(h.y - 62).toFixed(1)}" rx="38" ry="11" fill="none" stroke="#ffe066" stroke-width="7"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><radialGradient id="fondo" cx="50%" cy="45%" r="75%"><stop offset="0%" stop-color="#2b2450"/><stop offset="100%" stop-color="#0a0916"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#fondo)"/>${orbes}${cuerpo}${cabeza}</svg>`;
}

let sharpMod = null;
// Dibuja la skin en un PNG (ruta). Usa sharp, ya incluido en las dependencias del bot.
export async function renderSnake(clave, ruta) {
  const sk = SKINS.find((s) => s.clave === clave);
  if (!sk) throw new Error("skin desconocida: " + clave);
  if (!sharpMod) {
    sharpMod = (await import("sharp")).default;
    sharpMod.cache(false);          // no acumular imágenes en la cache interna
    sharpMod.concurrency(1);
  }
  await sharpMod(Buffer.from(svgSnake(sk))).png({ compressionLevel: 9 }).toFile(ruta);
}

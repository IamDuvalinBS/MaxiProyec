import axios from "axios";
import { filasPersonajes, yandereCrearPersonaje, etiquetarPersonaje } from "./gacha-db.js";
import { valorInicialWaifu, rarezaPorValorWaifu } from "./gacha-config.js";

const BASE = process.env.DANBOORU_URL || "https://danbooru.donmai.us";
const UA = "MaxiBot/1.0 (+whatsapp-gacha)";
const OFFSET_ID = 10_000_000_000;
const TIPO = { general: 0, artista: 1, copyright: 3, personaje: 4 };

const ANCHO_PRINCIPAL = 600;
const ANCHO_GALERIA = 400;
const POR_PAGINA = 200;
const MAX_PAGINAS = 1000;
const PAUSA_PAGINA_MS = 220;
const MB = 1024 * 1024;

const entero = (nombre, porDefecto) => {
  const n = Number(process.env[nombre]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : porDefecto;
};

export const MAX_POSTS_POR_DEFECTO = entero("YANDERE_MAX_POSTS", 60000);
const MAX_POSTS_ALEATORIO = entero("YANDERE_MAX_POSTS_ALEATORIO", 8000);
const GALERIA_MAX = entero("YANDERE_GALERIA_MAX", 60);
const MAX_PERSONAJES_POR_POST = entero("YANDERE_MAX_PERSONAJES_POST", 3);
const MAX_LINK_PAGINAS_POOL = 50;

const RATINGS = new Set((process.env.DANBOORU_RATINGS || "g,s,q").split(",").map((s) => s.trim()).filter(Boolean));
const AUTH = process.env.DANBOORU_LOGIN && process.env.DANBOORU_API_KEY
  ? { username: process.env.DANBOORU_LOGIN, password: process.env.DANBOORU_API_KEY }
  : undefined;

const CAMPOS = [
  "id", "md5", "parent_id", "rating", "score", "image_width", "file_size", "file_url", "large_file_url",
  "tag_string", "tag_string_character", "tag_string_copyright", "is_deleted", "is_banned"
].join(",");

const TAGS_EXCLUIDOS_PRINCIPAL = new Set([
  "comic", "4koma", "monochrome", "greyscale", "sketch", "lineart", "3d", "photo_(medium)", "ai-generated", "text_focus"
]);
const TAGS_DESNUDEZ = [
  "nude", "completely_nude", "topless", "bottomless", "nipples", "areolae", "pussy", "anus", "penis", "testicles",
  "pubic_hair", "uncensored", "censored", "mosaic_censoring", "bar_censor", "convenient_censoring", "novelty_censor",
  "nipple_slip", "sex", "vaginal", "anal", "fellatio", "oral", "cum", "ejaculation", "masturbation", "fingering",
  "paizuri", "handjob", "rape", "futanari"
];
const TAGS_MENORES = ["loli", "shota", "toddler", "toddlercon", "child", "baby", "infant", "aged_down", "underage"];
const TAGS_BLOQUEADOS = new Set([...TAGS_DESNUDEZ, ...TAGS_MENORES]);
const SERIES_IGNORADAS = new Set(["original", "tagme", "copyright_request", "vocaloid", "virtual_youtuber"]);

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const azar = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const mezclar = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sumar = (obj, clave, n = 1) => { obj[clave] = (obj[clave] || 0) + n; };
const lista = (texto) => String(texto || "").split(/\s+/).filter(Boolean);
const unico = (arr) => [...new Set(arr.filter(Boolean))];

async function api(ruta, params, reintentos = 3) {
  for (let intento = 0; ; intento++) {
    try {
      const { data } = await axios.get(BASE + ruta, {
        params,
        auth: AUTH,
        headers: { "User-Agent": UA, Accept: "application/json" },
        timeout: 40000
      });
      return data;
    } catch (e) {
      const estado = e.response?.status;
      const transitorio = !estado || estado === 429 || estado >= 500;
      if (transitorio && intento < reintentos) {
        await pausa(2500 * (intento + 1));
        continue;
      }
      const detalle = e.response?.data?.message || e.response?.data?.error;
      if (detalle) throw new Error(String(detalle));
      throw e;
    }
  }
}

async function pedirPosts(params) {
  try {
    return await api("/posts.json", { ...params, only: CAMPOS });
  } catch (e) {
    return api("/posts.json", params);
  }
}

const normalizar = (t) => String(t || "").toLowerCase().replace(/_\([^)]*\)$/, "").replace(/[^a-z0-9]/g, "");
const claveNombre = (nombre, serie) => `n:${normalizar(nombre)}|${normalizar(serie)}`;

function bonito(tag) {
  return tag
    .replace(/_\([^)]*\)$/, "")
    .replace(/_/g, " ")
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    .trim();
}

function crearIndice() {
  const porTag = new Map();
  const porNombre = new Map();
  for (const p of filasPersonajes("waifu")) {
    porTag.set(p.clave, p);
    porNombre.set(claveNombre(p.nombre, p.serie), p);
  }
  return {
    buscar(tag, serie) {
      return porTag.get(tag) || porNombre.get(claveNombre(bonito(tag), serie || "")) || null;
    }
  };
}

function serieDe(post, preferida) {
  const series = lista(post.tag_string_copyright).filter((t) => !SERIES_IGNORADAS.has(t));
  if (preferida && series.includes(preferida)) return preferida;
  return series.find((t) => !/_\(series\)$/.test(t)) || series[0] || null;
}

export function elegirImagenes(post) {
  const valida = (u) => u && /\.(jpe?g|png|webp)(\?|$)/i.test(u);
  const salida = [];
  if (valida(post.large_file_url)) salida.push(post.large_file_url);
  if (valida(post.file_url) && !salida.includes(post.file_url) && (post.file_size || 0) <= 8 * MB) salida.push(post.file_url);
  if (!salida.length && valida(post.file_url)) salida.push(post.file_url);
  return salida;
}

function motivoDeRechazo(post, tags) {
  if (post.is_deleted || post.is_banned) return "post eliminado";
  if (!RATINGS.has(post.rating)) return "rating no permitido";
  if (tags.some((t) => TAGS_BLOQUEADOS.has(t))) return "contenido explícito";
  if ((post.image_width ?? 0) < ANCHO_GALERIA) return "imagen muy pequeña";
  return null;
}

function nuevoGrupo(tag, serie) {
  return { tag, serie, genero: "Femenino", galeria: [], md5s: new Set(), principal: null, principalGrupal: null, primero: null };
}

function acumularPost(grupos, post, { serieHint = null, maxPersonajes = MAX_PERSONAJES_POR_POST, rechazos }) {
  const tags = lista(post.tag_string);
  const rechazo = motivoDeRechazo(post, tags);
  if (rechazo) { sumar(rechazos, rechazo); return 0; }

  const personajes = lista(post.tag_string_character);
  if (!personajes.length) { sumar(rechazos, "sin personaje identificable"); return 0; }
  if (personajes.length > maxPersonajes) { sumar(rechazos, "demasiados personajes en la imagen"); return 0; }

  const imagenes = elegirImagenes(post);
  if (!imagenes.length) { sumar(rechazos, "sin archivo"); return 0; }

  const serieTag = serieDe(post, serieHint);
  const serie = serieTag ? bonito(serieTag) : "Original / Desconocida";
  const genero = tags.includes("1boy") || tags.includes("male_focus") ? "Masculino" : "Femenino";
  const solo = personajes.length === 1;
  const estricto = (post.image_width ?? 0) >= ANCHO_PRINCIPAL && !tags.some((t) => TAGS_EXCLUIDOS_PRINCIPAL.has(t));
  const item = {
    id: post.id, md5: post.md5 || null, parent_id: post.parent_id || null,
    imgs: imagenes, score: post.score ?? 0, genero
  };

  for (const tag of personajes) {
    let g = grupos.get(tag);
    if (!g) grupos.set(tag, (g = nuevoGrupo(tag, serie)));
    if (!g.primero) { g.primero = item; g.genero = genero; }
    if (estricto && solo && !g.principal) g.principal = item;
    if (estricto && !solo && !g.principalGrupal) g.principalGrupal = item;
    const clave = item.md5 || String(item.id);
    if (g.galeria.length < GALERIA_MAX && !g.md5s.has(clave)) {
      g.md5s.add(clave);
      g.galeria.push(imagenes[0]);
    }
  }
  return 1;
}

async function contarPosts(tags) {
  try {
    const d = await api("/counts/posts.json", { tags }, 1);
    return Number(d?.counts?.posts) || 0;
  } catch {
    return 0;
  }
}

async function escanear({ tags, serieHint = null, max = MAX_POSTS_POR_DEFECTO, paginasMax = MAX_PAGINAS, alProgreso = null, maxPersonajes }) {
  const grupos = new Map();
  const rechazos = {};
  const total = await contarPosts(tags);
  let vistos = 0;
  let aceptados = 0;
  let incompleto = null;

  for (let page = 1; page <= paginasMax && vistos < max; page++) {
    let lote;
    try {
      lote = await pedirPosts({ tags, limit: POR_PAGINA, page });
    } catch (e) {
      incompleto = e.message;
      break;
    }
    if (!Array.isArray(lote) || !lote.length) break;
    for (const post of lote) {
      if (vistos >= max) break;
      vistos++;
      aceptados += acumularPost(grupos, post, { serieHint, maxPersonajes, rechazos });
    }
    if (alProgreso && page % 50 === 0) {
      await alProgreso({ vistos, total, personajes: grupos.size });
    }
    if (lote.length < POR_PAGINA) break;
    await pausa(PAUSA_PAGINA_MS);
  }
  return { grupos, rechazos, vistos, aceptados, total, incompleto };
}

function guardarGrupos(grupos, { limiteNuevos = Infinity } = {}) {
  const indice = crearIndice();
  const agregadas = [];
  const actualizadas = [];
  let fotosNuevas = 0;

  for (const g of grupos.values()) {
    if (!g.galeria.length) continue;
    const nombre = bonito(g.tag);
    const existente = indice.buscar(g.tag, g.serie);

    if (existente) {
      const previa = Array.isArray(existente.meta?.galeria)
        ? existente.meta.galeria
        : unico([existente.img, ...(existente.meta?.alt || [])]);
      const unida = unico([...previa, ...g.galeria]).slice(0, GALERIA_MAX);
      const nuevas = unida.length - previa.length;
      if (nuevas > 0 || !Array.isArray(existente.meta?.galeria)) {
        etiquetarPersonaje(existente.id, { galeria: unida });
        if (nuevas > 0) {
          fotosNuevas += nuevas;
          actualizadas.push({ id: existente.id, nombre: existente.nombre, serie: existente.serie, nuevas });
        }
      }
      continue;
    }

    if (agregadas.length >= limiteNuevos) continue;

    const principal = g.principal || g.principalGrupal || g.primero;
    const imagen = principal.imgs[0];
    const valor = valorInicialWaifu();
    const rareza = rarezaPorValorWaifu(valor);
    const galeria = unico([imagen, ...g.galeria]).slice(0, GALERIA_MAX);
    const link = `${BASE}/posts/${principal.id}`;
    const info = {
      post_id: OFFSET_ID + principal.id,
      md5: principal.md5,
      parent_id: principal.parent_id ? OFFSET_ID + principal.parent_id : null
    };
    const creado = yandereCrearPersonaje({
      categoria: "waifu",
      clave: g.tag,
      nombre,
      serie: g.serie,
      genero: g.genero,
      rareza,
      valor,
      img: imagen,
      meta: { fuente: "danbooru", post: principal.id, link, score: principal.score, alt: principal.imgs.slice(1), galeria }
    }, info);
    if (!creado) continue;

    fotosNuevas += galeria.length;
    agregadas.push({
      id: creado.id, categoria: "waifu", clave: g.tag, nombre, serie: g.serie,
      genero: g.genero, rareza, valor, img: imagen,
      meta: { link, alt: principal.imgs.slice(1), galeria }
    });
  }
  return { agregadas, actualizadas, fotosNuevas };
}

export function parseLink(texto) {
  const t = String(texto || "").trim();
  if (/^\d+$/.test(t)) return { tipo: "post", id: parseInt(t, 10) };
  let u;
  try { u = new URL(t); } catch { return null; }
  if (!/(^|\.)donmai\.us$/i.test(u.hostname)) return null;
  const ruta = u.pathname;
  let m = ruta.match(/^\/posts\/(\d+)/i);
  if (m) return { tipo: "post", id: +m[1] };
  m = ruta.match(/^\/pools\/(\d+)/i);
  if (m) return { tipo: "pool", id: +m[1] };
  if (/^\/posts\/?$/i.test(ruta)) return { tipo: "busqueda", tags: u.searchParams.get("tags") || "" };
  m = ruta.match(/^\/wiki_pages\/([^/]+)/i);
  if (m) {
    let nombre = m[1];
    try { nombre = decodeURIComponent(nombre); } catch {}
    return { tipo: "serie", tag: nombre.toLowerCase().replace(/\s+/g, "_") };
  }
  return null;
}

export async function animesAleatorios(n) {
  const filas = await api("/tags.json", {
    "search[category]": TIPO.copyright, "search[order]": "count", limit: 100, page: azar(1, 8)
  });
  const validas = (Array.isArray(filas) ? filas : []).filter((t) => (t.post_count ?? 0) >= 300 && !SERIES_IGNORADAS.has(t.name) && !/_\(series\)$/.test(t.name));
  return mezclar(validas).slice(0, n).map((t) => t.name);
}

export async function agregarSerie(serie, { max = MAX_POSTS_POR_DEFECTO, alProgreso = null } = {}) {
  const lectura = await escanear({ tags: `${serie} order:score`, serieHint: serie, max, alProgreso });
  const { agregadas, actualizadas, fotosNuevas } = guardarGrupos(lectura.grupos);
  return {
    agregadas, actualizadas, fotosNuevas,
    rechazos: lectura.rechazos, vistos: lectura.vistos, total: lectura.total,
    personajesEncontrados: lectura.grupos.size, incompleto: lectura.incompleto
  };
}

export async function agregarAnimes(cantidad = 5, onSerie) {
  const resumen = [];
  for (let i = 0; i < cantidad; i++) {
    let serie;
    try {
      [serie] = await animesAleatorios(1);
    } catch (e) {
      continue;
    }
    if (!serie) continue;
    try {
      const r = await agregarSerie(serie, { max: MAX_POSTS_ALEATORIO });
      resumen.push({ serie, ...r });
      if (onSerie) await onSerie(serie, r);
    } catch (e) {
      resumen.push({ serie, agregadas: [], actualizadas: [], fotosNuevas: 0, rechazos: { "error de consulta": 1 } });
    }
  }
  return resumen;
}

function resultado(lectura, guardado) {
  const { agregadas, actualizadas, fotosNuevas } = guardado;
  const motivo = Object.entries(lectura.rechazos).sort((a, b) => b[1] - a[1])[0]?.[0] || lectura.incompleto || "sin resultados";
  return {
    ok: agregadas.length > 0 || fotosNuevas > 0,
    agregadas, actualizadas, fotosNuevas,
    rechazos: lectura.rechazos, vistos: lectura.vistos, total: lectura.total,
    personajesEncontrados: lectura.grupos.size, incompleto: lectura.incompleto,
    motivo
  };
}

export async function agregarPorLink(link, { max = MAX_POSTS_POR_DEFECTO, alProgreso = null } = {}) {
  const p = parseLink(link);
  if (!p) return { ok: false, motivo: "link inválido (usa un link de danbooru.donmai.us)" };

  if (p.tipo === "serie") {
    const r = await agregarSerie(p.tag, { max, alProgreso });
    return {
      ok: r.agregadas.length > 0 || r.fotosNuevas > 0, ...r,
      motivo: Object.entries(r.rechazos).sort((a, b) => b[1] - a[1])[0]?.[0] || r.incompleto || "sin resultados"
    };
  }

  if (p.tipo === "post") {
    const post = await api(`/posts/${p.id}.json`, {});
    if (!post?.id) return { ok: false, motivo: "el post no existe o fue eliminado" };
    const grupos = new Map();
    const rechazos = {};
    const vistos = 1;
    acumularPost(grupos, post, { maxPersonajes: 99, rechazos });
    const guardado = guardarGrupos(grupos, { limiteNuevos: 1 });
    return resultado({ grupos, rechazos, vistos, total: 1, incompleto: null }, guardado);
  }

  if (p.tipo === "pool") {
    const lectura = await escanear({ tags: `pool:${p.id}`, max, paginasMax: MAX_LINK_PAGINAS_POOL, alProgreso, maxPersonajes: 99 });
    return resultado(lectura, guardarGrupos(lectura.grupos));
  }

  let tags = lista(p.tags).filter((t) => !t.startsWith("rating:"));
  if (!tags.length) return { ok: false, motivo: "la búsqueda no tiene tags" };
  if (!tags.some((t) => t.startsWith("order:"))) tags = [...tags, "order:score"];
  const lectura = await escanear({ tags: tags.join(" "), max, alProgreso });
  return resultado(lectura, guardarGrupos(lectura.grupos));
}

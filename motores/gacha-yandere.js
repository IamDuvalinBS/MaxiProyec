import axios from "axios";
import {
  personajesDeCategoria, yandereDuplicado, yandereRegistrar, yandereCrearPersonaje
} from "./gacha-db.js";

const BASE = "https://danbooru.donmai.us";
const UA = "MaxiBot/1.0 (+whatsapp-gacha)";
const OFFSET_ID = 10_000_000_000;
const TIPO = { general: 0, artista: 1, copyright: 3, personaje: 4 };

const ANCHO_MINIMO = 600;
const MAX_POR_SERIE = 150;
const MAX_LINK = 200;
const PAGINAS_ESCANEO = 4;
const MB = 1024 * 1024;

const RATINGS = new Set((process.env.DANBOORU_RATINGS || "g,s,q").split(",").map((s) => s.trim()).filter(Boolean));
const AUTH = process.env.DANBOORU_LOGIN && process.env.DANBOORU_API_KEY
  ? { username: process.env.DANBOORU_LOGIN, password: process.env.DANBOORU_API_KEY }
  : undefined;

const TAGS_EXCLUIDOS = new Set([
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
const sumar = (obj, clave) => { obj[clave] = (obj[clave] || 0) + 1; };
const lista = (texto) => String(texto || "").split(/\s+/).filter(Boolean);

async function api(ruta, params, reintento = true) {
  try {
    const { data } = await axios.get(BASE + ruta, {
      params,
      auth: AUTH,
      headers: { "User-Agent": UA, Accept: "application/json" },
      timeout: 20000
    });
    return data;
  } catch (e) {
    if (reintento && e.response?.status === 429) {
      await pausa(2500);
      return api(ruta, params, false);
    }
    const detalle = e.response?.data?.message || e.response?.data?.error;
    if (detalle) throw new Error(String(detalle));
    throw e;
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
  const claves = new Set();
  for (const p of personajesDeCategoria("waifu")) {
    claves.add(`c:${p.clave}`);
    claves.add(claveNombre(p.nombre, p.serie));
  }
  return {
    tiene(tag, serie) { return claves.has(`c:${tag}`) || claves.has(claveNombre(bonito(tag), serie || "")); },
    agregar(tag, nombre, serie) { claves.add(`c:${tag}`); claves.add(claveNombre(nombre, serie)); }
  };
}

function serieDe(post, preferida) {
  const series = lista(post.tag_string_copyright).filter((t) => !SERIES_IGNORADAS.has(t));
  if (preferida && series.includes(preferida)) return preferida;
  return series.find((t) => !/_\(series\)$/.test(t)) || series[0] || null;
}

function motivoDeRechazo(post) {
  if (post.is_deleted || post.is_banned) return "post eliminado";
  if (!RATINGS.has(post.rating)) return "rating no permitido";
  const tags = lista(post.tag_string);
  if (tags.some((t) => TAGS_BLOQUEADOS.has(t))) return "contenido explícito";
  if (tags.some((t) => TAGS_EXCLUIDOS.has(t))) return "no es ilustración válida";
  if ((post.image_width ?? 0) < ANCHO_MINIMO) return "imagen muy pequeña";
  return null;
}

export function elegirImagenes(post) {
  const valida = (u) => u && /\.(jpe?g|png|webp)(\?|$)/i.test(u);
  const salida = [];
  if (valida(post.large_file_url)) salida.push(post.large_file_url);
  if (valida(post.file_url) && !salida.includes(post.file_url) && (post.file_size || 0) <= 8 * MB) salida.push(post.file_url);
  if (!salida.length && valida(post.file_url)) salida.push(post.file_url);
  return salida;
}

function rarezaDe(valor) {
  if (valor >= 20000) return "Legendaria";
  if (valor >= 10000) return "Épica";
  if (valor >= 5000) return "Rara";
  if (valor >= 2500) return "Poco común";
  return "Común";
}

export async function procesarPost(post, { indice, serie: serieHint = null, objetivo = null, forzar = false } = {}) {
  indice = indice || crearIndice();
  const info = {
    post_id: OFFSET_ID + post.id,
    md5: post.md5 || null,
    parent_id: post.parent_id ? OFFSET_ID + post.parent_id : null
  };

  const dup = yandereDuplicado(info);
  if (dup) return { ok: false, motivo: `duplicado (${dup})` };

  const rechazo = motivoDeRechazo(post);
  if (rechazo) {
    yandereRegistrar({ ...info, estado: rechazo === "contenido explícito" || rechazo === "rating no permitido" ? "rating" : "filtrado" });
    return { ok: false, motivo: rechazo };
  }

  const imagenes = elegirImagenes(post);
  if (!imagenes.length) return { ok: false, motivo: "sin archivo" };

  const personajes = lista(post.tag_string_character);
  if (!personajes.length) {
    yandereRegistrar({ ...info, estado: "sin_personaje" });
    return { ok: false, motivo: "sin personaje identificable" };
  }
  if (personajes.length > 1 && !forzar) {
    yandereRegistrar({ ...info, estado: "varios_personajes" });
    return { ok: false, motivo: "varios personajes en la imagen" };
  }
  if (objetivo && !personajes.includes(objetivo)) return { ok: false, motivo: "no es el personaje buscado" };

  const serieTag = serieDe(post, serieHint);
  const serie = serieTag ? bonito(serieTag) : "Original / Desconocida";

  const tag = objetivo || personajes.find((t) => !indice.tiene(t, serie));
  if (!tag || indice.tiene(tag, serie)) {
    yandereRegistrar({ ...info, estado: "duplicado" });
    return { ok: false, motivo: "personaje ya registrado" };
  }

  const nombre = bonito(tag);
  const tags = lista(post.tag_string);
  const genero = tags.includes("1boy") || tags.includes("male_focus") ? "Masculino" : "Femenino";
  const valor = Math.min(30000, Math.max(1000, 1000 + (post.score ?? 0) * 40));
  const link = `${BASE}/posts/${post.id}`;
  const creado = yandereCrearPersonaje({
    categoria: "waifu",
    clave: tag,
    nombre,
    serie,
    genero,
    rareza: rarezaDe(valor),
    valor,
    img: imagenes[0],
    meta: { fuente: "danbooru", post: post.id, link, score: post.score ?? 0, alt: imagenes.slice(1) }
  }, info);
  if (!creado) return { ok: false, motivo: "personaje ya registrado" };
  indice.agregar(tag, nombre, serie);

  return {
    ok: true,
    personaje: {
      id: creado.id, categoria: "waifu", clave: tag, nombre, serie,
      genero, rareza: rarezaDe(valor), valor, img: imagenes[0],
      meta: { link, alt: imagenes.slice(1) }
    }
  };
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

async function postsDePersonaje(tag) {
  const posts = await api("/posts.json", { tags: `${tag} order:score`, limit: 20 });
  return Array.isArray(posts) ? posts : [];
}

async function personajesRelacionados(serie) {
  try {
    const d = await api("/related_tag.json", {
      "search[query]": serie, "search[category]": TIPO.personaje, "search[order]": "Frequency", limit: 300
    });
    const filas = d?.related_tags || d?.tags || [];
    return filas.map((x) => x?.tag?.name || (Array.isArray(x) ? x[0] : x?.name)).filter(Boolean);
  } catch (e) {
    console.log(`[yanderandom] related ${serie}: ${e.message}`);
    return [];
  }
}

export async function animesAleatorios(n) {
  const filas = await api("/tags.json", {
    "search[category]": TIPO.copyright, "search[order]": "count", limit: 100, page: azar(1, 8)
  });
  const validas = (Array.isArray(filas) ? filas : []).filter((t) => (t.post_count ?? 0) >= 300 && !SERIES_IGNORADAS.has(t.name) && !/_\(series\)$/.test(t.name));
  return mezclar(validas).slice(0, n).map((t) => t.name);
}

export async function agregarSerie(serie, { max = MAX_POR_SERIE } = {}) {
  const indice = crearIndice();
  const agregadas = [];
  const rechazos = {};
  const candidatos = new Set(await personajesRelacionados(serie));

  for (let page = 1; page <= PAGINAS_ESCANEO; page++) {
    let posts;
    try {
      posts = await api("/posts.json", { tags: `${serie} order:score`, limit: 100, page });
    } catch (e) {
      break;
    }
    if (!Array.isArray(posts) || !posts.length) break;
    for (const p of posts) {
      const pj = lista(p.tag_string_character);
      if (pj.length === 1) candidatos.add(pj[0]);
    }
    await pausa(250);
  }
  console.log(`[yanderandom] ${serie}: ${candidatos.size} personajes candidatos`);

  for (const tag of candidatos) {
    if (agregadas.length >= max) break;
    if (indice.tiene(tag, bonito(serie))) { sumar(rechazos, "personaje ya registrado"); continue; }
    let posts;
    try {
      posts = await postsDePersonaje(tag);
    } catch (e) {
      sumar(rechazos, "error de consulta");
      continue;
    }
    await pausa(250);
    let listo = false;
    for (const post of posts) {
      const r = await procesarPost(post, { indice, serie, objetivo: tag });
      if (r.ok) { agregadas.push(r.personaje); listo = true; break; }
    }
    if (!listo) sumar(rechazos, "sin imagen válida");
  }
  return { agregadas, rechazos };
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
      const r = await agregarSerie(serie);
      resumen.push({ serie, ...r });
      if (onSerie) await onSerie(serie, r);
    } catch (e) {
      resumen.push({ serie, agregadas: [], rechazos: { "error de consulta": 1 } });
    }
  }
  return resumen;
}

export async function agregarPorLink(link) {
  const p = parseLink(link);
  if (!p) return { ok: false, motivo: "link inválido (usa un link de danbooru.donmai.us)" };

  if (p.tipo === "serie") {
    const r = await agregarSerie(p.tag);
    return { ok: r.agregadas.length > 0, ...r, motivo: Object.keys(r.rechazos)[0] || "sin resultados" };
  }

  let posts = [];
  if (p.tipo === "post") {
    const post = await api(`/posts/${p.id}.json`, {});
    if (!post?.id) return { ok: false, motivo: "el post no existe o fue eliminado" };
    posts = [post];
  } else if (p.tipo === "pool") {
    for (let page = 1; page <= 3 && posts.length < MAX_LINK; page++) {
      const l = await api("/posts.json", { tags: `pool:${p.id}`, limit: 100, page });
      if (!Array.isArray(l) || !l.length) break;
      posts.push(...l);
      await pausa(250);
    }
  } else {
    let tags = lista(p.tags).filter((t) => !t.startsWith("rating:"));
    if (!tags.length) return { ok: false, motivo: "la búsqueda no tiene tags" };
    if (!tags.some((t) => t.startsWith("order:")) && tags.length < 2) tags = [...tags, "order:score"];
    for (let page = 1; page <= 3 && posts.length < MAX_LINK; page++) {
      const l = await api("/posts.json", { tags: tags.join(" "), limit: 100, page });
      if (!Array.isArray(l) || !l.length) break;
      posts.push(...l);
      await pausa(250);
    }
  }

  const indice = crearIndice();
  const agregadas = [];
  const rechazos = {};
  for (const post of posts.slice(0, MAX_LINK)) {
    const r = await procesarPost(post, { indice, forzar: p.tipo === "post" });
    if (r.ok) agregadas.push(r.personaje);
    else sumar(rechazos, r.motivo);
  }
  return { ok: agregadas.length > 0, agregadas, rechazos, motivo: Object.keys(rechazos)[0] || "sin resultados" };
}

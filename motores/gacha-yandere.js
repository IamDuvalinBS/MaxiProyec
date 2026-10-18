import axios from "axios";
import {
  personajePorClave, yandereDuplicado, yandereRegistrar,
  yandereTagTipo, yandereTagGuardar, yandereCrearPersonaje
} from "./gacha-db.js";

const BASE = "https://yande.re";
const FUENTES = [BASE, "https://konachan.net"];
const UA = "Mozilla/5.0 (compatible; MaxiBot/1.0; +whatsapp-gacha)";
const TIPO = { general: 0, artista: 1, copyright: 3, personaje: 4, circulo: 5, faults: 6 };

const SCORE_MINIMO = 15;
const ANCHO_MINIMO = 600;
const MAX_TAGS_DESCONOCIDOS_POR_POST = 30;
const MAX_LINK = 100;
const TAGS_EXCLUIDOS = new Set(["comic", "monochrome", "sketch", "3d", "photo", "screenshot", "text", "manga"]);
const SERIES_IGNORADAS = new Set(["original", "tagme", "copyright_request", "vocaloid"]);

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

async function api(ruta, params, base = BASE) {
  const { data } = await axios.get(base + ruta, {
    params,
    headers: { "User-Agent": UA, Accept: "application/json" },
    timeout: 20000
  });
  return data;
}

export function idDesdeLink(texto) {
  if (!texto) return null;
  const m = String(texto).match(/yande\.re\/post\/show\/(\d+)/i);
  if (m) return parseInt(m[1], 10);
  if (/^\d+$/.test(texto.trim())) return parseInt(texto.trim(), 10);
  return null;
}

export function parseLink(texto) {
  const t = String(texto || "").trim();
  if (/^\d+$/.test(t)) return { tipo: "post", id: parseInt(t, 10), base: BASE };
  let u;
  try { u = new URL(t); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "");
  const base = FUENTES.find((f) => new URL(f).hostname === host);
  if (!base) return null;
  const ruta = u.pathname;
  let m = ruta.match(/\/post\/show\/(\d+)/i);
  if (m) return { tipo: "post", id: +m[1], base };
  let rutaDec = ruta;
  try { rutaDec = decodeURIComponent(ruta); } catch {}
  m = rutaDec.match(/(?:yande\.re|konachan\.net)\s(\d+)/i);
  if (m) return { tipo: "post", id: +m[1], base };
  m = ruta.match(/\/pool\/show\/(\d+)/i);
  const idPool = m ? +m[1] : (/\/pool\/show/i.test(ruta) ? parseInt(u.searchParams.get("id"), 10) : null);
  if (idPool) return { tipo: "pool", id: idPool, base };
  if (/^\/post(\/index)?\/?$/i.test(ruta)) return { tipo: "busqueda", tags: u.searchParams.get("tags") || "", base };
  return null;
}

export async function postPorId(id, base = BASE) {
  const lista = await api("/post.json", { tags: `id:${id}`, limit: 1 }, base);
  return Array.isArray(lista) && lista[0] ? lista[0] : null;
}

export async function postsAleatorios(base = BASE) {
  const paginas = [azar(1, 400), azar(1, 60), 1];
  for (const page of paginas) {
    const lista = await api("/post.json", { tags: "rating:safe", limit: 40, page }, base);
    if (Array.isArray(lista) && lista.length) return mezclar(lista);
  }
  return [];
}

async function tipoDeTag(nombre, contador, base = BASE) {
  const guardado = yandereTagTipo(nombre);
  if (guardado !== null) return guardado;
  if (contador.n >= MAX_TAGS_DESCONOCIDOS_POR_POST) return null;
  contador.n++;
  try {
    const lista = await api("/tag.json", { name: nombre, limit: 10 }, base);
    const exacto = Array.isArray(lista) ? lista.find((t) => t.name === nombre) : null;
    const tipo = exacto ? Number(exacto.type) : TIPO.general;
    yandereTagGuardar(nombre, tipo);
    await pausa(200);
    return tipo;
  } catch (e) {
    return null;
  }
}

const MB = 1024 * 1024;
export function elegirImagenes(post) {
  const lista = [];
  if (post.file_url && (post.file_size || 0) <= 8 * MB) lista.push(post.file_url);
  if (post.jpeg_url && post.jpeg_url !== post.file_url && (post.jpeg_file_size || 0) <= 12 * MB) lista.push(post.jpeg_url);
  if (post.sample_url && !lista.includes(post.sample_url)) lista.push(post.sample_url);
  if (!lista.length && post.file_url) lista.push(post.file_url);
  return lista;
}

function bonito(tag) {
  return tag
    .replace(/_\([^)]*\)$/, "")
    .replace(/_/g, " ")
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    .trim();
}

function rarezaDe(valor) {
  if (valor >= 20000) return "Legendaria";
  if (valor >= 10000) return "Épica";
  if (valor >= 5000) return "Rara";
  if (valor >= 2500) return "Poco común";
  return "Común";
}

export async function procesarPost(post, { base = BASE, scoreMin = SCORE_MINIMO, forzar = false } = {}) {
  const propio = base === BASE;
  const host = new URL(base).hostname;
  const info = {
    post_id: propio ? post.id : -post.id,
    md5: post.md5 || null,
    parent_id: post.parent_id ? (propio ? post.parent_id : -post.parent_id) : null
  };

  const dup = yandereDuplicado(info);
  if (dup) return { ok: false, motivo: `duplicado (${dup})` };

  if (post.rating !== "s") {
    yandereRegistrar({ ...info, estado: "rating" });
    return { ok: false, motivo: "no es rating safe" };
  }
  const tags = String(post.tags || "").split(/\s+/).filter(Boolean);
  if (!forzar && ((post.score ?? 0) < scoreMin || (post.width ?? 0) < ANCHO_MINIMO || tags.some((t) => TAGS_EXCLUIDOS.has(t)))) {
    yandereRegistrar({ ...info, estado: "sin_personaje" });
    return { ok: false, motivo: "no cumple calidad mínima" };
  }
  const imagenes = elegirImagenes(post);
  if (!imagenes.length) return { ok: false, motivo: "sin archivo" };
  const img = imagenes[0];

  const contador = { n: 0 };
  const personajes = [];
  const series = [];
  for (const tag of tags) {
    const tipo = await tipoDeTag(tag, contador, base);
    if (tipo === TIPO.personaje) personajes.push(tag);
    else if (tipo === TIPO.copyright) series.push(tag);
  }
  if (!forzar && personajes.length === 0) {
    yandereRegistrar({ ...info, estado: "sin_personaje" });
    return { ok: false, motivo: "sin personaje identificable" };
  }
  if (!forzar && personajes.length > 1) {
    yandereRegistrar({ ...info, estado: "varios_personajes" });
    return { ok: false, motivo: "varios personajes en la imagen" };
  }

  const libres = personajes.filter((t) => !personajePorClave("waifu", t));
  if (personajes.length && !libres.length) {
    yandereRegistrar({ ...info, estado: "duplicado" });
    return { ok: false, motivo: "personaje ya registrado" };
  }
  const tagPersonaje = libres[0] || `${host}_${post.id}`;
  const nombre = libres[0] ? bonito(libres[0]) : `Waifu ${post.id}`;
  const serie = series.length ? bonito(series[0]) : "Original / Desconocida";

  const valor = Math.min(30000, Math.max(1000, 1000 + (post.score ?? 0) * 40));
  const genero = tags.includes("1boy") || tags.includes("male_focus") ? "Masculino" : "Femenino";
  const link = `${base}/post/show/${post.id}`;
  const creado = yandereCrearPersonaje({
    categoria: "waifu",
    clave: tagPersonaje,
    nombre,
    serie,
    genero,
    rareza: rarezaDe(valor),
    valor,
    img,
    meta: { fuente: host, post: post.id, link, score: post.score ?? 0, alt: imagenes.slice(1) }
  }, info);
  if (!creado) return { ok: false, motivo: "personaje ya registrado" };

  return {
    ok: true,
    personaje: {
      id: creado.id, categoria: "waifu", clave: tagPersonaje, nombre, serie,
      genero, rareza: rarezaDe(valor), valor, img,
      meta: { link, alt: imagenes.slice(1) }
    }
  };
}

export async function agregarAleatorias(cantidad = 5, { intentosMaximos = 3 } = {}) {
  const agregadas = [];
  const rechazos = {};
  for (let ronda = 0; ronda < intentosMaximos && agregadas.length < cantidad; ronda++) {
    const posts = await postsAleatorios();
    for (const post of posts) {
      if (agregadas.length >= cantidad) break;
      const r = await procesarPost(post);
      if (r.ok) agregadas.push(r.personaje);
      else sumar(rechazos, r.motivo);
    }
  }
  return { agregadas, rechazos };
}

export async function animesAleatorios(n, base = BASE) {
  const lista = await api("/tag.json", { type: TIPO.copyright, order: "count", limit: 100, page: azar(1, 6) }, base);
  const validas = (Array.isArray(lista) ? lista : []).filter((t) => t.count >= 50 && !SERIES_IGNORADAS.has(t.name));
  return mezclar(validas).slice(0, n).map((t) => t.name);
}

export async function agregarSerie(serie, { base = BASE, max = 40 } = {}) {
  const agregadas = [];
  const rechazos = {};
  const rel = await api("/tag/related.json", { tags: serie, type: TIPO.personaje }, base);
  const tagsPj = (rel?.[serie] || []).map(([n]) => n).slice(0, max);
  for (const tag of tagsPj) {
    if (personajePorClave("waifu", tag)) { sumar(rechazos, "personaje ya registrado"); continue; }
    let posts;
    try {
      posts = await api("/post.json", { tags: `${tag} ${serie} solo rating:safe order:score`, limit: 10 }, base);
    } catch (e) {
      sumar(rechazos, "error de consulta");
      continue;
    }
    await pausa(300);
    let listo = false;
    for (const post of Array.isArray(posts) ? posts : []) {
      const r = await procesarPost(post, { base, scoreMin: 0 });
      if (r.ok) { agregadas.push(r.personaje); listo = true; break; }
    }
    if (!listo) sumar(rechazos, "sin imagen válida");
  }
  return { agregadas, rechazos };
}

export async function agregarAnimes(cantidad = 5, onSerie) {
  const resumen = [];
  for (let i = 0; i < cantidad; i++) {
    const base = FUENTES[i % FUENTES.length];
    let serie;
    try {
      [serie] = await animesAleatorios(1, base);
    } catch (e) {
      continue;
    }
    if (!serie) continue;
    try {
      const r = await agregarSerie(serie, { base });
      resumen.push({ serie, base, ...r });
      if (onSerie) await onSerie(serie, r, base);
    } catch (e) {
      resumen.push({ serie, base, agregadas: [], rechazos: { "error de consulta": 1 } });
    }
  }
  return resumen;
}

export async function agregarPorLink(link) {
  const p = parseLink(link);
  if (!p) return { ok: false, motivo: "link inválido" };
  let posts = [];
  if (p.tipo === "post") {
    const post = await postPorId(p.id, p.base);
    if (!post) return { ok: false, motivo: "el post no existe o fue eliminado" };
    posts = [post];
  } else if (p.tipo === "pool") {
    const d = await api("/pool/show.json", { id: p.id }, p.base);
    posts = d?.posts || [];
  } else {
    const tags = p.tags.split(/\s+/).filter((t) => t && !t.startsWith("rating:")).concat("rating:safe").join(" ");
    for (let page = 1; page <= 3 && posts.length < MAX_LINK; page++) {
      const l = await api("/post.json", { tags, limit: 40, page }, p.base);
      if (!Array.isArray(l) || !l.length) break;
      posts.push(...l);
      await pausa(300);
    }
  }
  const agregadas = [];
  const rechazos = {};
  for (const post of posts.slice(0, MAX_LINK)) {
    const r = await procesarPost(post, { base: p.base, forzar: true });
    if (r.ok) agregadas.push(r.personaje);
    else sumar(rechazos, r.motivo);
  }
  return { ok: agregadas.length > 0, agregadas, rechazos, motivo: Object.keys(rechazos)[0] || "sin resultados" };
}

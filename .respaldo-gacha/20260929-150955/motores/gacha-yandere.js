// motores/gacha-yandere.js
//
// Proveedor de waifus: yande.re (Moebooru).
//  - SOLO posts con rating "safe" (rating:safe), porque el bot vive en grupos de WhatsApp.
//  - Guarda la URL "sample" (liviana) y no el archivo original.
//  - Incluye el verificador de duplicados (post, md5, padre/hijo y personaje repetido).
import axios from "axios";
import {
  personajePorClave, yandereDuplicado, yandereRegistrar,
  yandereTagTipo, yandereTagGuardar, yandereCrearPersonaje
} from "./gacha-db.js";

const BASE = "https://yande.re";
const UA = "Mozilla/5.0 (compatible; MaxiBot/1.0; +whatsapp-gacha)";
const TIPO = { general: 0, artista: 1, copyright: 3, personaje: 4, circulo: 5, faults: 6 };

const SCORE_MINIMO = 15;
const ANCHO_MINIMO = 600;
const MAX_TAGS_DESCONOCIDOS_POR_POST = 30;
const TAGS_EXCLUIDOS = new Set(["comic", "monochrome", "sketch", "3d", "photo", "screenshot", "text", "manga"]);

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const azar = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function api(ruta, params) {
  const { data } = await axios.get(BASE + ruta, {
    params,
    headers: { "User-Agent": UA, Accept: "application/json" },
    timeout: 20000
  });
  return data;
}

// "https://yande.re/post/show/1234567/tags..." -> 1234567
export function idDesdeLink(texto) {
  if (!texto) return null;
  const m = String(texto).match(/yande\.re\/post\/show\/(\d+)/i);
  if (m) return parseInt(m[1], 10);
  if (/^\d+$/.test(texto.trim())) return parseInt(texto.trim(), 10);
  return null;
}

export async function postPorId(id) {
  const lista = await api("/post.json", { tags: `id:${id}`, limit: 1 });
  return Array.isArray(lista) && lista[0] ? lista[0] : null;
}

// Trae una página al azar de posts "safe". Si la página cae fuera de rango, reintenta más cerca del inicio.
export async function postsAleatorios() {
  const paginas = [azar(1, 400), azar(1, 60), 1];
  for (const page of paginas) {
    const lista = await api("/post.json", { tags: "rating:safe", limit: 40, page });
    if (Array.isArray(lista) && lista.length) {
      for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
      }
      return lista;
    }
  }
  return [];
}

// Tipo de un tag (con cache en SQLite para no volver a preguntar nunca).
async function tipoDeTag(nombre, contador) {
  const guardado = yandereTagTipo(nombre);
  if (guardado !== null) return guardado;
  if (contador.n >= MAX_TAGS_DESCONOCIDOS_POR_POST) return null;
  contador.n++;
  try {
    const lista = await api("/tag.json", { name: nombre, limit: 10 });
    const exacto = Array.isArray(lista) ? lista.find((t) => t.name === nombre) : null;
    const tipo = exacto ? Number(exacto.type) : TIPO.general;
    yandereTagGuardar(nombre, tipo);
    await pausa(200);
    return tipo;
  } catch (e) {
    return null; // sin red / rate limit: no lo cacheamos
  }
}

// Orden de calidad: original -> JPEG de alta calidad -> sample. Las URLs se guardan (no las imágenes)
// y al enviar se prueba en orden hasta que una funcione. El original solo se usa si pesa <= 8 MB.
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
    .replace(/_\([^)]*\)$/, "")   // yui_(k-on!) -> yui
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

// Convierte un post en waifu y la guarda. Devuelve { ok, personaje?, motivo? }
export async function procesarPost(post) {
  const info = {
    post_id: post.id,
    md5: post.md5 || null,
    parent_id: post.parent_id || null
  };

  // 1) Verificador de duplicados (archivo)
  const dup = yandereDuplicado(info);
  if (dup) return { ok: false, motivo: `duplicado (${dup})` };

  // 2) Filtros de contenido
  if (post.rating !== "s") {
    yandereRegistrar({ ...info, estado: "rating" });
    return { ok: false, motivo: "no es rating safe" };
  }
  const tags = String(post.tags || "").split(/\s+/).filter(Boolean);
  if ((post.score ?? 0) < SCORE_MINIMO || (post.width ?? 0) < ANCHO_MINIMO || tags.some((t) => TAGS_EXCLUIDOS.has(t))) {
    yandereRegistrar({ ...info, estado: "sin_personaje" });
    return { ok: false, motivo: "no cumple calidad mínima" };
  }
  const imagenes = elegirImagenes(post);
  if (!imagenes.length) return { ok: false, motivo: "sin archivo" };
  const img = imagenes[0];

  // 3) Identificar personaje y serie por tipo de tag
  const contador = { n: 0 };
  const personajes = [];
  const series = [];
  for (const tag of tags) {
    const tipo = await tipoDeTag(tag, contador);
    if (tipo === TIPO.personaje) personajes.push(tag);
    else if (tipo === TIPO.copyright) series.push(tag);
  }
  if (personajes.length === 0) {
    yandereRegistrar({ ...info, estado: "sin_personaje" });
    return { ok: false, motivo: "sin personaje identificable" };
  }
  if (personajes.length > 1) {
    yandereRegistrar({ ...info, estado: "varios_personajes" });
    return { ok: false, motivo: "varios personajes en la imagen" };
  }

  // 4) Verificador de duplicados (personaje)
  const tagPersonaje = personajes[0];
  if (personajePorClave("waifu", tagPersonaje)) {
    yandereRegistrar({ ...info, estado: "duplicado" });
    return { ok: false, motivo: "personaje ya registrado" };
  }

  const valor = Math.min(30000, Math.max(1000, 1000 + (post.score ?? 0) * 40));
  const genero = tags.includes("1boy") || tags.includes("male_focus") ? "Masculino" : "Femenino";
  const creado = yandereCrearPersonaje({
    categoria: "waifu",
    clave: tagPersonaje,
    nombre: bonito(tagPersonaje),
    serie: series.length ? bonito(series[0]) : "Original / Desconocida",
    genero,
    rareza: rarezaDe(valor),
    valor,
    img,
    meta: { fuente: "yande.re", post: post.id, link: `${BASE}/post/show/${post.id}`, score: post.score ?? 0, alt: imagenes.slice(1) }
  }, info);
  if (!creado) return { ok: false, motivo: "personaje ya registrado" };

  return {
    ok: true,
    personaje: {
      id: creado.id, categoria: "waifu", clave: tagPersonaje, nombre: bonito(tagPersonaje),
      serie: series.length ? bonito(series[0]) : "Original / Desconocida",
      genero, rareza: rarezaDe(valor), valor, img,
      meta: { link: `${BASE}/post/show/${post.id}`, alt: imagenes.slice(1) }
    }
  };
}

// .yanderandom: agrega hasta `cantidad` waifus NUEVAS a partir de posts distintos.
export async function agregarAleatorias(cantidad = 5, { intentosMaximos = 3 } = {}) {
  const agregadas = [];
  const rechazos = {};
  for (let ronda = 0; ronda < intentosMaximos && agregadas.length < cantidad; ronda++) {
    const posts = await postsAleatorios();
    for (const post of posts) {
      if (agregadas.length >= cantidad) break;
      const r = await procesarPost(post);
      if (r.ok) agregadas.push(r.personaje);
      else rechazos[r.motivo] = (rechazos[r.motivo] || 0) + 1;
    }
  }
  return { agregadas, rechazos };
}

// .yandere <link>: agrega UNA waifu concreta.
export async function agregarPorLink(link) {
  const id = idDesdeLink(link);
  if (!id) return { ok: false, motivo: "link inválido" };
  const post = await postPorId(id);
  if (!post) return { ok: false, motivo: "el post no existe o fue eliminado" };
  return procesarPost(post);
}

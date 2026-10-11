import axios from "axios";

const AGENTES = [
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "MaxiBot/1.0 (importador del gacha)"
];
const ESTADOS_REINTENTABLES = new Set([403, 429, 502, 503, 520, 522, 524]);
const TIEMPO_MS = 20000;
const PAUSA_REINTENTO_MS = 1200;

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

const cabeceras = (base, intento) => ({
  "User-Agent": AGENTES[intento % AGENTES.length],
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: `${base}/`
});

async function consultar(base, params) {
  let ultimoError = null;
  for (let intento = 0; intento < AGENTES.length; intento++) {
    try {
      const { data } = await axios.get(`${base}/api.php`, {
        params: { format: "json", formatversion: 2, ...params },
        timeout: TIEMPO_MS,
        family: 4,
        headers: cabeceras(base, intento)
      });
      if (data?.error) throw new Error(data.error.info || data.error.code || "error de la wiki");
      return data;
    } catch (e) {
      ultimoError = e;
      const estado = e.response?.status;
      if (!estado || !ESTADOS_REINTENTABLES.has(estado)) break;
      await pausa(PAUSA_REINTENTO_MS * (intento + 1));
    }
  }
  const estado = ultimoError?.response?.status;
  const detalle = estado ? `Request failed with status code ${estado}` : ultimoError?.message || "error desconocido";
  throw new Error(`${base.replace("https://", "")}: ${detalle}`);
}

export function urlDeArchivo(base, titulo, extension = "png") {
  return `${base}/wiki/Special:FilePath/${encodeURIComponent(String(titulo).replace(/ /g, "_"))}.${extension}`;
}

export async function buscarCategorias(base, texto, limite = 15) {
  const data = await consultar(base, {
    action: "query",
    list: "search",
    srsearch: texto,
    srnamespace: 14,
    srlimit: limite
  });
  return (data.query?.search || []).map((r) => r.title.replace(/^[^:]+:/, ""));
}

export async function paginasPorPatron(base, patron, { maxPaginas = 80, pausaMs = 200 } = {}) {
  const titulos = [];
  let continuar = {};

  for (let i = 0; i < maxPaginas; i++) {
    const data = await consultar(base, {
      action: "query",
      list: "allpages",
      apnamespace: 0,
      apfilterredir: "nonredirects",
      aplimit: 500,
      ...continuar
    });
    for (const pagina of data.query?.allpages || []) if (patron.test(pagina.title)) titulos.push(pagina.title);
    if (!data.continue) break;
    continuar = data.continue;
    await pausa(pausaMs);
  }

  const resultados = [];
  for (let i = 0; i < titulos.length; i += 50) {
    const lote = titulos.slice(i, i + 50);
    const imagenes = new Map();
    try {
      const data = await consultar(base, {
        action: "query",
        titles: lote.join("|"),
        prop: "pageimages",
        piprop: "original",
        pilimit: 50
      });
      for (const pagina of data.query?.pages || []) imagenes.set(pagina.title, pagina.original?.source || null);
    } catch (e) {
      console.log("[gacha] Imágenes omitidas para un lote:", e.message);
    }
    for (const titulo of lote) resultados.push({ titulo, imagen: imagenes.get(titulo) || null });
    await pausa(pausaMs);
  }
  return resultados;
}

const tituloDeCategoria =(categoria) => (/^(Category|Categoría):/i.test(categoria) ? categoria : `Category:${categoria}`);

export async function subcategoriasDe(base, categoria, { maxPaginas = 20, pausaMs = 250 } = {}) {
  const titulo = tituloDeCategoria(categoria);
  const resultados = [];
  let continuar = {};

  for (let i = 0; i < maxPaginas; i++) {
    const data = await consultar(base, {
      action: "query",
      list: "categorymembers",
      cmtitle: titulo,
      cmtype: "subcat",
      cmlimit: 500,
      ...continuar
    });
    for (const miembro of data.query?.categorymembers || []) resultados.push(miembro.title);
    if (!data.continue) break;
    continuar = data.continue;
    await pausa(pausaMs);
  }
  return resultados;
}

export async function miembrosDeCategoriaRecursiva(base, categoria, { profundidad = 3, maxCategorias = 150 } = {}) {
  const pendientes = [{ titulo: categoria, nivel: 0 }];
  const vistas = new Set();
  const paginas = new Map();

  while (pendientes.length && vistas.size < maxCategorias) {
    const { titulo, nivel } = pendientes.shift();
    const clave = tituloDeCategoria(titulo).toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);

    try {
      const miembros = await miembrosDeCategoria(base, titulo);
      for (const miembro of miembros) if (!paginas.has(miembro.titulo)) paginas.set(miembro.titulo, miembro);
      if (nivel < profundidad) {
        for (const sub of await subcategoriasDe(base, titulo)) pendientes.push({ titulo: sub, nivel: nivel + 1 });
      }
    } catch (e) {
      if (nivel === 0) throw e;
      console.log(`[gacha] Subcategoría omitida (${titulo}):`, e.message);
    }
    await pausa(150);
  }

  return { miembros: [...paginas.values()], categorias: vistas.size };
}

export async function miembrosDeCategoria(base, categoria, { maxPaginas = 80, pausaMs = 250 } = {}) {
  const titulo = /^(Category|Categoría):/i.test(categoria) ? categoria : `Category:${categoria}`;
  const resultados = [];
  let continuar = {};

  for (let i = 0; i < maxPaginas; i++) {
    const data = await consultar(base, {
      action: "query",
      generator: "categorymembers",
      gcmtitle: titulo,
      gcmnamespace: 0,
      gcmlimit: 50,
      prop: "pageimages",
      piprop: "original",
      pilimit: 50,
      ...continuar
    });
    for (const pagina of data.query?.pages || []) {
      resultados.push({ titulo: pagina.title, imagen: pagina.original?.source || null });
    }
    if (!data.continue) break;
    continuar = data.continue;
    await pausa(pausaMs);
  }
  return resultados;
}

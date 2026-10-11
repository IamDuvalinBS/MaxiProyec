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

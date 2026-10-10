import axios from "axios";

const CABECERAS = { "User-Agent": "MaxiBot/1.0 (importador del gacha)" };
const TIEMPO_MS = 20000;

const pausa = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

async function consultar(base, params) {
  const { data } = await axios.get(`${base}/api.php`, {
    params: { format: "json", formatversion: 2, ...params },
    timeout: TIEMPO_MS,
    family: 4,
    headers: CABECERAS
  });
  if (data?.error) throw new Error(data.error.info || data.error.code || "error de la wiki");
  return data;
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

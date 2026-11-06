const UA_WEB = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
const UA_APP = "androidapp.stickerly/1.17.0 (Redmi 7A; U; Android 29; in-ID; id;)";
const API_STICKERLY = "https://api.sticker.ly/v4/stickerPack/smartSearch";
const VIDA_HISTORIAL = 12 * 60 * 60 * 1000;
const MAX_HISTORIAL = 400;
const EXTRA_RESPALDO = 4;

const historial = new Map();

const mezclar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

function registroDe(clave) {
  const ahora = Date.now();
  let registro = historial.get(clave);
  if (!registro || ahora - registro.hora > VIDA_HISTORIAL) {
    registro = { hora: ahora, paquetes: new Set(), urls: new Set() };
  }
  registro.hora = ahora;
  historial.delete(clave);
  historial.set(clave, registro);
  if (historial.size > MAX_HISTORIAL) historial.delete(historial.keys().next().value);
  return registro;
}

function unirUrl(prefijo, archivo) {
  return prefijo.endsWith("/") ? prefijo + archivo : prefijo + "/" + archivo;
}

function normalizarPaquete(pack) {
  const prefijo = typeof pack?.resourceUrlPrefix === "string" ? pack.resourceUrlPrefix : "";
  const archivos = Array.isArray(pack?.resourceFiles) ? pack.resourceFiles.filter((f) => typeof f === "string") : [];
  if (!prefijo || !archivos.length) return null;
  return {
    id: String(pack.packId || prefijo),
    nombre: String(pack.name || ""),
    autor: String(pack.authorName || ""),
    animado: Boolean(pack.isAnimated),
    stickers: archivos.map((a) => unirUrl(prefijo, a))
  };
}

export async function buscarPaquetesStickerly(query) {
  const pedir = async (extender) => {
    const res = await fetch(API_STICKERLY, {
      method: "POST",
      headers: { "user-agent": UA_APP, "content-type": "application/json" },
      body: JSON.stringify({
        keyword: query,
        enabledKeywordSearch: true,
        filter: {
          extendSearchResult: extender,
          sortBy: "RECOMMENDED",
          languages: ["ALL"],
          minStickerCount: 5,
          searchBy: "ALL",
          stickerType: "ALL"
        }
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`Sticker.ly respondió HTTP ${res.status}`);
    const datos = await res.json();
    return datos?.result?.stickerPacks || [];
  };

  const respuestas = await Promise.allSettled([pedir(false), pedir(true)]);
  const exitosas = respuestas.filter((r) => r.status === "fulfilled");
  if (!exitosas.length) throw respuestas[0].reason;

  const unicos = new Map();
  for (const { value } of exitosas) {
    for (const crudo of value) {
      const pack = normalizarPaquete(crudo);
      if (pack && pack.stickers.length >= 3 && !unicos.has(pack.id)) unicos.set(pack.id, pack);
    }
  }
  return [...unicos.values()];
}

export async function buscarTenor(query, limite = 60) {
  const slug = encodeURIComponent(String(query).trim().toLowerCase().replace(/\s+/g, "-"));
  const res = await fetch(`https://tenor.com/search/${slug}-stickers`, {
    headers: { "user-agent": UA_WEB, "accept-language": "es,en;q=0.8" },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`Tenor respondió HTTP ${res.status}`);
  const html = (await res.text()).replace(/\\u002F/g, "/").replace(/\\\//g, "/");

  const vistos = new Set();
  for (const m of html.matchAll(/https:\/\/media\.tenor\.com\/[^"'\s\\<>)]+?\.(?:gif|webp)/g)) {
    if (/\/(?:tinygif|nanogif|mini|preview)/i.test(m[0])) continue;
    vistos.add(m[0]);
    if (vistos.size >= limite) break;
  }
  return [...vistos];
}

function desdePaquetes(paquetes, cantidad, registro) {
  let pool = paquetes.filter((p) => !registro.paquetes.has(p.id));
  if (!pool.length) {
    registro.paquetes.clear();
    pool = paquetes;
  }
  const grandes = pool.filter((p) => p.stickers.length >= cantidad);
  const elegido = mezclar(grandes.length ? grandes : pool)[0];
  registro.paquetes.add(elegido.id);

  const urls = mezclar(elegido.stickers).slice(0, cantidad + EXTRA_RESPALDO);
  if (urls.length < cantidad + EXTRA_RESPALDO) {
    const otras = mezclar(paquetes.filter((p) => p.id !== elegido.id).flatMap((p) => p.stickers));
    for (const url of otras) {
      if (urls.length >= cantidad + EXTRA_RESPALDO) break;
      if (!urls.includes(url)) urls.push(url);
    }
  }
  return { urls, fuente: "Sticker.ly", titulo: elegido.nombre, autor: elegido.autor };
}

function desdeTenor(urlsTenor, cantidad, registro) {
  let nuevas = urlsTenor.filter((u) => !registro.urls.has(u));
  if (nuevas.length < Math.min(cantidad, urlsTenor.length)) {
    registro.urls.clear();
    nuevas = urlsTenor;
  }
  const urls = mezclar(nuevas).slice(0, cantidad + EXTRA_RESPALDO);
  for (const u of urls) registro.urls.add(u);
  return { urls, fuente: "Tenor", titulo: "", autor: "" };
}

export async function elegirStickers(query, { cantidad = 10, clave = "" } = {}) {
  const registro = registroDe(`${clave}|${String(query).trim().toLowerCase()}`);
  const errores = [];

  try {
    const paquetes = await buscarPaquetesStickerly(query);
    if (paquetes.length) return desdePaquetes(paquetes, cantidad, registro);
  } catch (e) {
    errores.push(e.message);
  }

  try {
    const urls = await buscarTenor(query);
    if (urls.length) return desdeTenor(urls, cantidad, registro);
  } catch (e) {
    errores.push(e.message);
  }

  if (errores.length) throw new Error(errores.join(" | "));
  return { urls: [], fuente: "", titulo: "", autor: "" };
}

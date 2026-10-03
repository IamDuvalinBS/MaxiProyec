import axios from "axios";

const TIEMPO_ESPERA_MS = 45000;
const LIMITE_BYTES = 95 * 1024 * 1024;
const MAXIMO_PROVEEDORES = 5;
const CLAVES_ENLACE = ["download", "downloadUrl", "download_url", "dl", "url", "link", "audio", "video", "media", "result", "data"];
const CLAVES_TITULO = ["title", "titulo", "name", "filename", "fileName"];
const EXTENSIONES = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  weba: "audio/webm",
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  zip: "application/zip"
};

export const PROVEEDORES_MANUALES = [];

function proveedoresConfigurados() {
  const lista = [...PROVEEDORES_MANUALES];
  for (let i = 1; i <= MAXIMO_PROVEEDORES; i++) {
    const plantilla = process.env[`https://api.alyacore.xyz/dl/spotify?url={entrada}&key={clave}${i}`];
    if (plantilla) {
      lista.push({
        nombre: `Proveedor ${i}`,
        plantilla,
        clave: process.env[`oboe${i}`] || "",
        cabeceras: {}
      });
    }
  }
  return lista;
}

function rellenar(texto, entrada, clave) {
  return String(texto)
    .replaceAll("{entrada}", encodeURIComponent(entrada))
    .replaceAll("{entradaSinCodificar}", entrada)
    .replaceAll("{clave}", encodeURIComponent(clave));
}

function esEnlace(valor) {
  return typeof valor === "string" && /^https?:\/\//i.test(valor);
}

function prioridad(clave) {
  const indice = CLAVES_ENLACE.indexOf(clave);
  return indice === -1 ? CLAVES_ENLACE.length : indice;
}

function recolectarEnlaces(nodo, salida, profundidad = 0) {
  if (nodo == null || profundidad > 6) return;
  if (esEnlace(nodo)) {
    salida.push(nodo);
    return;
  }
  if (Array.isArray(nodo)) {
    nodo.forEach((elemento) => recolectarEnlaces(elemento, salida, profundidad + 1));
    return;
  }
  if (typeof nodo === "object") {
    Object.keys(nodo)
      .sort((a, b) => prioridad(a) - prioridad(b))
      .forEach((clave) => recolectarEnlaces(nodo[clave], salida, profundidad + 1));
  }
}

function elegirEnlace(json) {
  const enlaces = [];
  recolectarEnlaces(json, enlaces);
  const sinImagenes = enlaces.filter((enlace) => !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(enlace));
  return sinImagenes[0] || enlaces[0] || null;
}

function buscarTitulo(nodo, profundidad = 0) {
  if (nodo == null || typeof nodo !== "object" || profundidad > 5) return null;
  for (const clave of CLAVES_TITULO) {
    if (typeof nodo[clave] === "string" && nodo[clave].trim()) return nodo[clave].trim();
  }
  const hijos = Array.isArray(nodo) ? nodo : Object.values(nodo);
  for (const hijo of hijos) {
    const titulo = buscarTitulo(hijo, profundidad + 1);
    if (titulo) return titulo;
  }
  return null;
}

function extensionDe(enlace) {
  try {
    const ruta = new URL(enlace).pathname;
    const coincidencia = ruta.match(/\.([a-z0-9]{2,5})$/i);
    return coincidencia ? coincidencia[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

function tipoGenerico(tipo) {
  return !tipo || tipo === "application/octet-stream" || tipo === "binary/octet-stream";
}

function esArchivo(tipo) {
  return /^(audio|video|image)\//.test(tipo) || tipoGenerico(tipo) || tipo === "application/pdf" || tipo === "application/zip";
}

function limpiarNombre(texto) {
  return String(texto).replace(/[\\/:*?"<>|\n\r]/g, "").trim().slice(0, 120) || "archivo";
}

function empaquetar(buffer, tipoRecibido, enlace, titulo, proveedor) {
  const extension = extensionDe(enlace);
  let mimetype = tipoRecibido;
  if (tipoGenerico(mimetype)) {
    mimetype = (extension && EXTENSIONES[extension]) || "application/octet-stream";
  }
  const categoria = mimetype.startsWith("audio/") ? "audio" : mimetype.startsWith("video/") ? "video" : mimetype.startsWith("image/") ? "imagen" : "documento";
  const extensionFinal = extension || Object.keys(EXTENSIONES).find((clave) => EXTENSIONES[clave] === mimetype) || "bin";
  const base = limpiarNombre(titulo || "archivo");
  return { buffer, mimetype, categoria, titulo: titulo || base, nombreArchivo: `${base}.${extensionFinal}`, proveedor };
}

async function pedir(url, cabeceras) {
  return axios.get(url, {
    responseType: "arraybuffer",
    timeout: TIEMPO_ESPERA_MS,
    maxContentLength: LIMITE_BYTES,
    maxBodyLength: LIMITE_BYTES,
    headers: cabeceras,
    validateStatus: (estado) => estado >= 200 && estado < 300
  });
}

async function ejecutarProveedor(proveedor, entrada) {
  const urlFinal = rellenar(proveedor.plantilla, entrada, proveedor.clave || "");
  const cabeceras = { "User-Agent": "Mozilla/5.0" };
  for (const [nombre, valor] of Object.entries(proveedor.cabeceras || {})) {
    cabeceras[nombre] = rellenar(valor, entrada, proveedor.clave || "");
  }

  const respuesta = await pedir(urlFinal, cabeceras);
  const tipo = String(respuesta.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  const cuerpo = Buffer.from(respuesta.data);

  if (esArchivo(tipo) && !tipo.includes("json") && !tipo.includes("text")) {
    return empaquetar(cuerpo, tipo, urlFinal, null, proveedor.nombre);
  }

  let json;
  try {
    json = JSON.parse(cuerpo.toString("utf8"));
  } catch {
    throw new Error("La API devolvió una respuesta no reconocida.");
  }

  const enlace = elegirEnlace(json);
  if (!enlace) throw new Error("La API no devolvió ningún enlace de descarga.");

  const titulo = buscarTitulo(json);
  const archivo = await pedir(enlace, { "User-Agent": "Mozilla/5.0" });
  const tipoArchivo = String(archivo.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  return empaquetar(Buffer.from(archivo.data), tipoArchivo, enlace, titulo, proveedor.nombre);
}

export function hayProveedores() {
  return proveedoresConfigurados().length > 0;
}

export async function descargarConApi(entrada) {
  const proveedores = proveedoresConfigurados();
  if (!proveedores.length) {
    throw new Error("No hay ninguna API configurada para las descargas.");
  }
  const errores = [];
  for (const proveedor of proveedores) {
    try {
      return await ejecutarProveedor(proveedor, entrada);
    } catch (e) {
      errores.push(`${proveedor.nombre}: ${e.message}`);
    }
  }
  throw new Error(`No se pudo completar la descarga. ${errores.join(" | ")}`);
}

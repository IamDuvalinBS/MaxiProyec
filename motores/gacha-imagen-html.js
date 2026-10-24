import axios from "axios";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const LIMITE_CACHE = 400;
const LIMITE_SIN_COMPACTAR = 120 * 1024;
const cache = new Map();

function guardar(clave, valor) {
  if (cache.size >= LIMITE_CACHE) cache.delete(cache.keys().next().value);
  cache.set(clave, valor);
  return valor;
}

function aDataUri(buffer, tipo) {
  return `data:${tipo};base64,${Buffer.from(buffer).toString("base64")}`;
}

function dibujar(imagen, { ancho, alto, modo, fondo, formato, calidad }) {
  const lienzo = createCanvas(ancho, alto);
  const ctx = lienzo.getContext("2d");
  if (fondo) {
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, ancho, alto);
  }
  const escala = modo === "cover"
    ? Math.max(ancho / imagen.width, alto / imagen.height)
    : Math.min(ancho / imagen.width, alto / imagen.height);
  const w = imagen.width * escala;
  const h = imagen.height * escala;
  const x = (ancho - w) / 2;
  const y = modo === "cover" ? Math.min(0, (alto - h) * 0.25) : (alto - h) / 2;
  ctx.drawImage(imagen, x, y, w, h);
  return formato === "png"
    ? aDataUri(lienzo.toBuffer("image/png"), "image/png")
    : aDataUri(lienzo.toBuffer("image/jpeg", calidad), "image/jpeg");
}

export async function imagenCompacta(url, opciones = {}) {
  if (!url || typeof url !== "string") return "";
  const o = { ancho: 180, alto: 240, modo: "cover", fondo: "#120a24", formato: "jpeg", calidad: 72, ...opciones };
  const clave = `${url}|${o.ancho}x${o.alto}|${o.modo}|${o.formato}`;
  if (cache.has(clave)) return cache.get(clave);

  try {
    const { data, headers } = await axios.get(url, { responseType: "arraybuffer", timeout: 9000, headers: { "User-Agent": "MaxiBot/1.0" } });
    try {
      const imagen = await loadImage(Buffer.from(data));
      return guardar(clave, dibujar(imagen, o));
    } catch {
      if (data.byteLength <= LIMITE_SIN_COMPACTAR) {
        return guardar(clave, aDataUri(data, String(headers["content-type"] || "image/png").split(";")[0]));
      }
      return "";
    }
  } catch {
    return "";
  }
}

export async function imagenesCompactas(urls, opciones = {}, simultaneas = 8) {
  const salida = new Array(urls.length).fill("");
  for (let i = 0; i < urls.length; i += simultaneas) {
    const lote = urls.slice(i, i + simultaneas);
    const resultado = await Promise.all(lote.map((u) => imagenCompacta(u, opciones)));
    resultado.forEach((r, j) => { salida[i + j] = r; });
  }
  return salida;
}

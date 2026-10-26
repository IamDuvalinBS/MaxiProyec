import axios from "axios";
import fs from "fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { rutaImagenCacheada } from "./cache-medios.js";
import { leerMiniatura, guardarMiniatura } from "./gacha-miniaturas.js";

const LIMITE_CACHE = 1500;
const TIEMPO_DESCARGA_MS = Number(process.env.GACHA_T_PERFIL_IMAGEN_MS) || 6000;
const PRESUPUESTO_TOTAL_MS = Number(process.env.GACHA_T_PERFIL_TOTAL_MS) || 12000;
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
  const clave = `${url}|${o.ancho}x${o.alto}|${o.modo}|${o.formato}|${o.fondo}|${o.calidad}`;
  if (cache.has(clave)) return cache.get(clave);

  const enDisco = await leerMiniatura(clave);
  if (enDisco) return guardar(clave, enDisco);

  try {
    const local = rutaImagenCacheada(url);
    let data;
    let headers = {};
    if (local) {
      data = await fs.promises.readFile(local);
    } else {
      ({ data, headers } = await axios.get(url, { responseType: "arraybuffer", timeout: TIEMPO_DESCARGA_MS, headers: { "User-Agent": "MaxiBot/1.0" } }));
    }
    try {
      const imagen = await loadImage(Buffer.from(data));
      const uri = guardar(clave, dibujar(imagen, o));
      guardarMiniatura(clave, uri);
      return uri;
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

export async function imagenesCompactas(urls, opciones = {}, simultaneas = 12, presupuestoMs = PRESUPUESTO_TOTAL_MS) {
  const salida = new Array(urls.length).fill("");
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < urls.length) {
      const i = siguiente++;
      salida[i] = await imagenCompacta(urls[i], opciones);
    }
  };
  const trabajadores = Promise.all(Array.from({ length: Math.min(simultaneas, urls.length) }, trabajador));
  let temporizador;
  const limite = new Promise((resolver) => {
    temporizador = setTimeout(resolver, presupuestoMs);
  });
  try {
    await Promise.race([trabajadores, limite]);
  } finally {
    clearTimeout(temporizador);
  }
  return salida.slice();
}

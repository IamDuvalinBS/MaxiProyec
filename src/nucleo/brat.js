import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { correrFfmpeg, conTemporal } from "./ffmpeg.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LADO = 512;
const MARGEN = 26;
const TAM_MAX = 170;
const TAM_MIN = 22;
const DESENFOQUE = 2;

export const MAX_PALABRAS_BRAT = 30;
export const MAX_CARACTERES_BRAT = 200;

const COLORES = {
  verde: { fondo: "#8ACE00", texto: "#000000", alias: ["verde", "green", "brat"] },
  blanco: { fondo: "#FFFFFF", texto: "#000000", alias: ["blanco", "white"] },
  negro: { fondo: "#000000", texto: "#FFFFFF", alias: ["negro", "black"] },
  rosa: { fondo: "#FF9ECF", texto: "#000000", alias: ["rosa", "pink"] },
  azul: { fondo: "#5CC8FF", texto: "#000000", alias: ["azul", "blue"] },
  rojo: { fondo: "#FF4D4D", texto: "#000000", alias: ["rojo", "red"] },
  morado: { fondo: "#C79BFF", texto: "#000000", alias: ["morado", "purple"] },
  naranja: { fondo: "#FFB347", texto: "#000000", alias: ["naranja", "orange"] },
  amarillo: { fondo: "#FFE94D", texto: "#000000", alias: ["amarillo", "yellow"] }
};

export const NOMBRES_COLORES = Object.keys(COLORES);

export function resolverColor(token) {
  const t = String(token || "").trim().toLowerCase();
  if (!t) return null;
  return NOMBRES_COLORES.find((n) => COLORES[n].alias.includes(t)) || null;
}

const CANDIDATAS = [
  [path.join(RAIZ, "assets/fonts/brat.ttf"), 1],
  [path.join(RAIZ, "assets/fonts/brat.otf"), 1],
  ["/system/fonts/RobotoCondensed-Regular.ttf", 1],
  ["/usr/share/fonts/truetype/liberation/LiberationSansNarrow-Regular.ttf", 1],
  ["/usr/share/fonts/truetype/liberation2/LiberationSansNarrow-Regular.ttf", 1],
  ["/system/fonts/Roboto-Regular.ttf", 0.86],
  ["/system/fonts/Roboto[wdth,wght].ttf", 0.86],
  ["/system/fonts/RobotoStatic-Regular.ttf", 0.86],
  ["/system/fonts/DroidSans.ttf", 0.86],
  ["/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 0.86],
  ["/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf", 0.86],
  ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 0.84]
];

let fuenteCache = null;

function fuente() {
  if (fuenteCache) return fuenteCache;
  for (const [ruta, ancho] of CANDIDATAS) {
    if (!fs.existsSync(ruta)) continue;
    try {
      if (GlobalFonts.registerFromPath(ruta, "BratFont")) {
        fuenteCache = { familia: "BratFont", ancho };
        return fuenteCache;
      }
    } catch (e) {}
  }
  fuenteCache = { familia: "sans-serif", ancho: 0.86 };
  return fuenteCache;
}

function disponer(ctx, palabras, tam, f) {
  const maxAncho = LADO - MARGEN * 2;
  ctx.font = `${tam}px "${f.familia}"`;
  const medir = (t) => ctx.measureText(t).width * f.ancho;
  const espacio = medir(" ");
  const lineas = [];
  let actual = [];
  let anchoActual = 0;
  for (const palabra of palabras) {
    const w = medir(palabra);
    if (w > maxAncho) return null;
    const nuevo = actual.length ? anchoActual + espacio + w : w;
    if (actual.length && nuevo > maxAncho) {
      lineas.push(actual);
      actual = [{ palabra, w }];
      anchoActual = w;
    } else {
      actual.push({ palabra, w });
      anchoActual = nuevo;
    }
  }
  if (actual.length) lineas.push(actual);
  return { lineas, espacio, maxAncho };
}

function ajustar(ctx, palabras, f) {
  const altoMax = LADO - MARGEN * 2;
  for (let tam = TAM_MAX; tam >= TAM_MIN; tam -= 2) {
    const d = disponer(ctx, palabras, tam, f);
    if (d && d.lineas.length * tam * 1.02 <= altoMax) return { tam, ...d };
  }
  return null;
}

function desenfocar(origen, radio) {
  const destino = createCanvas(LADO, LADO);
  const ctx = destino.getContext("2d");
  const filtro = `blur(${radio}px)`;
  ctx.filter = filtro;
  if (ctx.filter === filtro) {
    ctx.drawImage(origen, 0, 0);
    return destino;
  }
  ctx.filter = "none";
  const pequeno = createCanvas(LADO / 2, LADO / 2);
  const pctx = pequeno.getContext("2d");
  pctx.imageSmoothingQuality = "high";
  pctx.drawImage(origen, 0, 0, LADO / 2, LADO / 2);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(pequeno, 0, 0, LADO, LADO);
  return destino;
}

async function dibujar(palabras, colorClave) {
  const color = COLORES[colorClave] || COLORES.verde;
  const f = fuente();
  const texto = createCanvas(LADO, LADO);
  const tctx = texto.getContext("2d");
  const ajuste = ajustar(tctx, palabras, f);
  if (ajuste) {
    const { tam, lineas, espacio, maxAncho } = ajuste;
    tctx.font = `${tam}px "${f.familia}"`;
    tctx.fillStyle = color.texto;
    tctx.textBaseline = "top";
    lineas.forEach((linea, i) => {
      const y = MARGEN + i * tam * 1.02;
      const suma = linea.reduce((a, p) => a + p.w, 0);
      const justificar = i < lineas.length - 1 && linea.length > 1;
      const hueco = justificar ? (maxAncho - suma) / (linea.length - 1) : espacio;
      let x = MARGEN;
      for (const { palabra, w } of linea) {
        tctx.save();
        tctx.scale(f.ancho, 1);
        tctx.fillText(palabra, x / f.ancho, y);
        tctx.restore();
        x += w + hueco;
      }
    });
  }
  const lienzo = createCanvas(LADO, LADO);
  const ctx = lienzo.getContext("2d");
  ctx.fillStyle = color.fondo;
  ctx.fillRect(0, 0, LADO, LADO);
  ctx.drawImage(desenfocar(texto, DESENFOQUE), 0, 0);
  return Buffer.from(await lienzo.encode("png"));
}

export function palabrasBrat(texto) {
  return String(texto || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((p) => (p.length > 40 ? p.slice(0, 40) : p));
}

export async function crearBratImagen(texto, color = "verde") {
  return dibujar(palabrasBrat(texto), color);
}

async function framesAVideo(dir, cantidad, porPalabra, pausaFinal) {
  const lista = path.join(dir, "lista.txt");
  const filas = ["ffconcat version 1.0"];
  for (let i = 0; i < cantidad; i++) {
    filas.push(`file 'f${i}.png'`, `duration ${i === cantidad - 1 ? pausaFinal : porPalabra}`);
  }
  filas.push(`file 'f${cantidad - 1}.png'`);
  await fs.promises.writeFile(lista, filas.join("\n"));

  const mp4 = path.join(dir, "salida.mp4");
  try {
    await correrFfmpeg([
      "-f", "concat", "-safe", "0", "-i", lista,
      "-vf", `fps=15,scale=${LADO}:${LADO},format=yuv420p`,
      "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-an",
      "-movflags", "+faststart", mp4
    ]);
    return fs.promises.readFile(mp4);
  } catch (e) {
    const gif = path.join(dir, "salida.gif");
    await correrFfmpeg([
      "-f", "concat", "-safe", "0", "-i", lista,
      "-vf", "fps=15,split[a][b];[a]palettegen[p];[b][p]paletteuse",
      "-loop", "0", gif
    ]);
    return fs.promises.readFile(gif);
  }
}

export async function crearBratAnimado(texto, color = "verde") {
  const palabras = palabrasBrat(texto).slice(0, MAX_PALABRAS_BRAT);
  if (!palabras.length) throw new Error("Texto vacío");
  const porPalabra = Math.min(0.55, 3.4 / palabras.length).toFixed(3);
  return conTemporal("bratv", async (dir) => {
    for (let i = 0; i < palabras.length; i++) {
      await fs.promises.writeFile(path.join(dir, `f${i}.png`), await dibujar(palabras.slice(0, i + 1), color));
    }
    return framesAVideo(dir, palabras.length, porPalabra, 1.5);
  });
}

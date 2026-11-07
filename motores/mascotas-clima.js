import axios from "axios";
import { CIUDAD, LLUVIA_MINIMA_MM } from "./mascotas-datos.js";

const VIGENCIA_MS = 10 * 60 * 1000;
const HORA_MS = 3600000;
const CODIGOS_LLUVIA = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

let cache = null;
let pendiente = null;

async function descargar() {
  const url = "https://api.open-meteo.com/v1/forecast"
    + `?latitude=${CIUDAD.lat}&longitude=${CIUDAD.lon}`
    + "&current=precipitation,weather_code,temperature_2m"
    + "&hourly=precipitation&past_days=3&forecast_days=1"
    + "&timezone=GMT&timeformat=unixtime";
  const { data } = await axios.get(url, { timeout: 7000 });
  const horas = new Map();
  const tiempos = data?.hourly?.time || [];
  const lluvias = data?.hourly?.precipitation || [];
  tiempos.forEach((s, i) => horas.set(s * 1000, Number(lluvias[i]) || 0));
  const actual = data?.current || {};
  return {
    obtenido: Date.now(),
    horas,
    actualMm: Number(actual.precipitation) || 0,
    codigo: Number(actual.weather_code),
    temperatura: Number.isFinite(actual.temperature_2m) ? actual.temperature_2m : null
  };
}

export async function obtenerClima() {
  if (cache && Date.now() - cache.obtenido < VIGENCIA_MS) return armar(cache, true);
  if (!pendiente) {
    pendiente = descargar()
      .then((c) => { cache = c; })
      .catch((e) => { console.log("[mascotas-clima] " + e.message); })
      .finally(() => { pendiente = null; });
  }
  await pendiente;
  return armar(cache, Boolean(cache));
}

function armar(datos, disponible) {
  if (!datos) {
    return { disponible: false, llueve: false, ciudad: CIUDAD.nombre, temperatura: null, precipitacionEn: () => 0 };
  }
  const ahora = Date.now();
  const llueve = datos.actualMm >= LLUVIA_MINIMA_MM || CODIGOS_LLUVIA.has(datos.codigo);
  const precipitacionEn = (ts) => {
    if (ts >= datos.obtenido - HORA_MS) return llueve ? Math.max(datos.actualMm, LLUVIA_MINIMA_MM) : 0;
    const hora = Math.ceil(ts / HORA_MS) * HORA_MS;
    return datos.horas.get(hora) || 0;
  };
  return {
    disponible: disponible && ahora - datos.obtenido < 6 * HORA_MS,
    llueve,
    ciudad: CIUDAD.nombre,
    temperatura: datos.temperatura,
    precipitacionEn
  };
}

const CODIGOS_NIEVE = new Set([71, 73, 75, 77, 85, 86]);
const CODIGOS_TORMENTA = new Set([95, 96, 99]);
const CODIGOS_NIEBLA = new Set([45, 48]);

let cacheZonas = null;
let pendienteZonas = null;

function clasificar(c) {
  const codigo = Number(c.weather_code);
  const precipitacion = Number(c.precipitation) || 0;
  let tipo = "despejado";
  if ((Number(c.snowfall) || 0) > 0 || CODIGOS_NIEVE.has(codigo)) tipo = "nieve";
  else if (CODIGOS_TORMENTA.has(codigo)) tipo = "tormenta";
  else if (precipitacion >= LLUVIA_MINIMA_MM || CODIGOS_LLUVIA.has(codigo)) tipo = "lluvia";
  else if (CODIGOS_NIEBLA.has(codigo)) tipo = "niebla";
  else if ((Number(c.cloud_cover) || 0) >= 70 || codigo === 3) tipo = "nublado";
  return {
    disponible: true,
    tipo,
    temperatura: Number.isFinite(c.temperature_2m) ? c.temperature_2m : null,
    esDia: c.is_day !== 0,
    nubes: Number(c.cloud_cover) || 0
  };
}

const SIN_DATOS = { disponible: false, tipo: "despejado", temperatura: null, esDia: true, nubes: 0 };

async function descargarZonas(zonas) {
  const url = "https://api.open-meteo.com/v1/forecast"
    + `?latitude=${zonas.map((z) => z.lat).join(",")}&longitude=${zonas.map((z) => z.lon).join(",")}`
    + "&current=temperature_2m,precipitation,snowfall,weather_code,cloud_cover,is_day&timezone=GMT";
  const { data } = await axios.get(url, { timeout: 8000 });
  const lista = Array.isArray(data) ? data : [data];
  const salida = { obtenido: Date.now() };
  zonas.forEach((z, i) => {
    if (lista[i]?.current) salida[z.id] = clasificar(lista[i].current);
  });
  return salida;
}

export async function obtenerClimaZonas(zonas) {
  const lista = Object.values(zonas);
  if (!cacheZonas || Date.now() - cacheZonas.obtenido >= VIGENCIA_MS) {
    if (!pendienteZonas) {
      pendienteZonas = descargarZonas(lista)
        .then((c) => { cacheZonas = c; })
        .catch((e) => { console.log("[mascotas-clima] zonas: " + e.message); })
        .finally(() => { pendienteZonas = null; });
    }
    await pendienteZonas;
  }
  const salida = {};
  for (const z of lista) salida[z.id] = cacheZonas?.[z.id] && Date.now() - cacheZonas.obtenido < 6 * HORA_MS ? cacheZonas[z.id] : SIN_DATOS;
  return salida;
}

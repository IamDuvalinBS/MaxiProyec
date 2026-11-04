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

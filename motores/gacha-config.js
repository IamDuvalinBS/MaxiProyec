export const ZONA_HORARIA = "America/Mexico_City";

export const COOLDOWN_TIRADA_MS = 20 * 60 * 1000;

export const RANGO_RAREZA = {
  "Común": 1,
  "Poco común": 2,
  "Rara": 3,
  "Súper rara": 4,
  "Épica": 5,
  "Mítica": 6,
  "Legendaria": 7,
  "Ultra legendaria": 8
};

export const rangoDeRareza = (rareza) => RANGO_RAREZA[rareza] || 1;

export const PITY_TIRADAS = 25;
export const PITY_RANGO_MINIMO = 5;
export const PROBABILIDAD_BANNER = 0.12;

export function semilla(texto) {
  let h = 2166136261;
  for (const c of String(texto)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export function fechaLocal(ms = Date.now()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(ms));
  return partes;
}

export const claveDia = (ms = Date.now()) => Number(fechaLocal(ms).replace(/-/g, ""));

function diasDesdeEpoca(ms = Date.now()) {
  const [a, m, d] = fechaLocal(ms).split("-").map(Number);
  return Math.floor(Date.UTC(a, m - 1, d) / 86400000);
}

export const claveSemana = (ms = Date.now()) => Math.floor((diasDesdeEpoca(ms) + 3) / 7);

export const msHastaMedianoche = (ms = Date.now()) => Math.max(0, 86400000 - horaDelDiaMs(ms));

function horaDelDiaMs(ms) {
  const f = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONA_HORARIA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).format(new Date(ms));
  const [h, mi, s] = f.split(":").map(Number);
  return ((h * 60 + mi) * 60 + s) * 1000;
}

export function msHastaLunes(ms = Date.now()) {
  const dias = diasDesdeEpoca(ms);
  const faltan = (Math.floor((dias + 3) / 7) + 1) * 7 - 3 - dias;
  return faltan * 86400000 - horaDelDiaMs(ms);
}

import { config, saveConfig, CURRENCY } from "../../motores/db.js";

// ─────────────────────────────────────────────────────────────
//  SISTEMA DE EVENTOS / TEMAS DE LA ECONOMÍA
//  Solo cambia la PRESENTACIÓN (textos, emojis, ilustraciones).
//  Base de datos, saldos, rachas, cooldowns, premios y
//  probabilidades son SIEMPRE los mismos en cualquier evento.
// ─────────────────────────────────────────────────────────────

export const EVENTOS = {
  normal: {
    clave: "normal",
    nombre: "Normal",
    emoji: "🌸",
    alias: ["normal", "default", "estandar", "original", "base"]
  },
  halloween: {
    clave: "halloween",
    nombre: "Halloween",
    emoji: "🎃",
    alias: ["halloween", "hallowen", "haloween", "jalogüin", "jalogüin", "jaloguin", "noche de brujas", "nochedebrujas", "brujas"]
  }
};

const sinAcentos = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function buscarEvento(texto) {
  const limpio = sinAcentos(texto);
  if (!limpio) return null;
  return Object.values(EVENTOS).find((e) => e.alias.some((a) => sinAcentos(a) === limpio)) || null;
}

export function eventoActivo() {
  const clave = sinAcentos(config.evento);
  return EVENTOS[clave] ? clave : "normal";
}

export function esHalloween() {
  return eventoActivo() === "halloween";
}

// Cambia el evento activo y lo guarda en la base de datos (sobrevive reinicios).
export async function cambiarEvento(clave) {
  if (!EVENTOS[clave]) return false;
  config.evento = clave;
  await saveConfig();
  return true;
}

// Devuelve el estilo vigente. El estilo de evento se superpone al normal,
// así que un evento puede definir solo lo que cambia.
//   const E = estilo({ normal: { ... }, halloween: { ... } });
export function estilo(estilos) {
  const base = estilos.normal || {};
  const evento = estilos[eventoActivo()];
  return evento && evento !== base ? { ...base, ...evento } : base;
}

// Nombre de la moneda que se ve en pantalla (el valor guardado no cambia).
export function moneda() {
  return esHalloween() ? "🎃 Calabazas" : CURRENCY;
}

const BANDAS_HALLOWEEN = [
  "🕸️ 🦇 🎃 🦇 🕸️",
  "🦇 🌙 👻 🌙 🦇",
  "🕯️ 💀 🎃 💀 🕯️",
  "🕷️ 🕸️ 🧙‍♀️ 🕸️ 🕷️",
  "🪦 🦉 🎃 🦉 🪦"
];

const CIERRES_HALLOWEEN = [
  "🕯️ 👻 🕯️",
  "🦇 🍬 🦇",
  "🕸️ 🎃 🕸️",
  "🌙 🐈‍⬛ 🌙"
];

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

export function bandaSuperior() {
  return esHalloween() ? azar(BANDAS_HALLOWEEN) : null;
}

export function bandaInferior() {
  return esHalloween() ? azar(CIERRES_HALLOWEEN) : null;
}

import { cantidadItem, sumarItem } from "./gacha-db.js";
import { PITY_TIRADAS, PROBABILIDAD_BANNER } from "./gacha-config.js";

// Reliquias exclusivas de la temporada Halloween 2026. Solo se consiguen con las insignias del evento.
export const RELIQUIAS = [
  { id: "linterna", emoji: "🏮", nombre: "Linterna Eterna", efecto: "+50% de fragmentos al reclamar un personaje repetido (en todos los gachas)." },
  { id: "telarana", emoji: "🕸️", nombre: "Telaraña del Destino", efecto: "La garantía se activa a las 18 tiradas en vez de 25 (en todos los gachas)." },
  { id: "corona", emoji: "👑", nombre: "Corona del Señor de Halloween", efecto: "Tiradas con 30% menos de espera y el doble de probabilidad del destacado semanal." }
];

const clave = (id) => `reliquia:${id}`;
export const reliquiaPorId = (id) => RELIQUIAS.find((r) => r.id === id) || null;
export const tieneReliquia = (usuario, id) => cantidadItem(usuario, clave(id)) > 0;

export function darReliquia(usuario, id) {
  if (!reliquiaPorId(id) || tieneReliquia(usuario, id)) return false;
  sumarItem(usuario, clave(id), 1);
  return true;
}

export const reliquiasDe = (usuario) => RELIQUIAS.filter((r) => tieneReliquia(usuario, r.id));

export const multFragmentos = (usuario) => (tieneReliquia(usuario, "linterna") ? 1.5 : 1);
export const pityMaximoDe = (usuario) => (tieneReliquia(usuario, "telarana") ? 18 : PITY_TIRADAS);
export const factorCooldown = (usuario) => (tieneReliquia(usuario, "corona") ? 0.7 : 1);
export const probBannerDe = (usuario) => (tieneReliquia(usuario, "corona") ? Math.min(0.5, PROBABILIDAD_BANNER * 2) : PROBABILIDAD_BANNER);

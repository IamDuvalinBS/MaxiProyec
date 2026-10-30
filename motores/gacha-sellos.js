import { cantidadItem, sumarItem } from "./gacha-db.js";

export const NOMBRE_SELLO = "Sello de Reclamo";
export const NOMBRE_SELLOS = "Sellos de Reclamo";
export const EMOJI_SELLO = "🔖";
export const CATEGORIA_CON_SELLO = "waifu";
export const SELLOS_INICIALES = 5;
export const SELLOS_MAXIMOS = 50;
export const PROBABILIDAD_SELLO = 0.65;

const ITEM = "sello:reclamo";
const ITEM_INICIO = "sello:inicio";

export const requiereSello = (categoria) => categoria === CATEGORIA_CON_SELLO;

function asegurarInicio(usuario) {
  if (cantidadItem(usuario, ITEM_INICIO)) return;
  sumarItem(usuario, ITEM_INICIO, 1);
  sumarItem(usuario, ITEM, SELLOS_INICIALES);
}

export function sellosDe(usuario) {
  asegurarInicio(usuario);
  return cantidadItem(usuario, ITEM);
}

export function darSellos(usuario, cantidad) {
  const actual = sellosDe(usuario);
  const sumar = Math.max(0, Math.min(cantidad, SELLOS_MAXIMOS - actual));
  if (sumar) sumarItem(usuario, ITEM, sumar);
  return { agregados: sumar, total: actual + sumar };
}

export function gastarSello(usuario) {
  if (sellosDe(usuario) < 1) return false;
  sumarItem(usuario, ITEM, -1);
  return true;
}

export function sorteoSello(usuario) {
  if (Math.random() >= PROBABILIDAD_SELLO) return false;
  return darSellos(usuario, 1).agregados > 0;
}

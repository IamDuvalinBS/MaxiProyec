import { cantidadItem, sumarItem, fijarCantidadItem, usuariosConItem } from "./gacha-db.js";
import { probSelloExtra } from "./gacha-reliquias.js";

export const NOMBRE_SELLO = "Sello de Reclamo";
export const NOMBRE_SELLOS = "Sellos de Reclamo";
export const EMOJI_SELLO = "🔖";
export const CATEGORIA_CON_SELLO = "waifu";
export const SELLOS_INICIALES = 3;
export const SELLOS_MAXIMOS = 50;
export const PROBABILIDAD_SELLO = 0.25;
export const VERSION_REINICIO_SELLOS = 2;

const ITEM = "sello:reclamo";
const ITEM_INICIO = "sello:inicio";

export const requiereSello = (categoria) => categoria === CATEGORIA_CON_SELLO;

function asegurarInicio(usuario) {
  if (cantidadItem(usuario, ITEM_INICIO) >= VERSION_REINICIO_SELLOS) return;
  fijarCantidadItem(usuario, ITEM, SELLOS_INICIALES);
  fijarCantidadItem(usuario, ITEM_INICIO, VERSION_REINICIO_SELLOS);
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

export const probabilidadSelloDe = (usuario) => Math.min(1, PROBABILIDAD_SELLO + probSelloExtra(usuario));

export function sorteoSello(usuario) {
  if (Math.random() >= probabilidadSelloDe(usuario)) return false;
  return darSellos(usuario, 1).agregados > 0;
}

export function reiniciarSellos(cantidad = SELLOS_INICIALES) {
  const usuarios = new Set([...usuariosConItem(ITEM), ...usuariosConItem(ITEM_INICIO)]);
  for (const usuario of usuarios) {
    fijarCantidadItem(usuario, ITEM, cantidad);
    fijarCantidadItem(usuario, ITEM_INICIO, VERSION_REINICIO_SELLOS);
  }
  return usuarios.size;
}

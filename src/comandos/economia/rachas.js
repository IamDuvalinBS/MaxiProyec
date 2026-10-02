import { getAccount, saveAccount } from "../../motores/db.js";

export const RACHA_MAXIMA = 365;
export const COSTO_BASE = 50000;
export const COSTO_POR_DIA = 20000;

export function textoDias(cantidad) {
  return `${cantidad} ${cantidad === 1 ? "día" : "días"}`;
}

export function costoRecuperar(cantidad) {
  return COSTO_BASE + Math.max(0, cantidad - 1) * COSTO_POR_DIA;
}

export function estadoRacha(sender, clave, ventanaMs) {
  const registro = getAccount(sender).rachas[clave];
  if (!registro || !registro.cantidad) return { cantidad: 0, perdida: false };
  const perdida = Date.now() - registro.ultimo > ventanaMs;
  return { cantidad: registro.cantidad, perdida };
}

export function registrarReclamo(sender, clave, reiniciar = false) {
  const cuenta = getAccount(sender);
  const previa = reiniciar ? 0 : cuenta.rachas[clave]?.cantidad || 0;
  const cantidad = Math.min(RACHA_MAXIMA, previa + 1);
  const completoMaximo = previa < RACHA_MAXIMA && cantidad === RACHA_MAXIMA;
  cuenta.rachas[clave] = { cantidad, ultimo: Date.now() };
  saveAccount(sender);
  return { cantidad, completoMaximo };
}

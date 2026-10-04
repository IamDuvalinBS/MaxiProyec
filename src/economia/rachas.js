import { datosDe, guardarDatos, registrarAviso, cantidadDeRacha } from "../../motores/almacen-local.js";

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
  const cuenta = datosDe(sender);
  const cantidad = cantidadDeRacha(cuenta, clave);
  if (!cantidad) return { cantidad: 0, perdida: false };
  const ultimo = cuenta.cooldowns[clave] || 0;
  return { cantidad, perdida: !ultimo || Date.now() - ultimo > ventanaMs };
}

export function registrarReclamo(sender, clave, reiniciar = false, chat = null) {
  const cuenta = datosDe(sender);
  const previa = reiniciar ? 0 : cantidadDeRacha(cuenta, clave);
  const cantidad = Math.min(RACHA_MAXIMA, previa + 1);
  const completoMaximo = previa < RACHA_MAXIMA && cantidad === RACHA_MAXIMA;
  cuenta.rachas[clave] = cantidad;
  guardarDatos(sender);
  if (chat) registrarAviso(sender, clave, chat);
  return { cantidad, completoMaximo };
}

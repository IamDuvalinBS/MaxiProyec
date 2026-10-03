import { addToWallet } from "../../motores/db.js";
import { datosDe, guardarDatos } from "../../motores/almacen-local.js";

export const MONEDAS_POR_MINUTO = 10;

export function estaAfk(sender) {
  return Boolean(datosDe(sender).afk);
}

export function activarAfk(sender, motivo) {
  datosDe(sender).afk = { desde: Date.now(), motivo: motivo || "" };
  guardarDatos();
}

export function desactivarAfk(sender) {
  const datos = datosDe(sender);
  const afk = datos.afk;
  const duracionMs = afk ? Date.now() - afk.desde : 0;
  const minutos = Math.floor(duracionMs / 60000);
  const ganado = minutos * MONEDAS_POR_MINUTO;
  datos.afk = null;
  guardarDatos();
  if (ganado > 0) addToWallet(sender, ganado);
  return { minutos, ganado, duracionMs };
}

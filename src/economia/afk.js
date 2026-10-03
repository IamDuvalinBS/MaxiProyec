import { getAccount, saveAccount, addToWallet } from "../../motores/db.js";

export const MONEDAS_POR_MINUTO = 10;

export function estaAfk(sender) {
  return Boolean(getAccount(sender).afk);
}

export function activarAfk(sender, motivo) {
  const cuenta = getAccount(sender);
  cuenta.afk = { desde: Date.now(), motivo: motivo || "" };
  saveAccount(sender);
}

export function desactivarAfk(sender) {
  const cuenta = getAccount(sender);
  const afk = cuenta.afk;
  const duracionMs = afk ? Date.now() - afk.desde : 0;
  const minutos = Math.floor(duracionMs / 60000);
  const ganado = minutos * MONEDAS_POR_MINUTO;
  cuenta.afk = null;
  if (ganado > 0) addToWallet(sender, ganado);
  else saveAccount(sender);
  return { minutos, ganado, duracionMs };
}

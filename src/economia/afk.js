import { getAllAccounts, addToWallet } from "../../motores/db.js";
import { datosDe, guardarDatos, migrarDeDisco } from "../../motores/almacen-local.js";
import { monto } from "./formato.js";
import { encabezado, mencion, tiempoLargo } from "./estilo.js";

export const MONEDAS_POR_MINUTO = 2;
const MOTIVO_MAX = 60;

export function tieneAfk(sender) {
  migrarDeDisco(sender);
  const cuenta = getAllAccounts().get(sender);
  return Boolean(cuenta && cuenta.afk);
}

export function estaAfk(sender) {
  return tieneAfk(sender);
}

export function activarAfk(sender, motivo) {
  const cuenta = datosDe(sender);
  cuenta.afk = { desde: Date.now(), motivo: (motivo || "").slice(0, MOTIVO_MAX) };
  guardarDatos(sender);
}

export function desactivarAfk(sender) {
  const cuenta = datosDe(sender);
  const afk = cuenta.afk;
  const duracionMs = afk ? Date.now() - afk.desde : 0;
  const minutos = Math.floor(duracionMs / 60000);
  const ganado = minutos * MONEDAS_POR_MINUTO;
  cuenta.afk = null;
  guardarDatos(sender);
  if (ganado > 0) addToWallet(sender, ganado);
  return { minutos, ganado, duracionMs };
}

export function textoSalidaAfk(sender, { minutos, ganado, duracionMs }) {
  return [
    encabezado("☀️", "AFK DESACTIVADO"),
    "",
    `> ${mencion(sender)} ya no se encuentra AFK.`,
    "",
    `ⴵ *Tiempo AFK*:: ${tiempoLargo(duracionMs)}`,
    `🪙 *Ganado*:: +${monto(ganado)} (${minutos} ${minutos === 1 ? "minuto" : "minutos"})`,
    "",
    "> Usa *.dep* para guardar tu dinero."
  ].join("\n");
}

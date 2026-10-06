import { getAccount, saveAccount } from "../../motores/db.js";
import { addXp } from "../../motores/profile.js";
import { leerMonto, monto, textoEspera } from "./formato.js";
import { enfriar } from "./espera.js";

export function resolverApuesta(texto, disponible, minimo, maximo) {
  const cantidad = leerMonto(texto, disponible);
  if (!cantidad) {
    return { error: "⚠️ Indica un monto válido o utiliza *todo*. Ejemplo: *1000*" };
  }
  const esTodo = ["todo", "all", "max"].includes(String(texto).trim().toLowerCase());
  const stake = esTodo ? Math.min(cantidad, maximo) : cantidad;
  if (stake < minimo) {
    return { error: `⚠️ La apuesta mínima es de *${monto(minimo)}*.` };
  }
  if (stake > maximo) {
    return { error: `⚠️ La apuesta máxima es de *${monto(maximo)}*.` };
  }
  if (stake > disponible) {
    return { error: `⚠️ Fondos insuficientes. Dinero disponible en mano: *${monto(disponible)}*.` };
  }
  return { stake };
}

export function chequearEnfriamiento(clave, ms) {
  const restante = enfriar(clave, ms);
  return restante > 0 ? textoEspera(restante) : null;
}

export function xpPorGanancia(ganancia) {
  return Math.min(200, Math.max(5, Math.round(ganancia / 20)));
}

export function liquidar(sender, stake, neto) {
  const cuenta = getAccount(sender);
  if (cuenta.wallet < stake) return null;
  cuenta.wallet += neto;
  saveAccount(sender);
  const xp = neto > 0 ? xpPorGanancia(neto) : 0;
  const nivel = xp > 0 ? addXp(sender, xp) : { leveledUp: false, newLevel: null };
  return { xp, subioNivel: nivel.leveledUp, nivel: nivel.newLevel };
}

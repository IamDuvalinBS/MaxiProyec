import { getAccount, saveAccount } from "../../motores/db.js";
import { addXp } from "../../motores/profile.js";
import { leerMonto, monto, textoEspera } from "./formato-evento.js";
import { estilo } from "./temas.js";
import { enfriar } from "../nucleo/espera.js";

const ESTILOS = {
  normal: {
    invalido: "⚠️ Indica un monto válido o utiliza *todo*. Ejemplo: *1000*",
    minima: (n) => `⚠️ La apuesta mínima es de *${monto(n)}*.`,
    maxima: (n) => `⚠️ La apuesta máxima es de *${monto(n)}*.`,
    sinFondos: (n) => `⚠️ Fondos insuficientes. Dinero disponible en mano: *${monto(n)}*.`
  },
  halloween: {
    invalido: "⚠️ 🦇 Indica un monto válido o utiliza *todo*. Ejemplo: *1000*",
    minima: (n) => `⚠️ 🕸️ La apuesta mínima es de *${monto(n)}*.`,
    maxima: (n) => `⚠️ 💀 La apuesta máxima es de *${monto(n)}*.`,
    sinFondos: (n) => `⚠️ 💀 No tienes tantas calabazas. En tu caldero solo hay: *${monto(n)}*.`
  }
};

export function resolverApuesta(texto, disponible, minimo, maximo) {
  const E = estilo(ESTILOS);
  const cantidad = leerMonto(texto, disponible);
  if (!cantidad) {
    return { error: E.invalido };
  }
  const esTodo = ["todo", "all", "max"].includes(String(texto).trim().toLowerCase());
  const stake = esTodo ? Math.min(cantidad, maximo) : cantidad;
  if (stake < minimo) {
    return { error: E.minima(minimo) };
  }
  if (stake > maximo) {
    return { error: E.maxima(maximo) };
  }
  if (stake > disponible) {
    return { error: E.sinFondos(disponible) };
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

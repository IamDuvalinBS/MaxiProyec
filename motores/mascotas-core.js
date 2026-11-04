import { getAccount, saveAccount } from "./db.js";
import { normalizar, actualizarMascota, mascotaPorNumero } from "./mascotas-logica.js";
import { obtenerClima } from "./mascotas-clima.js";
import { CIUDAD } from "./mascotas-datos.js";

export async function cargarMascotas(sender) {
  const cuenta = getAccount(sender);
  const est = normalizar(cuenta.mascotas);
  const clima = await obtenerClima();
  const ahora = Date.now();
  for (const m of est.mascotas) actualizarMascota(m, ahora, clima.precipitacionEn);
  return { cuenta, est, clima, ahora };
}

export function guardarMascotas(sender, cuenta, est) {
  cuenta.mascotas = est;
  return saveAccount(sender);
}

export function esDeNoche(ahora = Date.now()) {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: CIUDAD.zona, hour: "numeric", hour12: false }).format(ahora)) % 24;
  return hora >= 18 || hora < 6;
}

export function elegirMascota(est, texto) {
  const partes = texto.trim().split(/\s+/).slice(1);
  const numero = parseInt(partes.find((p) => /^#?\d+$/.test(p))?.replace("#", ""), 10) || null;
  const resto = partes.filter((p) => !/^#?\d+$/.test(p));
  if (!est.mascotas.length) return { error: "Aún no tienes mascotas. Compra una incubadora y un huevo con *.pettienda*.", resto };
  const m = mascotaPorNumero(est, numero);
  if (!m) {
    return {
      error: numero
        ? `No tienes una mascota con el número *${numero}*. Usa *.mispets* para ver tu lista.`
        : "Tienes varias mascotas. Indica el número, por ejemplo: *.petjugar 2*.",
      resto
    };
  }
  return { m, resto };
}

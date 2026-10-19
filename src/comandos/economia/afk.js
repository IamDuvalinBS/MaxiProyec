import { getAllAccounts, addToWallet } from "../../motores/db.js";
import { datosDe, guardarDatos, migrarDeDisco } from "../../motores/almacen-local.js";
import { monto } from "./formato-evento.js";
import { encabezado, mencion, tiempoLargo } from "./estilo-evento.js";
import { estilo } from "./temas.js";

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

export function activarAfk(sender, motivo, chat) {
  const cuenta = datosDe(sender);
  cuenta.afk = { desde: Date.now(), motivo: (motivo || "").slice(0, MOTIVO_MAX), chat: chat || null };
  guardarDatos(sender);
}

export function desactivarAfk(sender) {
  const cuenta = datosDe(sender);
  const afk = cuenta.afk;
  const duracionMs = afk ? Date.now() - afk.desde : 0;
  const chat = afk?.chat || null;
  const minutos = Math.floor(duracionMs / 60000);
  const ganado = minutos * MONEDAS_POR_MINUTO;
  cuenta.afk = null;
  guardarDatos(sender);
  if (ganado > 0) addToWallet(sender, ganado);
  return { minutos, ganado, duracionMs, chat };
}

const ESTILOS_SALIDA = {
  normal: {
    emoji: "☀️",
    titulo: "AFK DESACTIVADO",
    aviso: (m) => `> ${m} ya no se encuentra AFK.`,
    tiempo: (t) => `ⴵ *Tiempo AFK*:: ${t}`,
    ganado: (n, minutos) => `🪙 *Ganado*:: +${monto(n)} (${minutos} ${minutos === 1 ? "minuto" : "minutos"})`,
    tip: "> Usa *.dep* para guardar tu dinero."
  },
  halloween: {
    emoji: "🧟",
    titulo: "HAS RESUCITADO DE LA TUMBA",
    aviso: (m) => `> ${m} salió de su letargo y ya no está AFK. 🦇`,
    tiempo: (t) => `🕯️ *Tiempo bajo tierra*:: ${t}`,
    ganado: (n, minutos) => `🎃 *Botín nocturno*:: +${monto(n)} (${minutos} ${minutos === 1 ? "minuto" : "minutos"})`,
    tip: "> Usa *.dep* para esconder tus calabazas en la cripta. ⚰️"
  }
};

export function textoSalidaAfk(sender, { minutos, ganado, duracionMs }) {
  const E = estilo(ESTILOS_SALIDA);
  return [
    encabezado(E.emoji, E.titulo),
    "",
    E.aviso(mencion(sender)),
    "",
    E.tiempo(tiempoLargo(duracionMs)),
    E.ganado(ganado, minutos),
    "",
    E.tip
  ].join("\n");
}

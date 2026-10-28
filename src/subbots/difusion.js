import { socketsSubbots, estadoSubbots } from "./gestor.js";
import { delayAleatorio } from "../../motores/antiban.js";

// Pausa entre grupo y grupo de CADA subbot (cada número es una cuenta distinta, así que ellos sí van en paralelo).
// Mandar a muchos grupos seguidos es lo que más suele terminar en baneo, por eso es lenta a propósito.
const PAUSA_MIN_MS = Number(process.env.TAGSUBS_PAUSA_MIN) || 2500;
const PAUSA_MAX_MS = Number(process.env.TAGSUBS_PAUSA_MAX) || 6000;

let actual = null;   // { cancelado, inicio, total, enviados, fallidos }

export const difusionActiva = () => Boolean(actual);
export const cancelarDifusion = () => {
  if (!actual) return false;
  actual.cancelado = true;
  return true;
};
export const estadoDifusion = () => (actual ? { ...actual } : null);

const limpiar = (jid) => {
  const [u, d] = String(jid || "").split("@");
  return d ? `${u.split(":")[0]}@${d}` : u;
};

// Lista de menciones de un grupo (mismo criterio que .tag: el id con el que WhatsApp lista al participante).
const mencionesDe = (g) => (g.participants || []).map((p) => p.id).filter(Boolean);

async function difundirDesde({ numero, sock }, texto, visible, estado) {
  let grupos;
  try {
    grupos = Object.values(await sock.groupFetchAllParticipating());
  } catch (e) {
    estado.errores.push(`${numero}: no pude leer sus grupos (${e.message})`);
    return;
  }
  estado.total += grupos.length;

  for (const g of grupos) {
    if (estado.cancelado) return;
    const menciones = mencionesDe(g);
    let cuerpo = texto;
    if (visible) {
      const lista = menciones.map((id) => `@${limpiar(id).split("@")[0]}`).join(" ");
      cuerpo = `${texto}\n\n${lista}`;
    }
    try {
      await sock.sendMessage(g.id, { text: cuerpo, mentions: menciones });
      estado.enviados++;
    } catch (e) {
      estado.fallidos++;
      // Lo normal: el grupo está cerrado (solo admins) o el subbot fue expulsado.
      estado.errores.push(`${numero} › ${g.subject || g.id}: ${e.message}`);
    }
    await delayAleatorio(PAUSA_MIN_MS, PAUSA_MAX_MS);
  }
}

// Manda `texto` mencionando a todos desde todos los subbots conectados, en todos los grupos donde estén.
// Devuelve el resumen cuando termina. `alProgresar(estado)` se llama cada ~25 envíos.
export async function difundirSubbots(texto, { visible = false, alProgresar } = {}) {
  if (actual) throw new Error("ya_en_curso");
  const enLinea = new Set(estadoSubbots().lista.filter((s) => s.enLinea).map((s) => s.numero));
  const subs = socketsSubbots().filter((s) => enLinea.has(s.numero));
  if (!subs.length) throw new Error("sin_subbots");

  const estado = (actual = { cancelado: false, inicio: Date.now(), subs: subs.length, total: 0, enviados: 0, fallidos: 0, errores: [] });
  let ultimoAviso = 0;
  const vigilante = alProgresar && setInterval(() => {
    const hecho = estado.enviados + estado.fallidos;
    if (hecho - ultimoAviso >= 25) {
      ultimoAviso = hecho;
      Promise.resolve(alProgresar(estado)).catch(() => {});
    }
  }, 5000);

  try {
    await Promise.all(subs.map((s) => difundirDesde(s, texto, visible, estado)));
  } finally {
    clearInterval(vigilante);
    actual = null;
  }
  return { ...estado, duracionMs: Date.now() - estado.inicio };
}

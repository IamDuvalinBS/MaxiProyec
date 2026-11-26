// Limitador de trabajos pesados (ffmpeg) para TODO el proceso: el bot principal y todos los subbots comparten CPU.
// Dos carriles:
//   "pesado": conversiones de video grandes (películas, descargas)      → 1 a la vez   (MAX_TRABAJOS_PESADOS)
//   "ligero": stickers, .hd, audios, imágenes, uniones sin recomprimir  → 2 a la vez   (MAX_TRABAJOS_LIGEROS)
// Si el carril está lleno, el trabajo espera su turno y luego corre IGUAL que siempre (mismos argumentos, mismo
// resultado). El tiempo de espera no cuenta para el timeout del proceso: ese empieza cuando de verdad arranca.
// Solo se aplica al momento de lanzar el proceso, nunca envolviendo funciones que a su vez lancen otros procesos
// (así no puede haber bloqueos cruzados).
import { AsyncLocalStorage } from "async_hooks";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Cada comando guarda aquí una función `avisar` para decirle al usuario (una sola vez) que su pedido va en cola.
export const contextoComando = new AsyncLocalStorage();

const entero = (valor, defecto) => Math.max(1, Number(valor) || defecto);
const carriles = {
  pesado: { max: entero(process.env.MAX_TRABAJOS_PESADOS, 1), activos: 0, cola: [] },
  ligero: { max: entero(process.env.MAX_TRABAJOS_LIGEROS, 2), activos: 0, cola: [] }
};

function siguiente(carril) {
  while (carril.activos < carril.max && carril.cola.length) carril.cola.shift()();
}

export function conLimite(tipo, tarea) {
  const carril = carriles[tipo] || carriles.ligero;
  return new Promise((resolve, reject) => {
    const correr = () => {
      carril.activos++;
      Promise.resolve()
        .then(tarea)
        .then(resolve, reject)
        .finally(() => {
          carril.activos--;
          siguiente(carril);
        });
    };
    if (carril.activos < carril.max && !carril.cola.length) return correr();
    try { contextoComando.getStore()?.avisar?.(); } catch {}
    carril.cola.push(correr);
  });
}

// Igual que execFileAsync(bin, args, opciones), pero esperando turno en el carril indicado.
export function execLimitado(tipo, bin, args, opciones) {
  return conLimite(tipo, () => execFileAsync(bin, args, opciones));
}

export function estadoLimitador() {
  return Object.fromEntries(Object.entries(carriles).map(([n, c]) => [n, { max: c.max, activos: c.activos, enCola: c.cola.length }]));
}

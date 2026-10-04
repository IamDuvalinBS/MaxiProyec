import { cuentasConDatos, avisoDe, guardarAvisos, migrarTodoDeDisco, cantidadDeRacha } from "../../motores/almacen-local.js";
import { formatTime } from "../../motores/ui.js";
import { encabezado, mencion } from "./estilo.js";
import { textoDias } from "./rachas.js";

const INTERVALO_MS = 5 * 60 * 1000;
const AVISO_ANTES_MS = 2 * 60 * 60 * 1000;
const VENTANA_RACHA_MS = 48 * 60 * 60 * 1000;

let temporizador = null;
let socketActual = null;

function pausa(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function revisarRachas() {
  if (!socketActual) return;
  migrarTodoDeDisco();
  const ahora = Date.now();

  for (const [sender, cuenta] of cuentasConDatos()) {
    const cantidad = cantidadDeRacha(cuenta, "daily");
    const aviso = avisoDe(sender, "daily");
    const ultimo = cuenta.cooldowns && cuenta.cooldowns.daily;
    if (!cantidad || !aviso || !aviso.chat || !ultimo) continue;
    if (aviso.avisado === ultimo) continue;

    const restante = ultimo + VENTANA_RACHA_MS - ahora;
    if (restante <= 0 || restante > AVISO_ANTES_MS) continue;

    const texto = [
      encabezado("⏰", "RACHA EN RIESGO!"),
      "",
      `> ${mencion(sender)} tu racha de *${textoDias(cantidad)}* en *.daily* se perderá en *${formatTime(restante)}*.`,
      "> Usa *.daily* antes de que finalice el tiempo para conservarla."
    ].join("\n");

    try {
      await socketActual.sendMessage(aviso.chat, { text: texto, mentions: [sender] });
      aviso.avisado = ultimo;
      guardarAvisos();
    } catch (e) {
      console.log(`❌ No se pudo enviar el aviso de racha a ${sender}: ${e.message}`);
    }
    await pausa(1500);
  }
}

export function iniciarAvisosRacha(sock) {
  socketActual = sock;
  if (temporizador) return;
  temporizador = setInterval(() => {
    revisarRachas().catch((e) => console.log(`❌ Error revisando rachas: ${e.message}`));
  }, INTERVALO_MS);
}

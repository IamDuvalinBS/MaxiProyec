import { cuentasConDatos, avisoDe, registrarAviso, migrarTodoDeDisco, cantidadDeRacha } from "../../motores/almacen-local.js";
import { formatTime } from "../../motores/ui.js";
import { esGrupo, metadatos } from "../grupos/nucleo.js";
import { botApagado } from "../grupos/estado.js";
import { encabezado, mencion } from "./estilo.js";
import { textoDias } from "./rachas.js";

const INTERVALO_MS = 5 * 60 * 1000;
const AVISO_ANTES_MS = 2 * 60 * 60 * 1000;
const VENTANA_RACHA_MS = 48 * 60 * 60 * 1000;

let temporizador = null;
let socketActual = null;
let revisando = false;

function pausa(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function revisarRachas() {
  if (!socketActual || revisando) return;
  revisando = true;
  try {
    migrarTodoDeDisco();
    const ahora = Date.now();

    for (const [sender, cuenta] of cuentasConDatos()) {
      const cantidad = cantidadDeRacha(cuenta, "daily");
      const ultimo = cuenta.cooldowns && cuenta.cooldowns.daily;
      if (!cantidad || !ultimo) continue;

      const aviso = avisoDe(sender, "daily");
      if (aviso && aviso.avisado === ultimo) continue;

      const restante = ultimo + VENTANA_RACHA_MS - ahora;
      if (restante <= 0 || restante > AVISO_ANTES_MS) continue;

      const texto = [
        encabezado("⏰", "RACHA EN RIESGO!"),
        "",
        `> ${mencion(sender)} tu racha de *${textoDias(cantidad)}* en *.daily* se perderá en *${formatTime(restante)}*.`,
        "> Usa *.daily* antes de que finalice el tiempo para conservarla."
      ].join("\n");

      const destinos = [...new Set([aviso && aviso.chat, sender].filter(Boolean))].filter((d) => !(esGrupo(d) && botApagado(d)));
      let enviado = false;
      for (const destino of destinos) {
        try {
          await socketActual.sendMessage(destino, { text: texto, mentions: [sender] });
          enviado = true;
          break;
        } catch (e) {
          console.log(`❌ No se pudo enviar el aviso de racha a ${sender} por ${destino}: ${e.message}`);
        }
      }
      if (enviado) registrarAviso(sender, "daily", (aviso && aviso.chat) || sender, ultimo);
      await pausa(1500);
    }
  } finally {
    revisando = false;
  }
}

export async function anunciarBoda(sock, chat, a, b, fecha) {
  let mentions = [a, b];
  if (esGrupo(chat)) {
    const meta = await metadatos(sock, chat);
    if (meta) mentions = [...new Set([...meta.participantes.map((p) => p.id), a, b])];
  }
  const texto = [
    encabezado("💍", "NUEVA BODA!"),
    "",
    `> ${mencion(a)} y ${mencion(b)} acaban de casarse.`,
    "",
    `📅 *Casados desde* ›› ${fecha}`,
    "",
    "> ¡Felicidades a la pareja! 🎉"
  ].join("\n");
  await sock.sendMessage(chat, { text: texto, mentions });
}

export function iniciarAvisosRacha(sock) {
  socketActual = sock;
  if (temporizador) return;
  setTimeout(() => {
    revisarRachas().catch((e) => console.log(`❌ Error revisando rachas: ${e.message}`));
  }, 15000);
  temporizador = setInterval(() => {
    revisarRachas().catch((e) => console.log(`❌ Error revisando rachas: ${e.message}`));
  }, INTERVALO_MS);
}

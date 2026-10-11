import { getProfile } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { encabezado, mencion } from "../../economia/estilo.js";
import { anunciarBoda } from "../../economia/avisos.js";

const PROPUESTA_MS = 2 * 60 * 1000;
const RESPUESTA = /^(aceptarmarry|rechazarmarry|rechamarry|recharmarry)$/;
const propuestas = new Map();

function fechaHoy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

async function responderPropuesta(texto, ctx, clave) {
  const respuesta = String(texto || "").trim().toLowerCase();
  if (!RESPUESTA.test(respuesta)) return false;

  const propuesta = propuestas.get(clave);
  if (!propuesta || propuesta.vence < Date.now()) {
    propuestas.delete(clave);
    return false;
  }
  propuestas.delete(clave);

  const { retador, destino } = propuesta;
  const enviar = (contenido) => ctx.sock.sendMessage(ctx.from, contenido, { quoted: ctx.msg });

  if (respuesta !== "aceptarmarry") {
    await enviar({
      text: [
        encabezado("💔", "PROPUESTA RECHAZADA"),
        "",
        `> ${mencion(destino)} rechazó la propuesta de matrimonio de ${mencion(retador)}.`
      ].join("\n"),
      mentions: [retador, destino]
    });
    return true;
  }

  const pRetador = getProfile(retador);
  const pDestino = getProfile(destino);
  if (pRetador.marriedTo || pDestino.marriedTo) {
    await enviar({ text: "❌ La boda se canceló porque alguno de los dos ya se casó con otra persona." });
    return true;
  }

  const hoy = fechaHoy();
  pRetador.marriedTo = destino;
  pRetador.marriedSince = hoy;
  pDestino.marriedTo = retador;
  pDestino.marriedSince = hoy;
  await saveAccount(retador);
  await saveAccount(destino);

  await anunciarBoda(ctx.sock, ctx.from, retador, destino, hoy);
  return true;
}

export default {
  names: [".marry", ".casar"],
  desc: "Proponerle matrimonio a otro usuario (etiquetándolo)",
  category: "Perfil",
  usage: ".marry @usuario",
  handler: async ({ sender, from, msg, reply }) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    const destino = mentioned && mentioned[0];

    if (!destino) return reply({ text: "⚙️ Uso: *.marry @usuario*\nTienes que etiquetar a la persona." });
    if (destino === sender) return reply({ text: "❌ No puedes casarte contigo mismo." });

    if (getProfile(sender).marriedTo) return reply({ text: "❌ Ya estás casado. Primero tienes que separarte con *.divorciar*." });
    if (getProfile(destino).marriedTo) return reply({ text: "❌ Esa persona ya está casada con alguien más." });

    const clave = `${from}:${destino}`;
    propuestas.set(clave, { retador: sender, destino, vence: Date.now() + PROPUESTA_MS });

    registrarEspera(clave, {
      tipo: "marry",
      duracionMs: PROPUESTA_MS,
      alResponder: (texto, ctx) => responderPropuesta(texto, ctx, clave)
    });

    await reply({
      text: [
        encabezado("💍", "PROPUESTA DE MATRIMONIO"),
        "",
        `> ${mencion(sender)} le propone matrimonio a ${mencion(destino)}.`,
        "",
        `> ${mencion(destino)}, escribe *AceptarMarry* o *RechazarMarry* (tienes 2 minutos).`
      ].join("\n"),
      mentions: [sender, destino]
    });
  }
};

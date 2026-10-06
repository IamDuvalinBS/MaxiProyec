import { getAccount } from "../../../motores/db.js";
import { registrarEspera } from "../../nucleo/espera.js";
import { resolverApuesta, chequearEnfriamiento, liquidar } from "../../economia/apuestas.js";
import { monto, montoConSigno, entre, pausa, avisoNivel } from "../../economia/formato.js";

const CARAS = 8;
const APUESTA_BASE = 100;
const APUESTA_MAX = 5000;
const MULTIPLICADOR = 6;
const TIEMPO_ELECCION_MS = 30 * 1000;

export default {
  names: [".dado", ".dice"],
  usage: ".dado [monto]",
  desc: `Adivina en qué número caerá el dado (1 al ${CARAS}) y gana ${MULTIPLICADOR} veces lo apostado`,
  category: "Apuestas",
  handler: async ({ from, sender, cleanText, reply }) => {
    const argumento = cleanText.split(/\s+/)[1];
    const disponible = getAccount(sender).wallet;
    const apuesta = argumento
      ? resolverApuesta(argumento, disponible, APUESTA_BASE, APUESTA_MAX)
      : resolverApuesta(String(APUESTA_BASE), disponible, APUESTA_BASE, APUESTA_MAX);
    if (apuesta.error) return reply({ text: apuesta.error });

    const espera = chequearEnfriamiento(`dado:${sender}`, 8000);
    if (espera) return reply({ text: espera });

    const stake = apuesta.stake;
    registrarEspera(`${from}:${sender}`, {
      duracionMs: TIEMPO_ELECCION_MS,
      alResponder: async (respuesta, { sock, msg }) => {
        const limpia = respuesta.trim();
        const elegido = parseInt(limpia, 10);
        if (!/^\d+$/.test(limpia) || elegido < 1 || elegido > CARAS) return false;

        const responder = (contenido) => sock.sendMessage(from, contenido, { quoted: msg });
        const inicial = await responder({ text: "🎲 Tirando el dado..." });
        await pausa(1800);

        const resultado = entre(1, CARAS);
        const acierto = resultado === elegido;
        const neto = acierto ? stake * MULTIPLICADOR : -stake;
        const cierre = liquidar(sender, stake, neto);

        const texto = cierre
          ? [
              "✨ *DADO LANZADO* 🎲",
              `El dado cayó en número:: *${resultado}*`,
              `Tu elección:: *${elegido}*`,
              "",
              `MONEDAS:: *${montoConSigno(neto)}*`,
              `EXPERIENCIA:: *+${cierre.xp}*`
            ].join("\n")
          : "⚠️ La apuesta fue cancelada porque ya no cuentas con fondos suficientes.";

        try {
          await sock.sendMessage(from, { text: texto, edit: inicial.key });
        } catch (e) {
          await responder({ text: texto });
        }
        if (cierre?.subioNivel) await responder({ text: avisoNivel(cierre.nivel) });
        return true;
      }
    });

    await reply({
      text: [
        "🎲 *DADO*",
        `> Elige en qué número crees que caerá el dado, del *1 al ${CARAS}*.`,
        "",
        `Apuesta:: *${monto(stake)}*`,
        `Premio si aciertas:: *${monto(stake * MULTIPLICADOR)}*`,
        "",
        `✍️ Responde con un número del 1 al ${CARAS} en los próximos 30 segundos.`
      ].join("\n")
    });
  }
};

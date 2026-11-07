import fs from "fs";
import { downloadMediaMessage } from "@fer2809fl/baileys";
import { FOTO_PATH } from "../../../motores/db.js";
import { fijarFotoBot, quitarFotoBot, prepararFoto, PRINCIPAL } from "../../../motores/ajustes-bot.js";
import { comandoDeBot, nombreDelObjetivo } from "../../subbots/permisos.js";

const AVISO_MONGO = "\n⚠️ MongoDB no respondió: quedó guardado en el bot y se subirá cuando vuelva la conexión.";

export default {
  names: [".setfoto"],
  usage: ".setfoto (con foto adjunta, o respondiendo a una) | .setfoto reset",
  desc: "Cambiar la foto del menú de tu bot (owners y dueños de subbot). Se guarda en MongoDB",
  category: "Subbots",
  handler: comandoDeBot(async ({ sock, from, msg, cleanText, reply, objetivo }) => {
    const { botId, esPrincipal } = objetivo;
    const argumento = cleanText.split(/\s+/).slice(1).join(" ").trim().toLowerCase();

    if (argumento === "reset") {
      if (esPrincipal) return reply({ text: "⚠️ El bot principal no tiene una foto de origen a la que volver. Envía una nueva con *.setfoto*." });
      const { aplicado, mongo } = await quitarFotoBot(botId);
      if (!aplicado) return reply({ text: "ℹ️ Tu subbot ya usa la foto predeterminada del menú." });
      return reply({ text: `✅ La foto del menú de ${nombreDelObjetivo(objetivo)} volvió a la predeterminada.${mongo ? "" : AVISO_MONGO}` });
    }

    const imagen = msg.message?.imageMessage;
    const citada = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    let origen = null;
    if (imagen) {
      origen = msg;
    } else if (citada) {
      const ctx = msg.message.extendedTextMessage.contextInfo;
      origen = {
        key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant },
        message: ctx.quotedMessage
      };
    }

    if (!origen) {
      return reply({ text: "⚙️ Envía una imagen con *.setfoto* como descripción, o responde a una foto con *.setfoto*.\n\n> Para volver a la foto predeterminada de tu subbot usa *.setfoto reset*." });
    }

    try {
      const original = await downloadMediaMessage(origen, "buffer", {});
      const buffer = await prepararFoto(original);
      if (!buffer) return reply({ text: "❌ La imagen es demasiado pesada o no se pudo leer. Prueba con otra." });

      const mongo = await fijarFotoBot(botId, buffer);

      // Solo el bot principal es una cuenta de bot: ahí también se cambia su foto de perfil de WhatsApp.
      // En un subbot no se toca la foto de WhatsApp (es la cuenta personal de su dueño).
      let textoPerfil = "";
      if (esPrincipal) {
        try {
          fs.writeFileSync(FOTO_PATH, buffer);
          await sock.updateProfilePicture(sock.user.id, buffer);
          textoPerfil = " También se cambió la foto de perfil del bot.";
        } catch (e) {
          textoPerfil = ` (No se pudo cambiar la foto de perfil de WhatsApp: ${e.message})`;
        }
      }
      await reply({ text: `✅ Foto del menú de ${nombreDelObjetivo(objetivo)} actualizada y guardada en MongoDB.${textoPerfil}${mongo ? "" : AVISO_MONGO}` });
    } catch (e) {
      await reply({ text: `❌ No se pudo cambiar la foto: ${e.message}` });
    }
  })
};

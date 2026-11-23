import { downloadMediaMessage } from "@fer2809fl/baileys";
import { commandRegistry } from "../../../core.js";
import { contextoDe } from "../../nucleo/objetivo.js";
import {
  normalizarComando,
  fijarStickerReaccion,
  quitarStickerReaccion,
  listarStickerReacciones
} from "../../../motores/sticker-reacciones.js";

const AVISO_MONGO = "\n⚠️ MongoDB no respondió: quedó guardado en el bot y se sincronizará cuando vuelva la conexión.";

// Cualquier alias (.help, .menu...) se guarda con el nombre principal del comando.
function principalDe(texto) {
  const comando = normalizarComando(texto);
  if (!comando) return null;
  for (const info of commandRegistry.values()) {
    if (info.names.includes(comando)) return info.names[0];
  }
  return null;
}

const argumentoDe = (cleanText) => cleanText.split(/\s+/).slice(1).join(" ").trim();

export default [
  {
    names: [".setreact", ".addreact"],
    usage: ".setreact <comando>  (respondiendo a un sticker)",
    desc: "Elige el sticker con el que el bot reacciona cuando alguien usa un comando",
    category: "Owner",
    handler: async ({ cleanText, msg, from, reply }) => {
      const argumento = argumentoDe(cleanText);
      const ctx = contextoDe(msg);
      const citado = ctx?.quotedMessage?.stickerMessage;

      if (!argumento || !citado) {
        return reply({ text: "⚙️ Responde a un *sticker* con el comando que quieres ligar.\n\n> Ejemplo: *.setreact .ping*\n> Ejemplo: *.setreact .menu*" });
      }

      const comando = principalDe(argumento);
      if (!comando) return reply({ text: `❌ No existe el comando *${normalizarComando(argumento)}*.` });

      try {
        const origen = {
          key: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant },
          message: ctx.quotedMessage
        };
        const buffer = await downloadMediaMessage(origen, "buffer", {});
        const mongo = await fijarStickerReaccion(comando, buffer);
        await reply({ text: `✅ Listo: cada vez que usen *${comando}* reaccionaré con ese sticker.${mongo ? "" : AVISO_MONGO}` });
      } catch (e) {
        await reply({ text: `❌ No se pudo guardar el sticker: ${e.message}` });
      }
    }
  },
  {
    names: [".delreact", ".quitarreact"],
    usage: ".delreact <comando>",
    desc: "Quita el sticker de reacción de un comando",
    category: "Owner",
    handler: async ({ cleanText, reply }) => {
      const argumento = argumentoDe(cleanText);
      if (!argumento) return reply({ text: "⚙️ Dime qué comando quieres quitar.\n\n> Ejemplo: *.delreact .ping*" });

      const comando = principalDe(argumento) || normalizarComando(argumento);
      const { quitado, mongo } = await quitarStickerReaccion(comando);
      if (!quitado) return reply({ text: `ℹ️ *${comando}* no tenía sticker de reacción.` });
      await reply({ text: `✅ *${comando}* ya no reacciona con sticker.${mongo ? "" : AVISO_MONGO}` });
    }
  },
  {
    names: [".listreact", ".reacts"],
    usage: ".listreact",
    desc: "Lista los comandos que reaccionan con sticker",
    category: "Owner",
    handler: async ({ reply }) => {
      const lista = await listarStickerReacciones();
      if (!lista.length) return reply({ text: "ℹ️ Todavía no hay comandos con sticker de reacción.\n\n> Usa *.setreact <comando>* respondiendo a un sticker." });
      await reply({ text: `✿ *Comandos con sticker de reacción* (${lista.length})\n\n${lista.map((c) => `> ${c}`).join("\n")}` });
    }
  }
];

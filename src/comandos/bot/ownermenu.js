import fs from "fs";
import { config, commandRegistry, FOTO_PATH } from "../../../core.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { isOwner } from "../../../motores/owner.js";

function leerFoto() {
  try {
    return fs.existsSync(FOTO_PATH) ? fs.readFileSync(FOTO_PATH) : null;
  } catch {
    return null;
  }
}

function etiquetaDe(info) {
  const principal = info.names[0];
  const usage = info.usage || principal;
  const argumentos = usage.startsWith(principal) ? usage.slice(principal.length).trim() : "";
  const nombres = info.names.join(" / ");
  return argumentos ? `${nombres} ${argumentos}` : nombres;
}

function comandosOwner() {
  const vistos = new Set();
  const lista = [];
  for (const info of commandRegistry.values()) {
    if (vistos.has(info) || info.category !== "Owner" || info.names.includes(".ownermenu")) continue;
    vistos.add(info);
    lista.push(info);
  }
  return lista.sort((a, b) => a.names[0].localeCompare(b.names[0]));
}

export default {
  names: [".ownermenu", ".menuowner"],
  usage: ".ownermenu",
  desc: "Ver los comandos exclusivos de owner",
  category: "Owner",
  handler: async ({ sock, from, sender, msg }) => {
    if (!isOwner(sender)) return;

    const bloques = comandosOwner().map((info) => `✿ *${etiquetaDe(info)}*\n> ${info.desc}`);
    const usuario = `@${sender.split("@")[0]}`;
    const texto =
      `✿ *Panel exclusivo de owners* — 『 *${config.botNameLong}* 』\n\n` +
      `> Hola ${usuario}, este menú solo es visible para ti.\n\n` +
      `👑 ⧼⧼ OWNER ⧽⧽\n\n${bloques.join("\n\n")}`;

    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto,
      footer: config.botNameShort,
      foto: leerFoto(),
      boton: null,
      mentions: [sender]
    });

    if (!enviado) {
      await sock.sendMessage(from, { text: texto, mentions: [sender] }, { quoted: msg });
    }
  }
};

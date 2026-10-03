import { monto } from "../../economia/formato.js";
import { encabezado, mencion } from "../../economia/estilo.js";
import { estaAfk, activarAfk, desactivarAfk, textoSalidaAfk, MONEDAS_POR_MINUTO } from "../../economia/afk.js";

export default {
  names: [".afk"],
  usage: ".afk [motivo]",
  desc: "Activar o desactivar el modo AFK y ganar monedas por minuto",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    if (estaAfk(sender)) {
      const datos = desactivarAfk(sender);
      return reply({ text: textoSalidaAfk(sender, datos), mentions: [sender] });
    }

    const motivo = cleanText.split(/\s+/).slice(1).join(" ").trim();
    activarAfk(sender, motivo);

    const lineas = [
      encabezado("🌙", "MODO AFK ACTIVADO"),
      "",
      `> ${mencion(sender)} ahora se encuentra AFK.`
    ];
    if (motivo) lineas.push(`> Motivo: *${motivo}*`);
    lineas.push(
      "",
      `🪙 *Ganancia*:: ${monto(MONEDAS_POR_MINUTO)} por minuto`,
      "",
      "> Escribe cualquier mensaje o usa *.afk* para salir y recibir tus monedas."
    );
    await reply({ text: lineas.join("\n"), mentions: [sender] });
  }
};

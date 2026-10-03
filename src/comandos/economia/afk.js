import { monto } from "../../economia/formato.js";
import { encabezado, mencion, tiempoLargo } from "../../economia/estilo.js";
import { estaAfk, activarAfk, desactivarAfk, MONEDAS_POR_MINUTO } from "../../economia/afk.js";

export default {
  names: [".afk"],
  usage: ".afk [motivo]",
  desc: "Activar o desactivar el modo AFK y ganar monedas por minuto",
  category: "Economía",
  handler: async ({ sender, cleanText, reply }) => {
    if (estaAfk(sender)) {
      const { minutos, ganado, duracionMs } = desactivarAfk(sender);
      const texto = [
        encabezado("☀️", "AFK DESACTIVADO"),
        "",
        `> ${mencion(sender)} ya no se encuentra AFK.`,
        "",
        `ⴵ *Tiempo AFK*:: ${tiempoLargo(duracionMs)}`,
        `🪙 *Ganado*:: +${monto(ganado)} (${minutos} ${minutos === 1 ? "minuto" : "minutos"})`,
        "",
        "> Usa *.dep* para guardar tu dinero."
      ].join("\n");
      return reply({ text: texto, mentions: [sender] });
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
      "> No podrás utilizar otros comandos hasta salir del modo AFK.",
      "> Usa *.afk* nuevamente para salir y recibir tus monedas."
    );
    await reply({ text: lineas.join("\n"), mentions: [sender] });
  }
};

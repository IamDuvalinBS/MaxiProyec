import { monto } from "../../economia/formato-evento.js";
import { encabezado, mencion } from "../../economia/estilo-evento.js";
import { estaAfk, activarAfk, desactivarAfk, textoSalidaAfk, MONEDAS_POR_MINUTO } from "../../economia/afk.js";
import { estilo } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    emoji: "🌙",
    titulo: "MODO AFK ACTIVADO",
    aviso: (m) => `> ${m} ahora se encuentra AFK.`,
    motivo: (t) => `> Motivo: *${t}*`,
    ganancia: (n) => `🪙 *Ganancia*:: ${monto(n)} por minuto`,
    tip: "> Escribe cualquier mensaje o usa *.afk* para salir y recibir tus monedas."
  },
  halloween: {
    emoji: "⚰️",
    titulo: "DURMIENDO EN EL ATAÚD",
    aviso: (m) => `> ${m} se metió a su ataúd y ahora está AFK. 🧛`,
    motivo: (t) => `> Motivo del letargo: *${t}*`,
    ganancia: (n) => `🎃 *Botín nocturno*:: ${monto(n)} por minuto`,
    tip: "> Escribe cualquier mensaje o usa *.afk* para despertar y recibir tus calabazas. 🦇"
  }
};

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

    const E = estilo(ESTILOS);
    const motivo = cleanText.split(/\s+/).slice(1).join(" ").trim();
    activarAfk(sender, motivo);

    const lineas = [encabezado(E.emoji, E.titulo), "", E.aviso(mencion(sender))];
    if (motivo) lineas.push(E.motivo(motivo));
    lineas.push("", E.ganancia(MONEDAS_POR_MINUTO), "", E.tip);
    await reply({ text: lineas.join("\n"), mentions: [sender] });
  }
};

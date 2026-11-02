import { getAccount } from "../../../motores/db.js";
import { getProfile } from "../../../motores/profile.js";
import { monto, fmt, jidObjetivo } from "../../economia/formato-evento.js";
import { esHalloween } from "../../economia/temas.js";

const ESTILOS = {
  normal: {
    emoji: "🪎",
    titulo: "BANCO DE",
    icono: "🐋",
    cartera: "⛁ *Cartera ››*",
    banco: "✦ *Banco ››*",
    total: "☠︎︎ *Total ››*",
    nivel: "🎖️ *NIVEL::*",
    carteraTxt: (n) => `${monto(n)} fuera del banco`,
    bancoTxt: (n) => `${monto(n)} en el banco`,
    totalTxt: (n) => `${monto(n)} en total`,
    tip: "Usa *.dep* para guardar tu dinero en el banco.",
    banda: () => null,
    cierre: () => null
  },
  halloween: {
    emoji: "🕯️",
    titulo: "ALTAR DE",
    icono: "💀",
    cartera: "⛁ *Sin colocar ››*",
    banco: "✦ *Altar ››*",
    total: "☠︎︎ *Total en tu altar ››*",
    nivel: "🌼 *NIVEL::*",
    carteraTxt: (n) => `Tienes ${fmt(n)} flores de cempasúchil sin poner bien.`,
    bancoTxt: (n) => `Has colocado ${fmt(n)} flores de cempasúchil.`,
    totalTxt: (n) => `Tienes ${fmt(n)} flores de cempasúchil en tu altar de muertos.`,
    tip: "Usa *.dep* para hacer del todo homenaje a los difuntos. 🕯️",
    banda: () => null,
    cierre: () => null
  }
};

export default {
  names: [".banco", ".bal", ".bank"],
  usage: ".banco [@usuario | responder a un mensaje]",
  desc: "Consultar tu saldo o el de otro usuario (etiquetándolo o respondiendo a su mensaje)",
  category: "Economía",
  handler: async ({ sender, msg, reply }) => {
    const E = esHalloween() ? { ...ESTILOS.normal, ...ESTILOS.halloween } : ESTILOS.normal;
    const objetivo = jidObjetivo(msg) || sender;
    const cuenta = getAccount(objetivo);
    const perfil = getProfile(objetivo);
    const requerida = perfil.level * 100;

    const arriba = E.banda();
    const abajo = E.cierre();
    const texto = [
      ...(arriba ? [arriba] : []),
      `⧼${E.emoji}⧽ \`\`\`##\`\`\` *${E.titulo}*`,
      `> ${E.icono} ›› @${objetivo.split("@")[0]}`,
      "",
      E.cartera,
      `> ${E.carteraTxt(cuenta.wallet)}`,
      E.banco,
      `> ${E.bancoTxt(cuenta.bank)}`,
      E.total,
      `> ${E.totalTxt(cuenta.wallet + cuenta.bank)}`,
      "",
      `${E.nivel} ${perfil.level} (${fmt(perfil.xp)}/${fmt(requerida)} XP)`,
      "",
      `> ${E.tip}`,
      ...(abajo ? ["", abajo] : [])
    ].join("\n");

    await reply({ text: texto, mentions: [objetivo] });
  }
};

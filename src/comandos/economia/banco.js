import { getAccount } from "../../../motores/db.js";
import { getProfile } from "../../../motores/profile.js";
import { monto, fmt, jidObjetivo } from "../../economia/formato-evento.js";

// Estilo que se usa mientras está activo el evento de Halloween:
// "halloween" (calabazas, panteón) o "muertos" (Día de Muertos, 1 y 2 de noviembre).
const ESTILO_EVENTO = "muertos";

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];
const BANDAS_MUERTOS = ["🌼 🕯️ 💀 🕯️ 🌼", "🌺 💀 🌼 💀 🌺", "🕯️ 🌼 🪦 🌼 🕯️", "🌼 🍞 💀 🍬 🌼"];
const CIERRES_MUERTOS = ["🌼 🕯️ 🌼", "💀 🍬 💀", "🕯️ 🌺 🕯️"];

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
    tip: "Usa *.dep* para guardar tu dinero al banco.",
    banda: () => null,
    cierre: () => null
  },
  halloween: {
    emoji: "🪦",
    titulo: "PANTEÓN DE",
    icono: "🦇",
    cartera: "🧙‍♀️ *Caldero ››*",
    banco: "⚰️ *Panteón ››*",
    total: "☠︎︎ *Tesoro total ››*",
    nivel: "🔮 *NIVEL::*",
    carteraTxt: (n) => `${monto(n)} fuera del panteón`,
    bancoTxt: (n) => `${monto(n)} escondidas en el panteón`,
    totalTxt: (n) => `${monto(n)} en total`,
    tip: "Usa *.dep* para esconder tus calabazas en el panteón. 🎃",
    banda: null,
    cierre: null
  },
  muertos: {
    emoji: "🕯️",
    titulo: "ALTAR DE",
    icono: "💀",
    cartera: "⛁ *En la mano ››*",
    banco: "✦ *En el panteón ››*",
    total: "☠︎︎ *Total ››*",
    nivel: "🌼 *NIVEL::*",
    carteraTxt: (n) => `Traes ${fmt(n)} flores (🌼) sin guardar.`,
    bancoTxt: (n) => `Tienes ${fmt(n)} flores (🌼) guardadas en el panteón.`,
    totalTxt: (n) => `Tienes ${fmt(n)} flores (🌼) en tu altar de muertos.`,
    tip: "Usa *.dep* para guardar tus flores en el panteón. 🕯️",
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
    const E = esHalloween() ? { ...ESTILOS.normal, ...ESTILOS[ESTILO_EVENTO] } : ESTILOS.normal;
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

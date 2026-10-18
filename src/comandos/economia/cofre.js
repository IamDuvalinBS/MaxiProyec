import { addToWallet, getAccount, checkCooldown } from "../../../motores/db.js";
import { tarjeta, monto, elegir, entre, textoEspera } from "../../economia/formato-evento.js";
import { estilo } from "../../economia/temas.js";

const ESPERA_MS = 24 * 60 * 60 * 1000;
const PROB_BONUS = 0.15;

const ESTILOS = {
  normal: {
    emoji: "🧰",
    tituloBonus: "COFRE CON BONIFICACIÓN!",
    titulo: "COFRE ABIERTO",
    relatos: [
      "Encontraste un cofre sellado en un almacén abandonado.",
      "Un mensajero dejó un cofre a tu nombre en la entrada.",
      "Descubriste un cofre enterrado cerca de un antiguo muelle.",
      "Recibiste un cofre como obsequio de un comerciante agradecido.",
      "Un cofre apareció entre las pertenencias de una subasta."
    ],
    contenido: (n) => `🪙 *CONTENIDO::* +${monto(n)}`,
    bonus: (n) => `🌟 *BONUS ESPECIAL::* +${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA::* ${monto(n)}`,
    tip: "Usa *.cofre* de nuevo en 24 horas."
  },
  halloween: {
    emoji: "⚰️",
    tituloBonus: "ATAÚD CON MALDICIÓN DORADA!",
    titulo: "ATAÚD ABIERTO",
    relatos: [
      "Desenterraste un ataúd en el cementerio; el difunto dijo 'llévatelo, ya no lo uso' y volvió a dormir 🪦.",
      "Un cuervo dejó un ataúd diminuto en tu puerta; adentro había un tesoro y una nota que decía 'de nada' 🐦‍⬛.",
      "Encontraste un cofre bajo un árbol seco; las ramas te lo entregaron como si fuera lo más normal 🌳.",
      "Una bruja agradecida te regaló un cofre; la tapa pidió que lo abrieras con cuidado y mordió a medias 🧙‍♀️.",
      "Un cofre polvoriento apareció entre los muebles de una casa embrujada; el fantasma dueño dijo que lo olvidaste tú 🏚️."
    ],
    contenido: (n) => `🎃 *BOTÍN DEL ATAÚD::* +${monto(n)}`,
    bonus: (n) => `👻 *REGALO DE LOS ESPÍRITUS::* +${monto(n)}`,
    cartera: (n) => `🧙‍♀️ *CALDERO::* ${monto(n)}`,
    tip: "Vuelve a desenterrar otro con *.cofre* en 24 horas. 🌙"
  }
};

export default {
  names: [".cofre", ".chest"],
  desc: "Abre un cofre misterioso (cada 24 horas)",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
    const espera = checkCooldown(sender, "cofre", ESPERA_MS);
    if (espera > 0) return reply({ text: textoEspera(espera) });

    const base = entre(500, 5000);
    const conBonus = Math.random() < PROB_BONUS;
    const extra = conBonus ? entre(500, 2500) : 0;
    addToWallet(sender, base + extra);

    const lineas = [E.contenido(base)];
    if (conBonus) lineas.push(E.bonus(extra));
    lineas.push(E.cartera(getAccount(sender).wallet));

    await reply({
      text: tarjeta({
        emoji: E.emoji,
        titulo: conBonus ? E.tituloBonus : E.titulo,
        relato: elegir(E.relatos),
        lineas,
        tip: E.tip
      })
    });
  }
};

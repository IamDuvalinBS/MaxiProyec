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
  "Fuiste al panteón a dejar flores y, de repente, un difuntito salió de su tumba para regalarte dulces por tu calaverita. Como buen mexicano, le diste las gracias y te los llevaste sin hacer preguntas 💀🍬.",
  "Encontraste un ataúd abandonado junto a una ofrenda; adentro había una calabacita, cañas y dulces. Una nota decía: *Pa' que te lleves algo, mijo* 🪦🍬.",
  "Seguiste un camino de pétalos de cempasúchil y llegaste hasta un árbol seco. Entre las raíces encontraste una olla llena de monedas y dulces que alguien dejó para las almas 🏵️🌳.",
  "Una Catrina salió detrás de una ofrenda y te regaló una bolsa de dulces. Algunos se movían solos, pero tú ya estabas pensando en repartirlos 💀🍬.",
  "Entraste a una casa abandonada buscando un cofre y encontraste a un fantasma cuidando una montaña de monedas. Te miró y dijo: *Ya era hora de que vinieras por tu herencia* 👻🪙."
],
contenido: (n) => `🏵️ *BOTÍN DE LA OFRENDA::* +${monto(n)}`,
bonus: (n) => `💀 *REGALO DEL MÁS ALLÁ::* +${monto(n)}`,
cartera: (n) => `🪙 *TESORO DEL PANTEÓN::* ${monto(n)}`,
tip: "Vuelve a buscar otro tesoro con *.cofre* dentro de 24 horas. 🏵️🪦"
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

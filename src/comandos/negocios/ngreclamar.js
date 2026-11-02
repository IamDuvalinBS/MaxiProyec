import { getAccount } from "../../../motores/db.js";
import { monto } from "../../economia/formato-evento.js";
import { tarjetaMarcada } from "../../economia/estilo-evento.js";
import { estilo } from "../../economia/temas.js";
import { reclamarNegocios, negociosDe } from "../../economia/negocios.js";

const ESTILOS = {
  normal: {
    sinNegocios: "🏪 Aún no posees ningún negocio. Usa *.negocios* para ver la tienda.",
    nada: (aviso) => `⏳ Tus negocios todavía no han acumulado dinero.${aviso ? " Algunos negocios tienen el mantenimiento vencido; usa *.ngpagar* para reactivarlos." : ""}`,
    total: (n) => `🪙 *TOTAL*:: +${monto(n)}`,
    cartera: (n) => `⛁ *CARTERA*:: ${monto(n)}`,
    tipBase: "Usa *.dep* para guardar tu dinero.",
    tipVencido: "Tienes negocios con el mantenimiento vencido. Usa *.ngpagar*.",
    emoji: "💰",
    titulo: "GANANCIAS RECLAMADAS!",
    relato: "Cobraste el dinero acumulado de tus negocios."
  },
   halloween: {
    sinNegocios: "🏚️ Aún no tienes ningún negocio en el pueblo de los difuntos. Usa *.negocios* para visitar el mercado. 🏵️",
    nada: (aviso) => `⏳ 🕯️ Tus negocios todavía no han generado monedas para tu ofrenda.${aviso ? " Algunos tienen su protección vencida; usa *.ngpagar* para renovar la ofrenda. 💀" : ""}`,
    total: (n) => `🏵️ *GANANCIAS DE LA OFRENDA::* +${monto(n)}`,
    cartera: (n) => `🪙 *MONEDAS DEL ALTAR::* ${monto(n)}`,
    tipBase: "Usa *.dep* para guardar tus monedas en la cripta y mantenerlas a salvo. ⚰️",
    tipVencido: "Algunos negocios han perdido la protección de los espíritus. Usa *.ngpagar* para renovarla. 🕯️",
    emoji: "🏵️",
    titulo: "¡OFRENDA RECLAMADA!",
    relato: "Recogiste las monedas que tus negocios acumularon mientras los espíritus cuidaban de ellos. ¡Tu altar está más lleno que nunca! 💀🪙"
  }
};

export default {
  names: [".ngreclamar", ".ngcobrar", ".ngclaim", ".reclamarnegocios", ".cobrarnegocios"],
  usage: ".ngreclamar",
  desc: "Cobrar el dinero acumulado de tus negocios",
  category: "Economía",
  handler: async ({ sender, reply }) => {
    const E = estilo(ESTILOS);
    if (!Object.keys(negociosDe(sender)).length) {
      return reply({ text: E.sinNegocios });
    }

    const { total, detalle, vencidos } = reclamarNegocios(sender);

    if (total <= 0) {
      return reply({ text: E.nada(vencidos.length > 0) });
    }

    const lineas = detalle.map(({ def, monto: ganado }) => `${def.emoji} *${def.nombre}* ›› +${monto(ganado)}`);
    lineas.push("", E.total(total), E.cartera(getAccount(sender).wallet));

    const tip = [E.tipBase];
    if (vencidos.length) tip.push(E.tipVencido);

    await reply({
      text: tarjetaMarcada({
        emoji: E.emoji,
        titulo: E.titulo,
        relato: E.relato,
        lineas,
        tip
      })
    });
  }
};

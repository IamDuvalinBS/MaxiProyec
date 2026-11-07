import { fijarAjusteBot } from "../../../motores/ajustes-bot.js";
import { CURRENCY } from "../../../motores/db.js";
import { comandoDeBot, nombreDelObjetivo } from "../../subbots/permisos.js";

const LIMITE = 20;

export default {
  names: [".setmoneda"],
  usage: ".setmoneda <nombre> | .setmoneda reset",
  desc: "Cambiar el nombre de la moneda que muestra tu bot, ej: .setmoneda 🍪 Galletas (owners y dueños de subbot)",
  category: "Subbots",
  handler: comandoDeBot(async ({ cleanText, reply, objetivo }) => {
    const { botId } = objetivo;
    // Sin asteriscos, guiones bajos ni comillas invertidas: romperían el formato de WhatsApp en los montos.
    const nuevo = cleanText.split(/\s+/).slice(1).join(" ").replace(/[*_~`]/g, "").trim();
    if (!nuevo) return reply({ text: `⚙️ Uso: *.setmoneda <nombre>*\nEjemplo: *.setmoneda 🍪 Galletas*\n\n> Para volver a la moneda original usa *.setmoneda reset* (${CURRENCY}).` });

    if (nuevo.toLowerCase() === "reset") {
      const { mongo } = await fijarAjusteBot(botId, "moneda", null);
      return reply({ text: `✅ La moneda de ${nombreDelObjetivo(objetivo)} volvió a la original.${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
    }
    if (nuevo.length > LIMITE) return reply({ text: `⚠️ El nombre de la moneda es muy largo (${nuevo.length} de ${LIMITE} caracteres).` });

    const { mongo } = await fijarAjusteBot(botId, "moneda", nuevo);
    await reply({
      text: `✅ Moneda de ${nombreDelObjetivo(objetivo)} cambiada a: *${nuevo}* y guardada en MongoDB.\n\n> Solo cambia el nombre que se ve en pantalla; los saldos de cada usuario siguen intactos.${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}`
    });
  })
};

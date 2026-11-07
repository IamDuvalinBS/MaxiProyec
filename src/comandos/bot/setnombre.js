import { fijarAjusteBot, ajusteBot } from "../../../motores/ajustes-bot.js";
import { comandoDeBot, nombreDelObjetivo } from "../../subbots/permisos.js";

export default {
  names: [".setnombre"],
  usage: ".setnombre <corto> | <largo> | .setnombre reset",
  desc: "Cambiar el nombre de tu bot: corto para BOT NAME, largo para el saludo (owners y dueños de subbot)",
  category: "Subbots",
  handler: comandoDeBot(async ({ cleanText, reply, objetivo }) => {
    const { botId, esPrincipal } = objetivo;
    const resto = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!resto) {
      return reply({ text: "⚙️ Uso: *.setnombre <nombre corto> | <nombre largo>*\nEjemplo: *.setnombre Mambo | Matikanetannhauser*" });
    }

    if (resto.toLowerCase() === "reset") {
      if (esPrincipal) return reply({ text: "⚠️ El bot principal no tiene nombre de origen al que volver. Escribe el nombre que quieras con *.setnombre*." });
      await fijarAjusteBot(botId, "botNameShort", null);
      const { mongo } = await fijarAjusteBot(botId, "botNameLong", null);
      return reply({ text: `✅ ${nombreDelObjetivo(objetivo)} volvió a usar los nombres predeterminados.${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
    }

    const [cortoCrudo, largoCrudo] = resto.split("|").map((s) => s && s.trim());
    const corto = cortoCrudo || ajusteBot("botNameShort", botId);
    const largo = largoCrudo || cortoCrudo || ajusteBot("botNameLong", botId);
    await fijarAjusteBot(botId, "botNameShort", corto);
    const { mongo } = await fijarAjusteBot(botId, "botNameLong", largo);
    await reply({ text: `✅ Nombre corto: *${corto}*\n✅ Nombre largo: *${largo}*${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
  })
};

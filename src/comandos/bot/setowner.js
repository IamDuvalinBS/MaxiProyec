import { fijarAjusteBot } from "../../../motores/ajustes-bot.js";
import { comandoDeBot } from "../../subbots/permisos.js";

export default {
  names: [".setowner"],
  usage: ".setowner <nombre> | .setowner reset",
  desc: "Cambiar el nombre del dueño que muestra el menú de tu bot (owners y dueños de subbot)",
  category: "Subbots",
  handler: comandoDeBot(async ({ cleanText, reply, objetivo }) => {
    const nuevo = cleanText.split(/\s+/).slice(1).join(" ").trim();
    if (!nuevo) return reply({ text: "⚙️ Uso: *.setowner <nombre>*" });

    if (nuevo.toLowerCase() === "reset") {
      if (objetivo.esPrincipal) return reply({ text: "⚠️ El bot principal no tiene un dueño de origen al que volver. Escribe el nombre con *.setowner <nombre>*." });
      const { mongo } = await fijarAjusteBot(objetivo.botId, "ownerName", null);
      return reply({ text: `✅ El menú volvió a mostrar el dueño predeterminado.${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
    }

    const { mongo } = await fijarAjusteBot(objetivo.botId, "ownerName", nuevo.slice(0, 60));
    await reply({ text: `✅ Owner cambiado a: *${nuevo.slice(0, 60)}*${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
  })
};

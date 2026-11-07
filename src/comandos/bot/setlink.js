import { fijarAjusteBot } from "../../../motores/ajustes-bot.js";
import { comandoDeBot, nombreDelObjetivo } from "../../subbots/permisos.js";

const ENLACES = {
  canal: { clave: "channelLink", etiqueta: "Canal" },
  grupo: { clave: "groupLink", etiqueta: "Grupo oficial" },
  web: { clave: "webLink", etiqueta: "Página oficial" }
};

export default {
  names: [".setlink"],
  usage: ".setlink <canal|grupo|web> <enlace> | .setlink <canal|grupo|web> reset",
  desc: "Cambiar los botones de enlaces del menú de tu bot (owners y dueños de subbot)",
  category: "Subbots",
  handler: comandoDeBot(async ({ cleanText, reply, objetivo }) => {
    const [tipoCrudo, ...resto] = cleanText.split(/\s+/).slice(1);
    const tipo = ENLACES[String(tipoCrudo || "").toLowerCase()];
    const valor = resto.join(" ").trim();

    if (!tipo || !valor) {
      return reply({ text: "⚙️ Uso: *.setlink <canal|grupo|web> <enlace>*\nEjemplo: *.setlink grupo https://chat.whatsapp.com/xxxx*\n\n> Para quitar un enlace usa *.setlink grupo reset*." });
    }

    if (valor.toLowerCase() === "reset") {
      if (objetivo.esPrincipal) return reply({ text: "⚠️ El bot principal no tiene enlace de origen al que volver. Escribe el enlace nuevo con *.setlink*." });
      const { mongo } = await fijarAjusteBot(objetivo.botId, tipo.clave, null);
      return reply({ text: `✅ El enlace de *${tipo.etiqueta}* volvió al predeterminado.${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
    }

    if (!/^https?:\/\/\S+$/i.test(valor)) return reply({ text: "⚠️ El enlace debe empezar con *https://*" });

    const { mongo } = await fijarAjusteBot(objetivo.botId, tipo.clave, valor);
    await reply({ text: `✅ Enlace de *${tipo.etiqueta}* de ${nombreDelObjetivo(objetivo)} actualizado.${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
  })
};

import { ajusteBot, esPropio, fotoEsPropia, listarBaneosBot, restablecerBot } from "../../../motores/ajustes-bot.js";
import { CURRENCY } from "../../../motores/db.js";
import { comandoDeBot, nombreDelObjetivo } from "../../subbots/permisos.js";

const marca = (propio) => (propio ? "✏️ personalizado" : "predeterminado");

export default {
  names: [".configbot", ".mibot"],
  usage: ".configbot | .configbot reset",
  desc: "Ver lo que tienes personalizado en tu bot (menú, moneda, enlaces, baneos). Con reset lo restablece todo en tu subbot",
  category: "Subbots",
  handler: comandoDeBot(async ({ cleanText, reply, objetivo }) => {
    const { botId, esPrincipal } = objetivo;
    const argumento = cleanText.split(/\s+/)[1]?.toLowerCase();

    if (argumento === "reset") {
      if (esPrincipal) return reply({ text: "⚠️ El bot principal no se puede restablecer de golpe. Cambia cada cosa con sus comandos (*.setnombre*, *.setmoneda*, *.setfoto*...)." });
      const { aplicado, mongo } = await restablecerBot(botId);
      if (!aplicado) return reply({ text: "ℹ️ Tu subbot no tenía nada personalizado." });
      return reply({ text: `✅ Se restableció todo lo personalizado de ${nombreDelObjetivo(objetivo)}: nombres, moneda, enlaces, foto y baneos propios.${mongo ? "" : "\n⚠️ MongoDB no respondió: se subirá cuando vuelva la conexión."}` });
    }

    const baneos = listarBaneosBot(botId);
    const lineas = [
      `⚙️ *CONFIGURACIÓN DE ${esPrincipal ? "BOT PRINCIPAL" : `SUBBOT ${botId}`}*`,
      "",
      `⧼🏷️⧽ *Nombre*:: ${ajusteBot("botNameShort", botId)} / ${ajusteBot("botNameLong", botId)} (${marca(esPropio("botNameShort", botId))})`,
      `⧼👑⧽ *Dueño en el menú*:: ${ajusteBot("ownerName", botId)} (${marca(esPropio("ownerName", botId))})`,
      `⧼🪙⧽ *Moneda*:: ${ajusteBot("moneda", botId) || CURRENCY} (${marca(esPropio("moneda", botId))})`,
      `⧼🖼️⧽ *Foto del menú*:: ${marca(fotoEsPropia(botId))}`,
      `⧼📢⧽ *Canal*:: ${ajusteBot("channelLink", botId) || "sin enlace"}`,
      `⧼👥⧽ *Grupo*:: ${ajusteBot("groupLink", botId) || "sin enlace"}`,
      `⧼🌐⧽ *Web*:: ${ajusteBot("webLink", botId) || "sin enlace"}`,
      `⧼🚫⧽ *Baneos propios*:: ${baneos.comandos.length + baneos.categorias.length ? [...baneos.categorias, ...baneos.comandos].join(", ") : "ninguno"}`,
      "",
      "> Comandos: *.setnombre*, *.setowner*, *.setmoneda*, *.setfoto*, *.setlink*, *.banear*",
      ...(esPrincipal ? [] : ["> Para restablecer todo usa *.configbot reset*."])
    ];
    await reply({ text: lineas.join("\n") });
  })
};

import { ownerGacha } from "../../../motores/gacha-owners.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { gachaListo, arroba, CAT } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { reiniciarNiveles } from "../../../motores/gacha-db.js";

export default {
  names: [".resetniveles", ".reiniciarniveles"],
  desc: "Reinicia a nivel 0 los personajes del gacha: .resetniveles <todos|@usuario> [categoría] confirmar (solo owners)",
  category: "Owner",
  usage: ".resetniveles <todos|@usuario> [categoría] confirmar",
  handler: ownerGacha(async ({ cleanText, msg, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1).map((x) => x.toLowerCase());
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const usuario = contexto?.mentionedJid?.[0] || contexto?.participant || null;
    const global = partes.includes("todos");
    const categoria = partes.map((x) => categoriaPorAlias(x)).find(Boolean) || null;
    const confirmado = partes.includes("confirmar");

    if (!global && !usuario) {
      return reply({
        text: [
          encabezado("🔄", "REINICIAR NIVELES"),
          "",
          "✱ *Todos los usuarios* ›› .resetniveles todos [categoría] confirmar",
          "✱ *Un usuario* ›› .resetniveles @usuario [categoría] confirmar",
          "",
          "> Deja en *nivel 0* los personajes elegidos. Las estrellas de ascensión no se tocan.",
          "> Sin la palabra *confirmar* solo se muestra cuántos personajes se verían afectados."
        ].join("\n")
      });
    }

    const filtro = { usuario: global ? null : usuario, categoria };
    const alcance = global ? "todos los usuarios" : arroba(usuario);
    const detalle = categoria ? CAT[categoria].plural : "todas las categorías";

    if (!confirmado) {
      const n = reiniciarNiveles({ ...filtro, soloContar: true });
      return reply({
        text: [
          encabezado("🔄", "REINICIAR NIVELES"),
          "",
          `> Se reiniciarían *${n}* personajes de ${alcance} (${detalle}).`,
          `> Para aplicarlo escribe el mismo comando agregando *confirmar*.`
        ].join("\n"),
        mentions: usuario && !global ? [usuario] : []
      });
    }

    const n = reiniciarNiveles(filtro);
    return reply({
      text: [
        encabezado("🔄", "NIVELES REINICIADOS"),
        "",
        `> *${n}* personajes de ${alcance} (${detalle}) volvieron al nivel 0.`
      ].join("\n"),
      mentions: usuario && !global ? [usuario] : []
    });
  })
};

import { gachaListo, CAT, monto, textoStats } from "../../../motores/gacha-core.js";
import { categoriaPorAlias } from "../../../motores/gacha-categorias.js";
import { mejorDe } from "../../../motores/gacha-db.js";
import { getAccount } from "../../../motores/db.js";
import {
  ascender, costoAscension, fragmentosDe, nivelMaxDe, estrellasTexto,
  MAX_ESTRELLAS, NIVELES_POR_ESTRELLA, BONO_POR_ESTRELLA
} from "../../../motores/gacha-niveles.js";
import { registrarActividad } from "../../../motores/gacha-misiones.js";
import { encabezado } from "../../../src/economia/estilo.js";

const identificador = (texto) => (/^#?\d+$/.test(texto || "") ? parseInt(String(texto).replace("#", ""), 10) : null);

function ayuda(sender) {
  return [
    encabezado("🌟", "ASCENDER"),
    "",
    `> Cuando un personaje llega a su nivel máximo puedes ascenderlo: gana una estrella, su nivel máximo sube ${NIVELES_POR_ESTRELLA} niveles y todas sus estadísticas aumentan ${Math.round(BONO_POR_ESTRELLA * 100)}%. Los poderes también se hacen más fuertes. Máximo ${MAX_ESTRELLAS} estrellas.`,
    "",
    "✱ *Uso* ›› .ascender <categoría> <ID>",
    "✿ *Ejemplo* ›› .ascender pokemon 25",
    "",
    `🧩 *Tus fragmentos* ›› ${fragmentosDe(sender)}`,
    "> Los fragmentos se consiguen al reclamar un personaje repetido, al ganar combates PvP y al cobrar misiones.",
    `> Categorías: ${Object.keys(CAT).join(", ")}.`
  ].join("\n");
}

export default {
  names: [".ascender", ".ascension", ".estrella"],
  desc: "Asciende un personaje en nivel máximo para extender su nivel: .ascender <categoría> <ID>",
  category: "Gacha",
  usage: ".ascender <categoría> <ID>",
  handler: async ({ sender, cleanText, reply }) => {
    await gachaListo;
    const partes = cleanText.split(/\s+/).slice(1);
    const categoria = categoriaPorAlias(partes[0]);
    if (!categoria) return reply({ text: ayuda(sender) });

    const cat = CAT[categoria];
    const charId = identificador(partes[1]);

    if (!charId) {
      const p = mejorDe(sender, categoria, null);
      if (!p) return reply({ text: `❌ Todavía no tienes ${cat.indef}. Consíguelo con *${cat.rollCmd}*.` });
      const estrellas = p.estrellas || 0;
      if (estrellas >= MAX_ESTRELLAS) return reply({ text: `🌟 *${p.nombre}* ya tiene ${MAX_ESTRELLAS} estrellas ${estrellasTexto(estrellas)}.` });
      const costo = costoAscension(estrellas);
      return reply({
        text: [
          encabezado("🌟", "ASCENDER"),
          "",
          `> Tu personaje de mayor nivel es *${p.nombre}* (#${p.id}), nivel ${p.nivel}/${nivelMaxDe(categoria, estrellas)} ${estrellasTexto(estrellas)}.`,
          "",
          `🧩 *Fragmentos* ›› tienes ${fragmentosDe(sender)} y necesitas ${costo.fragmentos}`,
          `💴 *Dinero en mano* ›› tienes ${monto(getAccount(sender).wallet)} y necesitas ${monto(costo.dinero)}`,
          "",
          `> Para ascender usa *.ascender ${categoria} ${p.id}*. Debe estar en su nivel máximo.`
        ].join("\n")
      });
    }

    const r = ascender({ sender, categoria, charId });
    if (r.error === "sinpersonajes") return reply({ text: `❌ Todavía no tienes ${cat.indef}.` });
    if (r.error === "ajeno") return reply({ text: `❌ No tienes ${cat.indef} con el ID #${charId}.` });
    if (r.error === "estrellas") return reply({ text: `🌟 *${r.p.nombre}* ya tiene ${MAX_ESTRELLAS} estrellas ${estrellasTexto(r.p.estrellas)}.` });
    if (r.error === "nivel") {
      return reply({ text: `❌ *${r.p.nombre}* está en el nivel ${r.p.nivel}. Debe llegar al nivel máximo (${r.max}) para ascender. ${cat.subirNivel}` });
    }
    if (r.error === "fragmentos") {
      return reply({ text: `❌ Necesitas ${r.costo.fragmentos} fragmentos y tienes ${r.fragmentos}. Se consiguen con personajes repetidos, combates PvP y misiones.` });
    }
    if (r.error === "saldo") {
      return reply({ text: `❌ Te faltan *${monto(r.costo.dinero - getAccount(sender).wallet)}* en mano para ascender. Usa *.retirar* para sacar dinero del banco.` });
    }

    const enviado = await reply({
      text: [
        encabezado("🌟", "ASCENSIÓN"),
        "",
        `✍🏻 *Nombre* ›› ${r.p.nombre} (#${r.p.id})`,
        `⭐ *Estrellas* ›› ${r.antes} → *${r.despues}* ${estrellasTexto(r.despues)}`,
        `📊 *Nivel máximo* ›› ${nivelMaxDe(categoria, r.antes)} → *${r.nuevoMax}*`,
        textoStats(r.stats),
        `🧩 *Gastaste* ›› ${r.costo.fragmentos} fragmentos y ${monto(r.costo.dinero)}`,
        `🧩 *Te quedan* ›› ${r.restantes} fragmentos`,
        "",
        "> Sus poderes ahora son más fuertes. Míralos con *.poderes*."
      ].join("\n")
    });
    await registrarActividad({ reply, sender, eventos: [] });
    return enviado;
  }
};

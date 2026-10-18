import { gachaListo, arroba } from "../../../motores/gacha-core.js";
import { AUTOMATICAS, insigniasDe, revisarInsignias, tieneInsignia, listaExclusivas } from "../../../motores/gacha-insignias.js";
import { encabezado } from "../../../src/economia/estilo.js";
import { T } from "../../../motores/gacha-tema.js";

export default {
  names: [".insignias", ".badges", ".logros"],
  desc: "Muestra tus insignias del gacha o las de otra persona: .insignias [@usuario]",
  category: "Gacha",
  usage: ".insignias [@usuario]",
  handler: async ({ sender, msg, reply }) => {
    await gachaListo;
    const contexto = msg.message?.extendedTextMessage?.contextInfo;
    const objetivo = contexto?.mentionedJid?.[0] || contexto?.participant || sender;
    const propio = objetivo === sender;
    if (propio) revisarInsignias(sender);

    const tiene = insigniasDe(objetivo);
    const exclusivas = tiene.filter((i) => i.exclusiva);
    const automaticas = tiene.filter((i) => !i.exclusiva);
    const total = AUTOMATICAS.length;

    const lineas = [
      encabezado("🏅", T("INSIGNIAS", "INSIGNIAS DE LA NOCHE")),
      "",
      `> Insignias de ${arroba(objetivo)}. Automáticas: *${automaticas.length}/${total}*.`,
      ""
    ];

    if (exclusivas.length) {
      lineas.push("💠 *Exclusivas* ››");
      for (const i of exclusivas) lineas.push(`> ${i.emoji} *${i.nombre}* · ${i.desc}`);
      lineas.push("");
    }

    lineas.push("🏆 *Automáticas* ››");
    for (const i of AUTOMATICAS) {
      const logrado = tieneInsignia(objetivo, i.id);
      lineas.push(logrado ? `> ${i.emoji} *${i.nombre}* · ${i.desc}` : `> 🔒 ${i.nombre} · ${i.desc}`);
    }

    const existentes = listaExclusivas().length;
    lineas.push("", `> Las insignias exclusivas solo las entrega el equipo del bot por eventos, torneos y temporadas${existentes ? ` (hay ${existentes} creadas hasta ahora)` : ""}.`);
    return reply({ text: lineas.join("\n"), mentions: [objetivo] });
  }
};

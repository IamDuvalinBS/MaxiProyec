import { pityMaximoDe } from "../../../motores/gacha-reliquias.js";
import { gachaListo, CAT } from "../../../motores/gacha-core.js";
import { destacadoDe, pityDe } from "../../../motores/gacha-banner.js";
import { leTiene } from "../../../motores/gacha-db.js";
import { PROBABILIDAD_BANNER, PITY_TIRADAS, PITY_RANGO_MINIMO, msHastaLunes } from "../../../motores/gacha-config.js";
import { RAREZA_NOMBRES } from "../../../motores/gacha-niveles.js";
import { encabezado, tiempoLargo } from "../../../src/economia/estilo.js";
import { T } from "../../../motores/gacha-tema.js";

export default {
  names: [".banner", ".destacados", ".semanal_gacha"],
  desc: "Muestra los personajes destacados de la semana y tu garantía en cada gacha",
  category: "Gacha",
  usage: ".banner",
  handler: async ({ sender, reply }) => {
    await gachaListo;
    const lineas = [
      encabezado("⭐", T("DESTACADOS DE LA SEMANA", "DESTACADOS DE LA SEMANA MACABRA")),
      "",
      T(`> Cada semana un personaje de cada gacha tiene *${Math.round(PROBABILIDAD_BANNER * 100)}%* de probabilidad extra de aparecer en tus tiradas. Cambian en *${tiempoLargo(msHastaLunes())}*.`, `> Cada semana una criatura de cada gacha sale de la niebla con *${Math.round(PROBABILIDAD_BANNER * 100)}%* de probabilidad extra de aparecer en tus tiradas. Cambian en *${tiempoLargo(msHastaLunes())}*.`),
      ""
    ];

    for (const clave of Object.keys(CAT)) {
      const cat = CAT[clave];
      let destacado = null;
      try {
        destacado = await destacadoDe(clave);
      } catch {}
      if (!destacado) {
        lineas.push(`${cat.emoji} *${cat.titulo}* ›› Sin personajes cargados todavía.`);
        continue;
      }
      lineas.push(`${cat.emoji} *${cat.titulo}* ›› *${destacado.nombre}* (#${destacado.id})`);
      lineas.push(`> ✨ ${destacado.rareza} · ${leTiene(sender, destacado.id) ? "Ya lo tienes" : "Aún no lo tienes"} · 🍀 ${pityDe(sender, clave)}/${pityMaximoDe(sender)}`);
    }

    lineas.push(
      "",
      T(`> 🍀 La garantía asegura un personaje de rareza ${RAREZA_NOMBRES[PITY_RANGO_MINIMO]} o superior si llegas a ${PITY_TIRADAS} tiradas sin obtenerlo. Se cuenta por separado en cada gacha.`, `> 🍀 Los espíritus aseguran un personaje de rareza ${RAREZA_NOMBRES[PITY_RANGO_MINIMO]} o superior si llegas a ${PITY_TIRADAS} tiradas sin obtenerlo. Se cuenta por separado en cada gacha.`)
    );
    return reply({ text: lineas.join("\n") });
  }
};

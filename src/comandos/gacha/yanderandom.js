import { ownerGacha } from "../../../motores/gacha-owners.js";
import { agregarAnimes } from "../../../motores/gacha-yandere.js";
import { gachaListo, tarjeta } from "../../../motores/gacha-core.js";
import { contarPersonajes } from "../../../motores/gacha-db.js";

const POR_DEFECTO = 5;
const MAXIMO = 10;
let ocupado = false;

export default {
  names: [".yanderandom"],
  desc: "Agrega animes completos (todos sus personajes) desde yande.re y konachan (solo owners)",
  category: "Owner",
  usage: ".yanderandom [cantidad de animes]",
  handler: ownerGacha(async ({ cleanText, reply }) => {
    await gachaListo;
    if (ocupado) return reply({ text: "⏳ Ya hay una carga en curso, espera a que termine." });
    const n = Math.min(MAXIMO, Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || POR_DEFECTO));

    ocupado = true;
    try {
      await reply({ text: `🔎 Buscando *${n}* animes y descargando todos sus personajes... esto tarda varios minutos.` });
      const nom = (s) => s.replace(/_/g, " ");
      const resumen = await agregarAnimes(n, async (serie, r) => {
        await reply({ text: `✅ *${nom(serie)}* — ${r.agregadas.length} personajes agregados.` });
      });

      const total = resumen.reduce((a, s) => a + s.agregadas.length, 0);
      const lineas = resumen.map((s) => `• *${nom(s.serie)}* — ${s.agregadas.length} personajes`);
      if (!resumen.length) lineas.push("No se encontró ningún anime en esta tanda.");
      lineas.push("", `📚 *Waifus en la base* ›› ${contarPersonajes("waifu")}`);

      await reply({ text: tarjeta({ emoji: "📥", titulo: `AGREGADOS ${total} PERSONAJES`, lineas }) });
    } catch (e) {
      await reply({ text: `❌ Error consultando las fuentes: ${e.message}` });
    } finally {
      ocupado = false;
    }
  })
};

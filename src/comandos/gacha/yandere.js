import { ownerGacha } from "../../../motores/gacha-owners.js";
import { agregarPorLink } from "../../../motores/gacha-yandere.js";
import { gachaListo, enviarPersonaje, registrarPendiente, tarjeta, EXCLUSIVO_MS } from "../../../motores/gacha-core.js";

export default {
  names: [".yandere"],
  desc: "Agrega waifus desde un link de yande.re o konachan: post, búsqueda o pool (solo owners)",
  category: "Owner",
  usage: ".yandere <link>",
  handler: ownerGacha(async ({ from, sender, cleanText, reply }) => {
    await gachaListo;
    const link = cleanText.split(/\s+/)[1];
    if (!link) return reply({ text: "⚙️ Uso: .yandere <link de yande.re o konachan.net (post, búsqueda o pool)>" });

    let r;
    try {
      r = await agregarPorLink(link);
    } catch (e) {
      return reply({ text: `❌ No pude consultar el sitio: ${e.message}` });
    }
    if (!r.ok) return reply({ text: `❌ No se agregó: ${r.motivo}.` });

    if (r.agregadas.length > 1) {
      const lineas = r.agregadas.slice(0, 25).map((p, i) => `${i + 1}. *${p.nombre}* — ${p.serie}`);
      if (r.agregadas.length > 25) lineas.push(`… y ${r.agregadas.length - 25} más`);
      return reply({ text: tarjeta({ emoji: "📥", titulo: `AGREGADAS ${r.agregadas.length}`, lineas }) });
    }

    const personaje = r.agregadas[0];
    try {
      const enviado = await enviarPersonaje({
        reply, personaje, titulo: "WAIFU AGREGADA",
        lineasExtra: [`✅ Guardada en la base. Responde con *.claim* para reclamarla (${EXCLUSIVO_MS / 1000}s).`]
      });
      if (enviado?.key?.id) registrarPendiente(enviado.key.id, from, personaje, sender);
    } catch (e) {
      await reply({ text: `✅ *${personaje.nombre}* se guardó en la base, pero no pude descargar la imagen para mostrarla.` });
    }
  })
};

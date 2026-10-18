import { ownerGacha } from "../../../motores/gacha-owners.js";
import { agregarPorLink } from "../../../motores/gacha-yandere.js";
import { gachaListo, enviarPersonaje, registrarPendiente, EXCLUSIVO_MS } from "../../../motores/gacha-core.js";

export default {
  names: [".yandere"],
  desc: "Agrega UNA waifu desde un link de yande.re (solo owners)",
  category: "Owner",
  usage: ".yandere <link del post>",
  handler: ownerGacha(async ({ from, sender, cleanText, reply }) => {
    await gachaListo;
    const link = cleanText.split(/\s+/)[1];
    if (!link) return reply({ text: "⚙️ Uso: .yandere https://yande.re/post/show/123456" });

    let r;
    try {
      r = await agregarPorLink(link);
    } catch (e) {
      return reply({ text: `❌ No pude consultar yande.re: ${e.message}` });
    }
    if (!r.ok) return reply({ text: `❌ No se agregó: ${r.motivo}.` });

    try {
      const enviado = await enviarPersonaje({
        reply, personaje: r.personaje, titulo: "WAIFU AGREGADA",
        lineasExtra: [`✅ Guardada en la base. Responde con *.claim* para reclamarla (${EXCLUSIVO_MS / 1000}s).`]
      });
      if (enviado?.key?.id) registrarPendiente(enviado.key.id, from, r.personaje, sender);
    } catch (e) {
      await reply({ text: `✅ *${r.personaje.nombre}* se guardó en la base, pero no pude descargar la imagen para mostrarla.` });
    }
  })
};

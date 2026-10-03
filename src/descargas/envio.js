import fs from "fs";
import { descargarATemporal, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "./core.js";
import { prepararVideoEnDisco } from "./video.js";
import { tarjetaAviso, tarjetaError } from "./tarjetas.js";

export async function enviarMedia(media, reply) {
  let ruta = await descargarATemporal(media.url, media.type === "video" ? "mp4" : "img");
  let limpiar = null;

  try {
    if (media.type === "video") {
      const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
      if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
        await reply({
          text: tarjetaAviso(
            "ARCHIVO MUY PESADO",
            `El video pesa ${pesoMB.toFixed(1)} MB y supera el límite de WhatsApp (${LIMITE_VIDEO_WHATSAPP_MB} MB). Se omitió.`
          )
        });
        return false;
      }
      const preparado = await prepararVideoEnDisco(ruta);
      ruta = null;
      limpiar = preparado.limpiar;
      await reply({ video: { url: preparado.ruta }, mimetype: "video/mp4" });
      return true;
    }

    const buffer = await asegurarImagenCompatibleWhatsApp(ruta);
    ruta = null;
    await reply({ image: buffer, mimetype: "image/jpeg" });
    return true;
  } finally {
    if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
    if (limpiar) limpiar();
  }
}

export async function enviarMedias(medias, reply) {
  let enviados = 0;
  for (const media of medias) {
    try {
      if (await enviarMedia(media, reply)) enviados++;
    } catch (e) {
      await reply({ text: tarjetaError("No se pudo enviar uno de los archivos.", e.message) });
    }
  }
  return enviados;
}

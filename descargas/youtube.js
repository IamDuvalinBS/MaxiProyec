import {
  descargarBuffer,
  asegurarVideoCompatibleWhatsApp,
  asegurarAudioCompatibleWhatsApp,
  consultarApiDescarga,
  extraerEnlaceDescarga,
  LIMITE_VIDEO_WHATSAPP_MB
} from "../core.js"; // descargas-core.js vive en motores/ y core.js lo reexporta

// Fusiona lo que era audioyt.js (.ytaudio) y el .ytvideo que faltaba,
// en un solo comando oculto (mismo truco que en youtube.js: un solo
// export default, y adentro se mira con qué alias entró el mensaje).
//
// Para cada formato hay una API "rápida" (ytmp3 / ytmp4) y una de
// "motor" con yt-dlp por detrás (ytdlpmp3 / ytdlpmp4) que se usa
// solo si la rápida falla. No pude probar en vivo la forma exacta
// de la respuesta de estas APIs (el fetch desde acá no conserva los
// parámetros de la URL), así que extraerEnlaceDescarga() en
// descargas-core.js prueba varios campos comunes ("result.url",
// "result.download", "data.url", etc). Si al probar ves que el link
// de descarga viene en otro campo, ajustalo ahí.
const API_YTMP3 = "https://api.alyacore.xyz/dl/ytmp3";
const API_YTDLP_MP3 = "https://api.alyacore.xyz/dl/ytdlpmp3";
const API_YTMP4 = "https://api.alyacore.xyz/dl/ytmp4";
const API_YTDLP_MP4 = "https://api.alyacore.xyz/dl/ytdlpmp4";

// Antes esto era secuencial: probaba la API principal y RECIÉN si
// fallaba (o se agotaba su timeout) arrancaba la de respaldo. Ahora se
// llama a las dos al mismo tiempo y se usa la que responda primero -
// no cambia la calidad de lo que se descarga, solo se deja de esperar
// a que una termine de fallar para recién empezar con la otra.
async function descargarConRespaldo(link, apiPrincipal, apiRespaldo) {
  try {
    return await Promise.any([
      consultarApiDescarga(apiPrincipal, link),
      consultarApiDescarga(apiRespaldo, link)
    ]);
  } catch (e) {
    // Promise.any solo llega aca si las DOS fallaron: junta los motivos.
    const detalles = e.errors ? e.errors.map((err) => err.message).join(" / ") : e.message;
    throw new Error(detalles);
  }
}

export default {
  names: [".ytaudio", ".ytvideo"],
  desc: "Comandos internos: descargan el audio o el video (se disparan desde los botones de .play)",
  category: "Oculto", // "Oculto" no está en ordenCategorias de menu.js, asi que nunca aparece en el .menu
  usage: ".ytaudio <link> | .ytvideo <link>",
  handler: async ({ cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const comando = partes[0].toLowerCase();
    const link = partes[1];
    if (!link) return reply({ text: "❌ Faltó el link del video." });

    const esAudio = comando === ".ytaudio";
    await reply({ text: esAudio ? "⏳ Descargando el audio..." : "⏳ Descargando el video..." });

    try {
      if (esAudio) {
        const json = await descargarConRespaldo(link, API_YTMP3, API_YTDLP_MP3);
        const enlace = extraerEnlaceDescarga(json);
        const audioBuffer = await descargarBuffer(enlace);
        const audioListo = await asegurarAudioCompatibleWhatsApp(audioBuffer);
        await reply({ audio: audioListo, mimetype: "audio/mpeg", ptt: false });
      } else {
        const json = await descargarConRespaldo(link, API_YTMP4, API_YTDLP_MP4);
        const enlace = extraerEnlaceDescarga(json);
        let videoBuffer = await descargarBuffer(enlace);

        const pesoMB = videoBuffer.length / (1024 * 1024);
        if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
          return reply({
            text: `❌ El video pesa ${pesoMB.toFixed(1)}MB, supera el límite de ${LIMITE_VIDEO_WHATSAPP_MB}MB para WhatsApp.`
          });
        }

        videoBuffer = await asegurarVideoCompatibleWhatsApp(videoBuffer);
        await reply({ video: videoBuffer, mimetype: "video/mp4" });
      }
    } catch (e) {
      await reply({ text: `❌ No pude descargar el ${esAudio ? "audio" : "video"}: ${e.message}` });
    }
  }
};

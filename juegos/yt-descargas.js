import { asegurarAudioCompatibleWhatsApp, descargarVideoYoutube, descargarAudioYoutube } from "../core.js";

// Fusiona lo que era audioyt.js (.ytaudio) y el .ytvideo que faltaba, en
// un solo comando oculto. Descarga directo con youtubei.js (motores/youtub.js)
// en vez de una API externa: la API de alyacore.xyz que se probó primero
// resultó ser de pago (401/402), así que se saca esa dependencia por
// completo en vez de andar buscando otra API gratis que puede dejar de
// serlo en cualquier momento.
export default {
  names: [".ytaudio", ".ytvideo"],
  desc: "Comandos internos: descargan el audio o el video (se disparan respondiendo 1/2 a un .play)",
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
        const audioBuffer = await descargarAudioYoutube(link);
        const audioListo = await asegurarAudioCompatibleWhatsApp(audioBuffer);
        await reply({ audio: audioListo, mimetype: "audio/mpeg", ptt: false });
      } else {
        // descargarVideoYoutube ya valida el peso/duracion y re-codifica
        // el video para que WhatsApp lo muestre reproducible (ver
        // motores/youtub.js y motores/descargas-core.js).
        const videoBuffer = await descargarVideoYoutube(link);
        await reply({ video: videoBuffer, mimetype: "video/mp4" });
      }
    } catch (e) {
      await reply({ text: `❌ No pude descargar el ${esAudio ? "audio" : "video"}: ${e.message}` });
    }
  }
};

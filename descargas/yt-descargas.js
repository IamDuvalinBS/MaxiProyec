import { ytmp3 as vredenYtmp3, ytmp4 as vredenYtmp4 } from "@vreden/youtube_scraper";
import { youtube as btchYoutube } from "btch-downloader";
import {
  descargarBuffer,
  asegurarAudioCompatibleWhatsApp,
  asegurarVideoCompatibleWhatsApp,
  descargarVideoYoutube,
  descargarAudioYoutube,
  LIMITE_VIDEO_WHATSAPP_MB
} from "../core.js";

// Fusiona lo que era audioyt.js (.ytaudio) y el .ytvideo que faltaba, en
// un solo comando oculto.
//
// Orden de intentos: primero dos proveedores externos (encontrados en el
// codigo de otro bot que ya los usa, "play.js") que se dedican a esquivar
// el bloqueo anti-bot de YouTube; si los dos fallan o estan caidos, se cae
// como ultimo recurso a descargar directo con youtubei.js (motores/youtub.js),
// que puede fallar mas seguido por el bloqueo que YouTube reforzo este año,
// pero no depende de ningun servicio de terceros.
const PROVEEDORES_AUDIO = [
  {
    nombre: "Vreden",
    obtenerUrl: async (link) => {
      const d = await vredenYtmp3(link);
      return d?.status && d?.download?.url ? d.download.url : null;
    }
  },
  {
    nombre: "Btch",
    obtenerUrl: async (link) => {
      const d = await btchYoutube(link);
      return d?.status && d?.mp3 ? d.mp3 : null;
    }
  }
];

const PROVEEDORES_VIDEO = [
  {
    nombre: "Vreden",
    obtenerUrl: async (link) => {
      const d = await vredenYtmp4(link);
      return d?.status && d?.download?.url ? d.download.url : null;
    }
  },
  {
    nombre: "Btch",
    obtenerUrl: async (link) => {
      const d = await btchYoutube(link);
      return d?.status && d?.mp4 ? d.mp4 : null;
    }
  }
];

async function primeraUrlDeProveedores(link, proveedores) {
  for (const p of proveedores) {
    try {
      const url = await p.obtenerUrl(link);
      if (url) {
        console.log(`[yt-descargas] URL obtenida via ${p.nombre}`);
        return url;
      }
    } catch (e) {
      console.log(`[yt-descargas] Proveedor ${p.nombre} fallo: ${e.message}`);
    }
  }
  return null;
}

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
        const url = await primeraUrlDeProveedores(link, PROVEEDORES_AUDIO);
        const audioBuffer = url ? await descargarBuffer(url) : await descargarAudioYoutube(link);
        const audioListo = await asegurarAudioCompatibleWhatsApp(audioBuffer);
        await reply({ audio: audioListo, mimetype: "audio/mpeg", ptt: false });
      } else {
        const url = await primeraUrlDeProveedores(link, PROVEEDORES_VIDEO);
        let videoBuffer;

        if (url) {
          const buffer = await descargarBuffer(url);
          const pesoMB = buffer.length / (1024 * 1024);
          if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
            return reply({ text: `❌ El video pesa ${pesoMB.toFixed(1)}MB, supera el límite de ${LIMITE_VIDEO_WHATSAPP_MB}MB para WhatsApp.` });
          }
          videoBuffer = await asegurarVideoCompatibleWhatsApp(buffer);
        } else {
          videoBuffer = await descargarVideoYoutube(link); // ya viene validado y listo
        }

        await reply({ video: videoBuffer, mimetype: "video/mp4" });
      }
    } catch (e) {
      await reply({ text: `❌ No pude descargar el ${esAudio ? "audio" : "video"}: ${e.message}` });
    }
  }
};

import axios from "axios";
import fs from "fs";
import path from "path";
import { ytmp3 as vredenYtmp3, ytmp4 as vredenYtmp4 } from "@vreden/youtube_scraper";
import { youtube as btchYoutube } from "btch-downloader";
import {
  asegurarAudioCompatibleWhatsApp,
  asegurarVideoCompatibleWhatsApp,
  descargarVideoYoutube,
  descargarAudioYoutube,
  LIMITE_VIDEO_WHATSAPP_MB
} from "../core.js";

// Fusiona lo que era audioyt.js (.ytaudio) y el .ytvideo que faltaba, en
// un solo comando oculto.
//
// Orden de intentos: primero dos proveedores externos (Vreden y Btch) que
// se dedican a esquivar el bloqueo anti-bot de YouTube; si los dos fallan
// o estan caidos, se cae como ultimo recurso a descargar directo con
// youtubei.js (motores/youtub.js), que puede fallar mas seguido por el
// bloqueo que YouTube reforzo este año, pero no depende de ningun
// servicio de terceros.
//
// CAMBIO CLAVE respecto a la version anterior: antes se bajaba la url de
// Vreden/Btch con descargarBuffer() de core.js (fetch simple, sin
// timeout ni manejo de redirecciones raras), y eso era lo que fallaba.
// Ahora se baja igual que en "play.js" (el bot que si funciona): con
// axios en modo stream, timeout de 120s, escribiendo a un archivo
// temporal y leyendolo despues. Es mucho mas tolerante a como responden
// esos servidores externos.

const tmpDir = path.resolve(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

async function descargarATemporal(url, ext) {
  const tmpPath = path.join(tmpDir, `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  const { data: stream } = await axios.get(url, { responseType: "stream", timeout: 120000 });
  const writer = fs.createWriteStream(tmpPath);
  stream.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
  return tmpPath;
}

async function descargarBufferConfiable(url, ext) {
  const tmpPath = await descargarATemporal(url, ext);
  try {
    return fs.readFileSync(tmpPath);
  } finally {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch { }
    }
  }
}

const PROVEEDORES_AUDIO = [
  {
    nombre: "Vreden",
    obtenerUrl: async (link) => {
      const d = await vredenYtmp3(link);
      if (d?.status && d?.download?.url) return d.download.url;
      console.log(`[yt-descargas] Respuesta cruda de Vreden (audio): ${JSON.stringify(d).slice(0, 300)}`);
      return null;
    }
  },
  {
    nombre: "Btch",
    obtenerUrl: async (link) => {
      const d = await btchYoutube(link);
      if (d?.status && d?.mp3) return d.mp3;
      console.log(`[yt-descargas] Respuesta cruda de Btch (audio): ${JSON.stringify(d).slice(0, 300)}`);
      return null;
    }
  }
];

const PROVEEDORES_VIDEO = [
  {
    nombre: "Vreden",
    obtenerUrl: async (link) => {
      const d = await vredenYtmp4(link);
      if (d?.status && d?.download?.url) return d.download.url;
      console.log(`[yt-descargas] Respuesta cruda de Vreden (video): ${JSON.stringify(d).slice(0, 300)}`);
      return null;
    }
  },
  {
    nombre: "Btch",
    obtenerUrl: async (link) => {
      const d = await btchYoutube(link);
      if (d?.status && d?.mp4) return d.mp4;
      console.log(`[yt-descargas] Respuesta cruda de Btch (video): ${JSON.stringify(d).slice(0, 300)}`);
      return null;
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
      console.log(`[yt-descargas] Proveedor ${p.nombre} respondió sin URL util (revisar formato de respuesta)`);
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
    console.log(`\n[yt-descargas] ==================== HANDLER EJECUTADO ====================`);
    console.log(`[yt-descargas] comando="${comando}" link="${link}"`);
    if (!link) return reply({ text: "❌ Faltó el link del video." });

    const esAudio = comando === ".ytaudio";
    await reply({ text: esAudio ? "⏳ Descargando el audio..." : "⏳ Descargando el video..." });

    try {
      if (esAudio) {
        console.log(`[yt-descargas] Probando proveedores de AUDIO...`);
        const url = await primeraUrlDeProveedores(link, PROVEEDORES_AUDIO);
        console.log(`[yt-descargas] Resultado de proveedores (audio): ${url ? "URL obtenida" : "NINGUNO devolvió URL, cae a youtubei.js"}`);
        const audioBuffer = url ? await descargarBufferConfiable(url, "mp3") : await descargarAudioYoutube(link);
        const audioListo = await asegurarAudioCompatibleWhatsApp(audioBuffer);
        await reply({ audio: audioListo, mimetype: "audio/mpeg", ptt: false });
      } else {
        console.log(`[yt-descargas] Probando proveedores de VIDEO...`);
        const url = await primeraUrlDeProveedores(link, PROVEEDORES_VIDEO);
        console.log(`[yt-descargas] Resultado de proveedores (video): ${url ? "URL obtenida" : "NINGUNO devolvió URL, cae a youtubei.js"}`);
        let videoBuffer;

        if (url) {
          const buffer = await descargarBufferConfiable(url, "mp4");
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


import axios from "axios";
import path from "path";
import { descargarConYtdlp, hayYtdlp } from "../../descargas/redes.js";
import { enviarLote, enviarConReintento } from "../../descargas/envio.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, tarjetaAviso, campo } from "../../descargas/tarjetas.js";
import { LIMITE_DOCUMENTO_MB, nombreSeguro } from "../../descargas/core.js";

// Descargador universal: yt-dlp entiende +1000 páginas (videos, audio, fotos). Si la página no tiene video pero el enlace es un
// archivo directo (zip, pdf, apk, mp3, imagen...), se manda tal cual como documento, en streaming y sin tocarlo.
const MIME = {
  apk: "application/vnd.android.package-archive", zip: "application/zip", pdf: "application/pdf", mp3: "audio/mpeg",
  mp4: "video/mp4", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  rar: "application/vnd.rar", "7z": "application/x-7z-compressed"
};

async function infoArchivoDirecto(url) {
  const r = await axios.head(url, { timeout: 15000, maxRedirects: 5, validateStatus: (s) => s < 400, headers: { "User-Agent": "Mozilla/5.0" } })
    .catch(() => axios.get(url, { timeout: 15000, responseType: "stream", maxRedirects: 5, headers: { "User-Agent": "Mozilla/5.0" } }).then((x) => { x.data.destroy(); return x; }));
  const tipo = String(r.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (!tipo || tipo.startsWith("text/html")) return null;
  const tam = Number(r.headers["content-length"] || 0);
  const cd = /filename\*?=(?:UTF-8'')?"?([^";]+)/i.exec(r.headers["content-disposition"] || "");
  let nombre = cd ? decodeURIComponent(cd[1]) : decodeURIComponent(path.basename(new URL(r.request?.res?.responseUrl || url).pathname)) || "archivo";
  const ext = (nombre.split(".").pop() || "").toLowerCase();
  return { tipo: MIME[ext] || tipo, tam, nombre: nombreSeguro(nombre, "archivo") };
}

export default {
  names: [".dl", ".descargar", ".bajar"],
  usage: ".dl <enlace>",
  desc: "Descarga videos, audios, fotos o archivos de un enlace",
  category: "Descargas",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const enlace = cleanText.trim().split(/\s+/)[1];
    if (!enlace || !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/i.test(enlace)) {
      return reply({
        text: tarjetaUso({ comando: ".dl <enlace>", ejemplo: ".dl https://www.ejemplo.com/video/123", nota: "Funciona con casi cualquier página (YouTube, TikTok, X, Reddit, Vimeo, Dailymotion, etc.) y con enlaces directos a archivos." }),
        mentions: [sender]
      });
    }
    const link = /^https?:\/\//i.test(enlace) ? enlace : `https://${enlace}`;

    const aviso = reply({
      text: tarjetaDescarga({ emoji: "🌐", titulo: "DESCARGA UNIVERSAL", sender, campos: [campo("🔗", "Enlace", link)], nota: "Descargando. Esto puede tardar un poco." }),
      mentions: [sender]
    }).catch(() => {});

    let errorYtdlp = null;
    if (await hayYtdlp()) {
      try {
        const medias = await descargarConYtdlp(link, { playlist: false });
        await aviso;
        const r = await enviarLote(medias, reply, { sock, from, msg });
        if (r.enviados > 0) return;
        errorYtdlp = new Error(r.omitidos ? "El archivo es demasiado pesado para WhatsApp." : (r.ultimoError || "No se pudo enviar."));
      } catch (e) { errorYtdlp = e; }
    }

    // Respaldo: archivo directo
    await aviso;
    try {
      const info = await infoArchivoDirecto(link);
      if (info) {
        if (info.tam / 1048576 > LIMITE_DOCUMENTO_MB) return reply({ text: tarjetaAviso("ARCHIVO MUY PESADO", `Pesa ${(info.tam / 1048576).toFixed(0)} MB, más de lo que admite WhatsApp.`) });
        const esImg = info.tipo.startsWith("image/");
        const esVid = info.tipo.startsWith("video/") && info.tam < 90 * 1048576;
        const contenido = esImg ? { image: { url: link } } : esVid ? { video: { url: link } } : { document: { url: link }, mimetype: info.tipo, fileName: info.nombre };
        await enviarConReintento(reply, contenido);
        return;
      }
    } catch (e) { errorYtdlp = errorYtdlp || e; }

    const sinYtdlp = !(await hayYtdlp());
    return reply({
      text: tarjetaError(
        sinYtdlp ? "Para descargar de cualquier página necesito yt-dlp." : "No pude sacar contenido descargable de ese enlace.",
        sinYtdlp ? 'Instala yt-dlp y ffmpeg (Termux: pkg install python ffmpeg && pip install -U "yt-dlp[default]"; servidor: apt install ffmpeg python3-pip && pip install -U yt-dlp)' : errorYtdlp?.message
      )
    });
  }
};

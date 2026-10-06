import fs from "fs";
import axios from "axios";
import { descargarATemporal, asegurarVideoCompatibleWhatsApp, asegurarImagenCompatibleWhatsApp, LIMITE_VIDEO_WHATSAPP_MB } from "../../descargas/core.js";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

// funciona con la mayoria de sitios sin tener que programar uno por uno.
async function obtenerMediaGenerica(link) {
  const { data: html } = await axios.get(link, { headers: HEADERS, timeout: 15000 });

  const buscar = (prop) => {
    const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"));
    return m ? m[1] : null;
  };

  const video = buscar("og:video:secure_url") || buscar("og:video:url") || buscar("og:video");
  const imagen = buscar("og:image:secure_url") || buscar("og:image:url") || buscar("og:image");

  if (video) return { type: "video", url: video };
  if (imagen) return { type: "image", url: imagen };
  throw new Error("No encontré ningún video o imagen descargable en esa página.");
}

export default {
  names: [".dl", ".descargar"],
  usage: ".dl <link>",
  desc: "Descarga el video o imagen de un link de cualquier página (usa las etiquetas de vista previa del sitio)",
  category: "Descargas",
  handler: async ({ cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/^https?:\/\//i.test(link)) {
      return reply({ text: "📌 Mandame un link así:\n*.dl* https://ejemplo.com/pagina-con-un-video-o-foto" });
    }

    await reply({ text: "⏳ Descargando, dame un segundo..." });

    let ruta;
    try {
      const media = await obtenerMediaGenerica(link);
      ruta = await descargarATemporal(media.url, media.type === "video" ? "mp4" : "img");

      if (media.type === "video") {
        const pesoMB = fs.statSync(ruta).size / (1024 * 1024);
        if (pesoMB > LIMITE_VIDEO_WHATSAPP_MB) {
          return reply({ text: `⚠️ El video pesa ${pesoMB.toFixed(1)}MB, demasiado grande para enviarlo por WhatsApp.` });
        }
        const buffer = await asegurarVideoCompatibleWhatsApp(ruta);
        ruta = null;
        await reply({ video: buffer, mimetype: "video/mp4" });
      } else {
        const buffer = await asegurarImagenCompatibleWhatsApp(ruta);
        ruta = null;
        await reply({ image: buffer, mimetype: "image/jpeg" });
      }
    } catch (e) {
      await reply({ text: `❌ No pude descargar eso: ${e.message}` });
    } finally {
      if (ruta && fs.existsSync(ruta)) fs.unlinkSync(ruta);
    }
  }
};

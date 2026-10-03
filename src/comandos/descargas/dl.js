import axios from "axios";
import { enviarMedias } from "../../descargas/envio.js";
import { descargarConApi, hayProveedores } from "../../descargas/gestor.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

const CABECERAS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
};

async function obtenerMediaGenerica(link) {
  const { data: html } = await axios.get(link, { headers: CABECERAS, timeout: 15000 });

  const buscar = (propiedad) => {
    const coincidencia = html.match(new RegExp(`<meta[^>]+property=["']${propiedad}["'][^>]+content=["']([^"']+)["']`, "i"));
    return coincidencia ? coincidencia[1] : null;
  };

  const video = buscar("og:video:secure_url") || buscar("og:video:url") || buscar("og:video");
  const imagen = buscar("og:image:secure_url") || buscar("og:image:url") || buscar("og:image");

  if (video) return { type: "video", url: video };
  if (imagen) return { type: "image", url: imagen };
  throw new Error("No se encontró ningún video o imagen descargable en esa página.");
}

export default {
  names: [".dl", ".descargar"],
  usage: ".dl <link>",
  desc: "Descarga el contenido de un enlace usando las APIs configuradas o, si no hay, la vista previa del sitio",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const link = cleanText.trim().split(/\s+/)[1];
    if (!link || !/^https?:\/\//i.test(link)) {
      return reply({
        text: tarjetaUso({
          comando: ".dl <enlace>",
          ejemplo: ".dl https://ejemplo.com/pagina-con-un-video",
          nota: "Usa las APIs configuradas y, si fallan, la vista previa de video o imagen de la página."
        }),
        mentions: [sender]
      });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "📥",
        titulo: "DESCARGA GENERAL",
        sender,
        campos: [campo("🔗", "Enlace", link)],
        nota: "Descargando el contenido. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    if (hayProveedores()) {
      try {
        const { buffer, mimetype, categoria, titulo, nombreArchivo } = await descargarConApi(link);
        if (categoria === "video") {
          return await reply({ video: buffer, mimetype, caption: titulo, mentions: [sender] });
        }
        if (categoria === "imagen") {
          return await reply({ image: buffer, caption: titulo, mentions: [sender] });
        }
        return await reply({ document: buffer, mimetype, fileName: nombreArchivo, mentions: [sender] });
      } catch (errorApi) {
        console.error("Fallo la descarga por API:", errorApi.message);
      }
    }

    let media;
    try {
      media = await obtenerMediaGenerica(link);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo obtener el contenido de ese enlace.", e.message) });
    }

    await enviarMedias([media], reply);
  }
};

import { descargarConApi, hayProveedores } from "../../descargas/gestor.js";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

export default {
  names: ["..apidl", ".descargar"],
  usage: ".apidl <enlace>",
  desc: "Descarga el contenido de un enlace usando las APIs configuradas y lo envía como archivo",
  category: "Descargas",
  handler: async ({ sender, cleanText, reply }) => {
    const entrada = cleanText.trim().split(/\s+/).slice(1).join(" ");
    if (!entrada) {
      return reply({
        text: tarjetaUso({
          comando: "..apidl <enlace>",
          ejemplo: "..apidl https://enlace-del-contenido",
          nota: "Envía el enlace del contenido que deseas descargar."
        }),
        mentions: [sender]
      });
    }

    if (!hayProveedores()) {
      return reply({ text: tarjetaError("No hay ninguna API configurada.", "Define DL_PLANTILLA_1 y DL_CLAVE_1 en el archivo .env.") });
    }

    await reply({
      text: tarjetaDescarga({
        emoji: "📥",
        titulo: "DESCARGAS",
        sender,
        campos: [campo("🔗", "Enlace", entrada)],
        nota: "Procesando la descarga. Esto puede tardar unos segundos."
      }),
      mentions: [sender]
    });

    let resultado;
    try {
      resultado = await descargarConApi(entrada);
    } catch (e) {
      return reply({ text: tarjetaError("No se pudo completar la descarga.", e.message) });
    }

    const { buffer, mimetype, categoria, titulo, nombreArchivo } = resultado;

    if (categoria === "video") {
      return reply({ video: buffer, mimetype, caption: titulo, mentions: [sender] });
    }
    if (categoria === "imagen") {
      return reply({ image: buffer, caption: titulo, mentions: [sender] });
    }
    return reply({ document: buffer, mimetype, fileName: nombreArchivo, mentions: [sender] });
  }
};

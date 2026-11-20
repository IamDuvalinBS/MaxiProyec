import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

// AQUÍ ESTÁ LA MAGIA: Tu lista de sitios actualizables.
// Solo agrega o quita sitios de este arreglo si algún link se cae.
const SITIOS = [
  { nombre: "Cuevana 3", url: "https://cuevana3.ai/?s=" },
  { nombre: "PelisPlus", url: "https://pelisplushd.nz/search?q=" },
  { nombre: "Gnula", url: "https://gnula.nu/?s=" },
  { nombre: "PelisPedia", url: "https://pelispedia.tv/?s=" },
  { nombre: "Repelis", url: "https://repelis2.com/search?query=" },
  { nombre: "Cinecalidad", url: "https://www.cinecalidad.ec/search?q=" },
  { nombre: "Tubi (Gratis Legal)", url: "https://tubitv.com/search/" },
  { nombre: "Pluto TV (Gratis Legal)", url: "https://pluto.tv/latam/on-demand/movies?q=" },
  { nombre: "JustWatch (Dónde ver)", url: "https://www.justwatch.com/mx/buscar?q=" }
];

// Función para limpiar el texto y que quede bonito (para títulos con acentos y espacios)
const formatearQuery = (texto) => {
  return encodeURIComponent(texto.trim());
};

export default {
  names: [".pelicula", ".peli", ".cine", ".movie"],
  usage: ".pelicula <título>",
  desc: "Genera enlaces directos a múltiples páginas para ver películas completas.",
  category: "Descargas",

  handler: async ({ sender, cleanText, reply }) => {
    // Extraemos lo que el usuario escribió después del comando
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ").trim();

    // Si no escribió nada, mostramos cómo se usa
    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".pelicula <título>",
          ejemplo: ".pelicula Interestelar\n.pelicula Son como niños",
          nota: "Te daré los links directos para ver la película en varias páginas."
        }),
        mentions: [sender]
      });
    }

    try {
      const queryUrl = formatearQuery(consulta);
      const campos = [];

      // Recorremos la lista de sitios y armamos un campo por cada uno
      SITIOS.forEach((sitio, i) => {
        const enlaceFinal = `${sitio.url}${queryUrl}`;
        
        campos.push(
          campo(
            "🔗", // Emoji para cada campo
            `${sitio.nombre}`,
            `Buscar "${consulta}" aquí:\n${enlaceFinal}`
          )
        );
      });

      const texto = tarjetaDescarga({
        emoji: "🍿",
        titulo: "BUSCADOR DE PELÍCULAS",
        sender,
        campos,
        nota:
          "Toca un enlace para buscar la película en ese sitio. " +
          "Los primeros son para ver online, los últimos son de plataformas legales."
      });

      // Enviamos el mensaje con todos los links
      return reply({
        text: texto,
        mentions: [sender]
      });

    } catch (error) {
      console.error("[pelicula] Error:", error.message);
      return reply({
        text: tarjetaError("Ocurrió un error al generar los enlaces."),
        mentions: [sender]
      });
    }
  }
};

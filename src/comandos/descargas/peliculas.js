import axios from "axios";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

// API de TMDB (La usamos solo para saber el año exacto y el título correcto, no para links legales)
const TMDB_KEY = process.env.TMDB_KEY || "";

// Sitios a los que les vamos a armar el link de búsqueda directo
const SITIOS = [
  { nombre: "123FilmsFree", url: "https://www1.123filmsfree.com/search?q=" },
  { nombre: "Cuevana 3", url: "https://cuevana3.ai/?s=" },
  { nombre: "PelisPlus", url: "https://pelisplushd.nz/search?q=" },
  { nombre: "Gnula", url: "https://gnula.nu/?s=" },
  { nombre: "PelisPedia", url: "https://pelispedia.tv/?s=" },
  { nombre: "Cinecalidad", url: "https://www.cinecalidad.ec/search?q=" },
  { nombre: "Repelis", url: "https://repelis2.com/search?query=" },
  { nombre: "JustWatch (Legal)", url: "https://www.justwatch.com/mx/buscar?q=" }
];

const http = axios.create({ timeout: 10000 });

export default {
  names: [".pelicula", ".peli", ".cine", ".movie"],
  usage: ".pelicula <título>",
  desc: "Busca películas y te da los enlaces directos para verlas completas.",
  category: "Descargas",

  handler: async ({ sender, cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ").trim();

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".pelicula <título>",
          ejemplo: ".pelicula La Venganza del Charro Negro\n.pelicula Interestelar",
          nota: "Te daré los links directos a las páginas donde puedes verla."
        }),
        mentions: [sender]
      });
    }

    try {
      // 1. Buscamos en TMDB para obtener el título exacto y el año (opcional)
      let tituloExacto = consulta;
      let anio = "";
      
      if (TMDB_KEY) {
        try {
          const { data } = await http.get(`https://api.themoviedb.org/3/search/movie`, {
            params: { query: consulta, language: "es-MX", api_key: TMDB_KEY, page: 1 }
          });
          if (data.results && data.results.length > 0) {
            // Tomamos el primer resultado como el más exacto
            tituloExacto = data.results[0].title;
            anio = data.results[0].release_date ? data.results[0].release_date.slice(0, 4) : "";
          }
        } catch (e) {
          console.log("Error buscando en TMDB:", e.message);
        }
      }

      // 2. Preparamos la búsqueda. Si hay año, lo incluimos para que la página pirata 
      // no nos mande a la versión vieja de la película.
      const queryBusqueda = anio ? `${tituloExacto} ${anio}` : tituloExacto;
      const queryUrl = encodeURIComponent(queryBusqueda);

      const campos = [];

      // 3. Armamos la lista de enlaces para el mensaje
      SITIOS.forEach((sitio) => {
        campos.push(
          campo(
            "🎬", 
            sitio.nombre, 
            `${sitio.url}${queryUrl}`
          )
        );
      });

      const texto = tarjetaDescarga({
        emoji: "🍿",
        titulo: `PELÍCULA: ${tituloExacto} ${anio ? `(${anio})` : ""}`,
        sender,
        campos,
        nota: "Toca un enlace para ir directo a la página donde se reproduce. Si una página falla, prueba con otra de la lista."
      });

      return reply({ text: texto, mentions: [sender] });

    } catch (error) {
      console.error("[pelicula] Error:", error.message);
      return reply({
        text: tarjetaError("Ocurrió un error al generar los enlaces."),
        mentions: [sender]
      });
    }
  }
};

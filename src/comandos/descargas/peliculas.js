import axios from "axios";
import * as cheerio from "cheerio";
import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";

// Motor Axios con headers de navegador
const http = axios.create({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "es-MX,es;q=0.9"
  }
});

// Scrapea JustWatch y devuelve el link directo de la película
async function buscarEnJustWatch(titulo) {
  try {
    // JustWatch tiene un buscador que devuelve JSON puro (más fácil de scrapear)
    const url = `https://www.justwatch.com/mx/buscar?q=${encodeURIComponent(titulo)}`;
    const { data } = await http.get(url);
    
    // Extraemos el JSON que tiene los datos de la búsqueda (está incrustado en el HTML)
    const $ = cheerio.load(data);
    let scriptContent = "";
    
    $('script').each((i, el) => {
      const text = $(el).html();
      if (text && text.includes('window.__INITIAL_STATE__')) {
        scriptContent = text;
      }
    });

    if (!scriptContent) return null;

    // Buscamos el ID de la película en el JSON (JustWatch usa un formato específico)
    const jsonMatch = scriptContent.match(/window\.__INITIAL_STATE__ = ({.+});/);
    if (!jsonMatch) return null;

    const state = JSON.parse(jsonMatch[1]);
    const items = state?.search?.results?.items || [];
    
    if (items.length === 0) return null;

    // Tomamos el primer resultado (el más exacto)
    const peli = items[0];
    
    // JustWatch usa un formato de URL: /mx/pelicula/El-Titulo
    // El ID interno se puede usar, pero el slug es más limpio.
    const tipo = peli.entity_type === "show" ? "serie" : "pelicula";
    const slug = peli.full_path; // JustWatch ya nos da la ruta exacta

    return `https://www.justwatch.com${slug}`;
    
  } catch (error) {
    console.error("Error scrapeando JustWatch:", error.message);
    return null;
  }
}

export default {
  names: [".pelicula", ".peli", ".cine", ".movie"],
  usage: ".pelicula <título>",
  desc: "Busca películas y te da el link directo a donde puedes verla.",
  category: "Descargas",

  handler: async ({ sender, cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ").trim();

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".pelicula <título>",
          ejemplo: ".pelicula Interestelar\n.pelicula La Venganza del Charro Negro",
          nota: "Busco la película y te paso el link directo."
        }),
        mentions: [sender]
      });
    }

    try {
      await reply({ text: `🔎 Buscando "${consulta}"...`, mentions: [sender] });

      // Scrapeamos JustWatch
      const linkPelicula = await buscarEnJustWatch(consulta);
      
      const campos = [];

      if (linkPelicula) {
        campos.push(
          campo("🎬", "JustWatch (Link directo)", linkPelicula)
        );
      }

      // Links de búsqueda para que el usuario pueda intentar en otros sitios
      const queryUrl = encodeURIComponent(consulta);
      campos.push(
        campo("🍿", "123FilmsFree", `https://123filmsfree.com/?s=${queryUrl}`),
        campo("🍿", "PelisPlus", `https://pelisplushd.nz/search?q=${queryUrl}`),
        campo("🍿", "Cinecalidad", `https://www.cinecalidad.ec/search?q=${queryUrl}`),
        campo("🍿", "PelisPedia", `https://pelispedia.tv/?s=${queryUrl}`)
      );

      const texto = tarjetaDescarga({
        emoji: "🍿",
        titulo: `PELÍCULA: ${consulta}`,
        sender,
        campos,
        nota: linkPelicula 
          ? "El primer link te lleva directo a la película en JustWatch. Los demás son buscadores por si prefieres otra opción."
          : "No encontré un link directo en JustWatch, pero puedes probar los buscadores de abajo."
      });

      return reply({ text: texto, mentions: [sender] });

    } catch (error) {
      console.error("[pelicula] Error:", error.message);
      return reply({
        text: tarjetaError("Ocurrió un error al buscar la película."),
        mentions: [sender]
      });
    }
  }
};

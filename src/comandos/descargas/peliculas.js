import { tarjetaDescarga, tarjetaUso, tarjetaError, campo } from "../../descargas/tarjetas.js";
import { buscarWeb, recortar } from "../../../motores/google-buscador.js";

// Busca la película en la web (Bing / DuckDuckGo, el mismo motor del comando .google)
// y manda las páginas donde se puede ver, igual que cuando la buscas tú en el navegador.

// Páginas que salen en la búsqueda pero NO sirven para ver la película.
const NO_SIRVEN =
  /(^|\.)(imdb\.com|themoviedb\.org|filmaffinity\.com|rottentomatoes\.com|letterboxd\.com|wikipedia\.org|wikiwand\.com|youtube\.com|youtu\.be|facebook\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|reddit\.com|pinterest\.[a-z.]+|bing\.com|google\.[a-z.]+|omelete\.com\.mx|infobae\.com|milenio\.com|eluniversal\.com\.mx|marca\.com|ign\.com|sensacine\.com|fandom\.com|justwatch\.com)$/i;

const PALABRAS_VACIAS = new Set(["el", "la", "los", "las", "de", "del", "un", "una", "y", "en", "the", "of"]);

const sinTildes = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function tokens(t) {
  return sinTildes(t).replace(/[^a-z0-9]+/g, " ").split(" ").filter((p) => p && !PALABRAS_VACIAS.has(p));
}

// Qué tanto del título buscado aparece en el resultado (0 a 1).
function cobertura(consulta, texto) {
  const q = tokens(consulta);
  if (!q.length) return 0;
  const t = new Set(tokens(texto));
  return q.filter((p) => t.has(p)).length / q.length;
}

const PISTAS_VER = /\b(ver|online|completa|gratis|latino|castellano|doblaje|subtitulad[ao]|hd|1080|720|reproducir|streaming|descargar|pelicula)\b/;

function puntaje(consulta, r) {
  const base = cobertura(consulta, `${r.titulo} ${r.url}`) * 3;
  const pistas = PISTAS_VER.test(sinTildes(`${r.titulo} ${r.texto} ${r.url}`)) ? 1 : 0;
  return base + pistas;
}

const dominio = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export default {
  names: [".pelicula", ".peli", ".cine", ".movie"],
  usage: ".pelicula <título>",
  desc: "Busca en la web dónde ver la película completa y manda los enlaces.",
  category: "Descargas",

  handler: async ({ sender, cleanText, reply }) => {
    const consulta = cleanText.trim().split(/\s+/).slice(1).join(" ").trim();

    if (!consulta) {
      return reply({
        text: tarjetaUso({
          comando: ".pelicula <título>",
          ejemplo: ".pelicula Interestelar\n.pelicula Son como niños",
          nota: "Busco en internet dónde ver la película y te paso los links."
        }),
        mentions: [sender]
      });
    }

    try {
      await reply({ text: `🔎 Buscando "${consulta}"...`, mentions: [sender] });

      // Varias formas de preguntarlo, como lo haría una persona. Todas en paralelo.
      const consultas = [
        `${consulta} película completa online`,
        `ver ${consulta} online gratis español latino`
      ];
      const respuestas = await Promise.allSettled(consultas.map((q) => buscarWeb(q)));

      const vistos = new Set();
      const candidatos = [];
      for (const r of respuestas) {
        if (r.status !== "fulfilled") {
          console.log("[pelicula] búsqueda falló:", r.reason?.message);
          continue;
        }
        for (const it of r.value.items || []) {
          const host = dominio(it.url);
          if (NO_SIRVEN.test(host) || vistos.has(it.url)) continue;
          vistos.add(it.url);
          candidatos.push({ ...it, p: puntaje(consulta, it) });
        }
      }

      // Solo los que de verdad hablan de esa película, y máximo 2 por dominio.
      const porDominio = new Map();
      const elegidos = candidatos
        .filter((c) => c.p >= 2)
        .sort((a, b) => b.p - a.p)
        .filter((c) => {
          const d = dominio(c.url);
          const n = porDominio.get(d) || 0;
          porDominio.set(d, n + 1);
          return n < 2;
        })
        .slice(0, 6);

      const campos = elegidos.map((c) => campo("🎬", c.dominio || dominio(c.url), `${recortar(c.titulo, 70)}\n${c.url}`));

      const q = encodeURIComponent(consulta);
      campos.push(campo("🔗", "JustWatch (dónde verla legal)", `https://www.justwatch.com/mx/buscar?q=${q}`));

      if (!elegidos.length) {
        campos.push(campo("🔍", "Buscar en Google", `https://www.google.com/search?q=${encodeURIComponent(`ver ${consulta} online`)}`));
      }

      const texto = tarjetaDescarga({
        emoji: "🍿",
        titulo: "BUSCADOR DE PELÍCULAS",
        sender,
        campos,
        nota: elegidos.length
          ? "Estas son las páginas donde la encontré. Si una no abre, prueba con otra."
          : "No encontré páginas con esa película. Revisa el título o usa los enlaces de abajo."
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

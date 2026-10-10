import { obtenerMediaInstagram, buscarInstagram } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".ig", ".instagram"],
  desc: "Descarga reels, fotos y carruseles de Instagram, o busca reels y envía 5 (hasta 10: .ig 8 búsqueda)",
  emoji: "📸",
  titulo: "INSTAGRAM DOWNLOAD",
  regexLink: /instagr(?:\.am|am\.com)\/(?:share\/)?(?:p|reel|reels|tv)\//i,
  ejemploLink: ".ig https://www.instagram.com/reel/xxxxxxx/",
  ejemploBusqueda: ".ig recetas rápidas   |   .ig 8 recetas rápidas",
  obtenerPorLink: obtenerMediaInstagram,
  buscar: buscarInstagram
});

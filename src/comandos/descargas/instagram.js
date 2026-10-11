import { obtenerMediaInstagram } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".ig", ".instagram"],
  desc: "Descarga reels, fotos y carruseles de Instagram por enlace",
  emoji: "📸",
  titulo: "INSTAGRAM DOWNLOAD",
  regexLink: /instagr(?:\.am|am\.com)\/(?:share\/)?(?:p|reel|reels|tv)\//i,
  ejemploLink: ".ig https://www.instagram.com/reel/xxxxxxx/",
  obtenerPorLink: obtenerMediaInstagram,
  notaSinBusqueda: "Instagram no permite buscar desde el bot. Envía el enlace del reel o post."
});

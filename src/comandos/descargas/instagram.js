import { obtenerMediaInstagram, buscarInstagram } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".ig", ".instagram"],
  desc: "Descarga reels, fotos y carruseles de Instagram por enlace, o envía los últimos reels de una cuenta (.ig 8 usuario)",
  emoji: "📸",
  titulo: "INSTAGRAM DOWNLOAD",
  regexLink: /instagr(?:\.am|am\.com)\/(?:share\/)?(?:p|reel|reels|tv)\//i,
  ejemploLink: ".ig https://www.instagram.com/reel/xxxxxxx/",
  ejemploBusqueda: ".ig darklightvu   |   .ig 8 darklightvu",
  obtenerPorLink: obtenerMediaInstagram,
  buscar: buscarInstagram,
  notaSinArgumentos:
    "Falta el enlace de Instagram. Para descargar un reel, una publicación o un video, escribe el comando seguido de su enlace, tal como aparece en el ejemplo. Para copiarlo, abre la publicación en Instagram, toca «Compartir» y elige «Copiar enlace»."
});

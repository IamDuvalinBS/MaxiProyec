import { obtenerMediaReddit } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".reddit"],
  desc: "Descarga el video, la imagen o la galería de un post de Reddit",
  emoji: "👽",
  titulo: "REDDIT DOWNLOAD",
  regexLink: /reddit\.com|redd\.it/i,
  ejemploLink: ".reddit https://www.reddit.com/r/comunidad/comments/abc123/titulo/",
  obtenerPorLink: obtenerMediaReddit
});

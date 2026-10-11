import { obtenerMediaFacebook } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".fb", ".facebook"],
  desc: "Descarga videos y reels públicos de Facebook por enlace",
  emoji: "📘",
  titulo: "FACEBOOK DOWNLOAD",
  regexLink: /facebook\.com|fb\.watch|fb\.com/i,
  ejemploLink: ".fb https://www.facebook.com/reel/123456789",
  obtenerPorLink: obtenerMediaFacebook,
  notaSinBusqueda: "Facebook no permite buscar desde el bot. Envía el enlace del video o reel."
});

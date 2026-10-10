import { obtenerMediaFacebook, buscarFacebook } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".fb", ".facebook"],
  desc: "Descarga videos y reels públicos de Facebook, o busca videos y envía 5 (hasta 10: .fb 8 búsqueda)",
  emoji: "📘",
  titulo: "FACEBOOK DOWNLOAD",
  regexLink: /facebook\.com|fb\.watch|fb\.com/i,
  ejemploLink: ".fb https://www.facebook.com/reel/123456789",
  ejemploBusqueda: ".fb cocina mexicana   |   .fb 8 cocina mexicana",
  obtenerPorLink: obtenerMediaFacebook,
  buscar: buscarFacebook
});

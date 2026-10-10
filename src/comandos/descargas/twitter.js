import { obtenerMediaTwitter } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".x", ".twitter"],
  desc: "Descarga videos o fotos de un post de X (Twitter)",
  emoji: "🐦",
  titulo: "X DOWNLOAD",
  regexLink: /(?:^|\/\/|\.)(?:twitter|x)\.com\//i,
  ejemploLink: ".x https://x.com/usuario/status/123456789",
  obtenerPorLink: obtenerMediaTwitter
});

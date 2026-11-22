import { obtenerMediaPinterest, buscarPinterest } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".pin", ".pinterest"],
  desc: "Descarga un pin o busca imágenes en Pinterest",
  emoji: "📌",
  titulo: "PINTEREST DOWNLOAD",
  regexLink: /pinterest\.[a-z.]+\/pin|pin\.it/i,
  ejemploLink: ".pin https://www.pinterest.com/pin/123456789/",
  ejemploBusqueda: ".pin gatos graciosos   |   .pin 8 gatos graciosos",
  obtenerPorLink: obtenerMediaPinterest,
  buscar: buscarPinterest
});

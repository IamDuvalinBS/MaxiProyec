import { obtenerMediaPinterest, buscarPinterest } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".pin", ".pinterest"],
  desc: "Descarga la imagen o el video de un pin de Pinterest, o busca y envía 5 resultados (hasta 10: .pin 8 búsqueda)",
  emoji: "📌",
  titulo: "PINTEREST DOWNLOAD",
  regexLink: /pinterest\.[a-z.]+\/pin|pin\.it/i,
  ejemploLink: ".pin https://www.pinterest.com/pin/123456789/",
  ejemploBusqueda: ".pin gatos graciosos   |   .pin 8 gatos graciosos",
  obtenerPorLink: obtenerMediaPinterest,
  buscar: buscarPinterest
});

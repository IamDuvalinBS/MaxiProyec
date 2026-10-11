import { buscarCuentaTikTok } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

export default crearComandoRed({
  names: [".tt2", ".tiktok2"],
  desc: "Descarga los últimos videos de una cuenta de TikTok (5 por defecto, hasta 10: .tt2 8 usuario)",
  emoji: "🎵",
  titulo: "TIKTOK 2 DOWNLOAD",
  regexLink: /tiktok\.com\/@[\w.\-]+\/?(?:\?.*)?$/i,
  ejemploLink: ".tt2 https://www.tiktok.com/@usuario",
  ejemploBusqueda: ".tt2 usuario   |   .tt2 8 usuario",
  obtenerPorLink: (link) => buscarCuentaTikTok(link, 5),
  buscar: buscarCuentaTikTok,
  notaSinArgumentos:
    "Falta el nombre de la cuenta. Escribe el comando seguido del usuario de TikTok (con o sin @) o del enlace de su perfil, y enviaré sus últimos videos. Para elegir cuántos, pon el número antes del usuario."
});

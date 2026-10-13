import { obtenerMediaTikTok, buscarTikTok } from "../../descargas/redes.js";
import { crearComandoRed } from "../../descargas/comando-red.js";

// Dos formatos de enlace: el antiguo y el nuevo (tt.site, posible cambio regional o beta).
const REGEX_LINK_ANTIGUO = /tiktok\.com/i;
const REGEX_LINK_NUEVO = /(^|\/\/|\.)tt\.site\//i;

export default crearComandoRed({
  names: [".tiktok", ".tt"],
  desc: "Descarga videos, fotos e historias de TikTok sin marca de agua, o busca y envía 5 videos (hasta 10: .tt 8 búsqueda)",
  emoji: "🎵",
  titulo: "TIKTOK DOWNLOAD",
  regexLink: { test: (s) => REGEX_LINK_ANTIGUO.test(s) || REGEX_LINK_NUEVO.test(s) },
  ejemploLink: ".tt https://www.tiktok.com/@usuario/video/123456789",
  ejemploBusqueda: ".tt corte clásico   |   .tt 8 corte clásico",
  obtenerPorLink: obtenerMediaTikTok,
  buscar: buscarTikTok
});

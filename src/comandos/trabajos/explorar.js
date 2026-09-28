import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "explorar",
  names: [".explorar", ".investigar"],
  desc: "Exploración, ganancia media-alta (cada 1 hora y 30 minutos)",
  emoji: "🗺️",
  tituloExito: "EXPLORACIÓN COMPLETADA",
  cooldownMs: 90 * 60 * 1000,
  exitos: [
    { texto: "Encontraste unas ruinas vacías sin objetos de valor.", min: 20, max: 60 },
    { texto: "Hallaste un mapa antiguo y lo vendiste a un coleccionista.", min: 150, max: 300 },
    { texto: "Descubriste una cueva con objetos antiguos.", min: 250, max: 450 },
    { texto: "Localizaste una cámara secreta repleta de oro.", min: 600, max: 1000 },
    { texto: "Recuperaste reliquias de un templo abandonado.", min: 300, max: 520 },
    { texto: "Cartografiaste una zona inexplorada y recibiste una recompensa.", min: 180, max: 340 }
  ]
});

import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "explorar",
  names: [".explorar", ".investigar"],
  desc: "Exploración, ganancia media-alta (cada 1 hora y 30 minutos)",
  emoji: "🗺️",
  tituloExito: "EXPLORACIÓN COMPLETADA",
  cooldownMs: 90 * 60 * 1000,
  exitos: [
    { texto: "Recorriste un sendero sin encontrar nada fuera de lo común.", min: 15, max: 50 },
    { texto: "Encontraste unas ruinas vacías sin objetos de valor.", min: 20, max: 60 },
    { texto: "Recolectaste hierbas medicinales y las vendiste a un boticario.", min: 60, max: 130 },
    { texto: "Hallaste monedas antiguas enterradas junto a un río.", min: 120, max: 240 },
    { texto: "Hallaste un mapa antiguo y lo vendiste a un coleccionista.", min: 150, max: 300 },
    { texto: "Cartografiaste una zona inexplorada y recibiste una recompensa.", min: 180, max: 340 },
    { texto: "Rescataste a un viajero perdido y recibiste una recompensa.", min: 200, max: 380 },
    { texto: "Descubriste una cueva con objetos antiguos.", min: 250, max: 450 },
    { texto: "Recuperaste reliquias de un templo abandonado.", min: 300, max: 520 },
    { texto: "Descubriste un cofre hundido en un lago de montaña.", min: 450, max: 800 },
    { texto: "Localizaste una cámara secreta repleta de oro.", min: 600, max: 1000 },
    { texto: "Encontraste los restos de una expedición olvidada con su tesoro intacto.", min: 700, max: 1200 }
  ]
});

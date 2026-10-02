import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "minar",
  names: [".minar", ".mine"],
  desc: "Minería, ganancia media (cada 40 minutos)",
  emoji: "⛏️",
  tituloExito: "MINERÍA EXITOSA",
  cooldownMs: 40 * 60 * 1000,
  exitos: [
    { texto: "Extrajiste piedras comunes de bajo valor.", min: 20, max: 50 },
    { texto: "Extrajiste arcilla y arena de buena calidad.", min: 25, max: 60 },
    { texto: "Obtuviste una cantidad regular de carbón.", min: 60, max: 120 },
    { texto: "Recolectaste cobre suficiente para venderlo.", min: 90, max: 160 },
    { texto: "Encontraste un filón de estaño.", min: 100, max: 180 },
    { texto: "Descubriste un yacimiento de hierro.", min: 120, max: 220 },
    { texto: "Extrajiste un cargamento de cuarzo.", min: 150, max: 260 },
    { texto: "Localizaste una veta de plata.", min: 200, max: 350 },
    { texto: "Recolectaste esmeraldas pequeñas en una galería lateral.", min: 300, max: 520 },
    { texto: "Descubriste una veta de oro en la pared del túnel.", min: 450, max: 800 },
    { texto: "Hallaste un diamante en bruto de gran valor.", min: 500, max: 900 },
    { texto: "Localizaste una geoda con cristales de gran pureza.", min: 600, max: 1000 }
  ]
});

import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "mazmorra",
  names: [".mazmorra", ".castillo"],
  desc: "Máximo riesgo, máxima recompensa (cada 2 horas)",
  emoji: "🏰",
  tituloExito: "MAZMORRA SUPERADA",
  tituloFallo: "MAZMORRA FALLIDA",
  emojiFallo: "☠️",
  chanceFallo: 0.55,
  cooldownMs: 120 * 60 * 1000,
  exitos: [
    { texto: "Derrotaste a un esqueleto y obtuviste monedas antiguas.", min: 200, max: 400 },
    { texto: "Saqueaste un cofre pequeño escondido en la mazmorra.", min: 400, max: 700 },
    { texto: "Derrotaste al jefe final y obtuviste el tesoro real.", min: 900, max: 1500 },
    { texto: "Superaste una sala de trampas y recogiste el botín.", min: 500, max: 800 }
  ],
  fallos: [
    { texto: "Sufriste una emboscada dentro del castillo.", min: 200, max: 500 },
    { texto: "Caíste en una trampa mortal y perdiste parte de tu equipo.", min: 250, max: 600 },
    { texto: "Un guardián te derrotó y debiste retirarte de la mazmorra.", min: 300, max: 700 }
  ]
});

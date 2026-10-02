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
    { texto: "Encontraste unas cuantas monedas entre los escombros de la entrada.", min: 100, max: 220 },
    { texto: "Derrotaste a un grupo de murciélagos y recogiste lo que dejaron.", min: 150, max: 300 },
    { texto: "Derrotaste a un esqueleto y obtuviste monedas antiguas.", min: 200, max: 400 },
    { texto: "Resolviste el acertijo de una puerta sellada y accediste a una sala secreta.", min: 350, max: 600 },
    { texto: "Saqueaste un cofre pequeño escondido en la mazmorra.", min: 400, max: 700 },
    { texto: "Rescataste a un prisionero que te recompensó con su fortuna.", min: 450, max: 750 },
    { texto: "Superaste una sala de trampas y recogiste el botín.", min: 500, max: 800 },
    { texto: "Descubriste una armería abandonada y vendiste su contenido.", min: 500, max: 850 },
    { texto: "Eliminaste a un golem de piedra y extrajiste su núcleo.", min: 600, max: 950 },
    { texto: "Derrotaste al jefe final y obtuviste el tesoro real.", min: 900, max: 1500 },
    { texto: "Venciste a un dragón joven y reuniste parte de su tesoro.", min: 1000, max: 1600 },
    { texto: "Reclamaste la corona del rey caído en la cámara más profunda.", min: 1200, max: 1800 }
  ],
  fallos: [
    { texto: "Sufriste una emboscada dentro del castillo.", min: 200, max: 500 },
    { texto: "Caíste en una trampa mortal y perdiste parte de tu equipo.", min: 250, max: 600 },
    { texto: "Un guardián te derrotó y debiste retirarte de la mazmorra.", min: 300, max: 700 }
  ]
});

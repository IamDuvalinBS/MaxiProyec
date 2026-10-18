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
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🏰",
    tituloExito: "CRIPTA SUPERADA",
    tituloFallo: "CRIPTA FATAL",
    emojiFallo: "⚰️",
    exitos: [
      "Encontraste unas monedas en la entrada de la cripta; algunas aún estaban tibias, mejor no pensar por qué 🪙.",
      "Derrotaste una nube de murciélagos y recogiste lo que dejaron, que no fueron cosas lindas 🦇.",
      "Derrotaste a un esqueleto; se quejó de la espalda y te dio monedas por lástima 💀.",
      "Resolviste el acertijo de un sarcófago; la momia dijo 'pasa' y pidió que cerraras la puerta ⚰️.",
      "Saqueaste un cofre tras una telaraña gigante; la araña dueña te dejó, siempre que no volvieras 🕸️.",
      "Rescataste a un fantasma prisionero que te dio su fortuna... y su dirección por si querías visitarlo 👻.",
      "Superaste una sala de trampas con pinchos; el esqueleto de la entrada dejó una nota: 'yo no pude' 🕷️.",
      "Descubriste una armería encantada; las espadas se quejaban de que nadie las afilaba, las vendiste igual ⚔️.",
      "Eliminaste a una momia y sacaste las joyas de sus vendas; juró volver, pero lleva 3000 años diciéndolo 🧟.",
      "Derrotaste al vampiro jefe final; antes de desvanecerse pidió que no contaras que lo venció alguien nivel 3 🧛.",
      "Venciste a un dragón esqueleto; no quedó nada del dragón, solo su tesoro y un reclamo legal 🐉.",
      "Reclamaste la corona del rey caído; el rey fantasma dijo que te la prestaba 'por tiempo indefinido' 👑."
    ],
    fallos: [
      "Te emboscaron zombis; intentaste razonar con ellos, pero solo pedían cerebro y ninguno tenía wifi 🧟.",
      "Caíste en una trampa mortal y perdiste parte del equipo; el esqueleto de la entrada murmuró 'te lo advertí' 🕷️.",
      "Un guardián espectral te derrotó; huiste tan rápido que hasta tu sombra se quedó atrás 👻."
    ]
  },
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

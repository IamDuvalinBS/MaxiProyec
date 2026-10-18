import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "niñero",
  names: [".niñero", ".cuidador"],
  desc: "Cuidado de niños, pago alto con riesgo de descuido (cada 1 hora)",
  emoji: "🍼",
  tituloExito: "CUIDADO EXITOSO",
  tituloFallo: "INCIDENTE DURANTE EL CUIDADO",
  emojiFallo: "😭",
  chanceFallo: 0.25,
  cooldownMs: 60 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🕯️",
    tituloExito: "CUIDADO NOCTURNO EXITOSO",
    tituloFallo: "INCIDENTE EMBRUJADO",
    emojiFallo: "😱",
    exitos: [
      "Preparaste la merienda de unos niños disfrazados de monstruos; el más pequeño se comió el plato de cartón y todo 🧸.",
      "Leíste un cuento de fantasmas hasta dormirlos; desde la página tres el cuento se leía solo 📖.",
      "Cuidaste al bebé vampiro de Sarita y Duva; solo pidió leche... tibia y de color rojo 🧛🍼.",
      "Acompañaste a los niños al truco o trato; regresaron con las bolsas llenas y un fantasma extra que no se quiso ir 🎃.",
      "Ayudaste con la tarea de unos niños; el de ciencias resultó ser un Frankenstein en miniatura 🧟‍♂️.",
      "Organizaste una fiesta de cumpleaños de Halloween; el invitado sorpresa fue la Catrina y repartió pastel 🎂💀.",
      "Dormiste al bebé sin llanto; hasta el trueno se quedó callado para no despertarlo 🌩️.",
      "Cuidaste a tres niños zombis; lo único que pidieron fue pizza con cerebro... de pepperoni, claro 🍕.",
      "Resolviste un susto con un fantasma con calma y los papás se impresionaron; el fantasma pidió trabajo 👻.",
      "Los padres te dejaron propina; la mamá era bruja y la propina vino con un hechizo de suerte 🍬✨.",
      "Calmaste al bebé durante toda la tormenta; la cuna flotaba, pero el bebé estaba feliz 🌙.",
      "Los niños te nombraron cuidador oficial y te dieron un bono; el contrato lo firmó hasta el hombre lobo del primer piso 👑🐺."
    ],
    fallos: [
      "Te quedaste dormido y el bebé lloró por los truenos; al despertar, el bebé consolaba a un fantasma 🌩️.",
      "Los niños llegaron con hambre y llenos de dulces; el más chico se comió tu zapato y la tarea del vecino 🍭.",
      "Olvidaste preparar la cena de Halloween; los niños se disfrazaron de ti con cara de susto y cobraron ellos 🎃."
    ]
  },
  exitos: [
    { texto: "Preparaste la merienda de los niños y los acostaste a tiempo.", min: 1000, max: 2000 },
    { texto: "Leíste un cuento hasta que los niños se durmieron.", min: 1000, max: 2200 },
    { texto: "Cuidaste correctamente al bebé de Sarita y Duva.", min: 1000, max: 3000 },
    { texto: "Acompañaste a los niños al parque y regresaron a casa sin un solo rasguño.", min: 1200, max: 2500 },
    { texto: "Ayudaste con las tareas escolares de los niños y los acostaste a tiempo.", min: 1500, max: 3500 },
    { texto: "Organizaste una pequeña fiesta de cumpleaños sin contratiempos.", min: 2000, max: 3500 },
    { texto: "Lograste que el bebé durmiera por primera vez sin llorar.", min: 2000, max: 3800 },
    { texto: "Cuidaste a tres niños a la vez sin perder la calma.", min: 2500, max: 4200 },
    { texto: "Resolviste una pequeña emergencia con serenidad y los padres lo agradecieron.", min: 2800, max: 4500 },
    { texto: "Los padres te dejaron una propina por tu excelente desempeño.", min: 3000, max: 4800 },
    { texto: "Mantuviste tranquilo al bebé durante toda la noche y recibiste una excelente calificación.", min: 3000, max: 5000 },
    { texto: "Los niños pidieron que fueras su cuidador oficial y te asignaron un bono mensual.", min: 3500, max: 5000 }
  ],
  fallos: [
    { texto: "Te quedaste dormido mientras el bebé lloraba.", min: 1000, max: 3000 },
    { texto: "El bebé llegó a su casa con mucha hambre por una falta de atención.", min: 2000, max: 5000 },
    { texto: "Olvidaste preparar la cena de los niños.", min: 1000, max: 2500 }
  ]
});

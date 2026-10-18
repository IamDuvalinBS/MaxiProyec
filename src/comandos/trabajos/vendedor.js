import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "vendedor",
  names: [".vendedor", ".ambulante"],
  desc: "Ventas ambulantes, ganancia pequeña pero segura (cada 30 minutos)",
  emoji: "🌭",
  tituloExito: "VENTA REALIZADA",
  cooldownMs: 30 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🎃",
    tituloExito: "VENTA EMBRUJADA REALIZADA",
    exitos: [
      "Vendiste globos de fantasma en una feria; uno se soltó y se fue solo, nadie sabe si era globo 👻.",
      "Vendiste hot dogs momificados en la esquina; los clientes dijeron que 'saben a historia' 🌭.",
      "Vendiste dulces artesanales a la salida de una escuela disfrazada; uno de los 'niños' pidió factura y tenía colmillos 🍬.",
      "Vendiste máscaras de terror en un semáforo; una se pegó sola a un conductor y se la quedó 🎭.",
      "Vendiste elotes con sabor a calabaza en la plaza; la Catrina pidió dos y pagó con monedas de colores 🌽💀.",
      "Vendiste paletas de calavera en el parque; los clientes decían que las paletas les sonreían 🍭.",
      "Vendiste pociones de colores en un evento de terror; la verde cura la tos, la roja mejor no preguntes 🧪.",
      "Ofreciste velas en plena tormenta y se agotaron; un fantasma compró todas y agradeció la luz 🕯️.",
      "Vendiste cempasúchil para las ofrendas de Día de Muertos; los difuntos pasaron a agradecerte 🌼.",
      "Vendiste disfraces antes de la gran noche; el de vampiro se vendió tan bien que casi no quedan vampiros 🧛.",
      "Vendiste gatos negros de artesanía a turistas; uno maulló y nadie sabe de qué lado lo hizo 🐈‍⬛.",
      "Atendiste un puesto en el mercado de Halloween; la clienta de las 3:00 a. m. nunca tocó el suelo con los pies 🎃."
    ]
  },
  exitos: [
    { texto: "Vendiste globos durante una feria local.", min: 35, max: 75 },
    { texto: "Vendiste hot dogs en la esquina de una avenida.", min: 40, max: 80 },
    { texto: "Vendiste dulces artesanales a la salida de una escuela.", min: 45, max: 95 },
    { texto: "Vendiste gorras y accesorios en un semáforo concurrido.", min: 50, max: 100 },
    { texto: "Vendiste elotes en la plaza principal.", min: 55, max: 105 },
    { texto: "Vendiste helados en el parque durante la tarde.", min: 60, max: 110 },
    { texto: "Vendiste bebidas frías durante un evento deportivo.", min: 70, max: 130 },
    { texto: "Ofreciste paraguas en plena lluvia y se agotaron enseguida.", min: 80, max: 150 },
    { texto: "Vendiste flores el día de San Valentín.", min: 100, max: 170 },
    { texto: "Vendiste camisetas a los aficionados antes de un partido.", min: 110, max: 190 },
    { texto: "Vendiste artesanías a un grupo de turistas.", min: 130, max: 220 },
    { texto: "Atendiste un puesto en el mercado durante la temporada alta.", min: 150, max: 260 }
  ]
});

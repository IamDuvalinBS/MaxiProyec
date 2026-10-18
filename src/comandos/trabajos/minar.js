import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "minar",
  names: [".minar", ".mine"],
  desc: "Minería, ganancia media (cada 40 minutos)",
  emoji: "⛏️",
  tituloExito: "MINERÍA EXITOSA",
  cooldownMs: 40 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "⛏️",
    tituloExito: "MINA MALDITA EXITOSA",
    exitos: [
      "Extrajiste piedras sombrías de bajo valor; una tenía grabado un 'ayuda', pero esa es otra historia 🪨.",
      "Extrajiste arcilla de cementerio de excelente calidad; mejor no preguntar de qué está hecha ⚱️.",
      "Obtuviste carbón negro como la noche; una de las piedras ronroneó 🐈‍⬛.",
      "Recolectaste cobre de una tumba antigua; el difunto pidió recibo y no se lo diste 🪙.",
      "Encontraste un filón de estaño embrujado; las paredes cantaban por lo bajo 🕯️.",
      "Descubriste un yacimiento de hierro con armaduras; una aún tenía caballero adentro y te pidió direcciones 🛡️.",
      "Extrajiste cuarzo que brilla en la oscuridad; también ilumina a lo que te sigue 🔮.",
      "Localizaste una veta de plata lunar; un hombre lobo te vio y solo pidió una porción para sus collares 🐺.",
      "Recolectaste esmeraldas en una galería de murciélagos; ellos juraban que eran de su propiedad 🦇💚.",
      "Descubriste una veta de oro maldito; cada pepita susurraba tu nombre al cargarla 💀.",
      "Hallaste un diamante en bruto custodiado por un esqueleto minero; se jubiló y te lo regaló 💎.",
      "Localizaste una geoda encantada; dentro dormía un duende que pidió no ser molestado 🔮."
    ]
  },
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

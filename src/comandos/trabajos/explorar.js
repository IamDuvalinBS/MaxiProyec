import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "explorar",
  names: [".explorar", ".investigar"],
  desc: "Exploración, ganancia media-alta (cada 1 hora y 30 minutos)",
  emoji: "🗺️",
  tituloExito: "EXPLORACIÓN COMPLETADA",
  cooldownMs: 90 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🌲",
    tituloExito: "BOSQUE SINIESTRO EXPLORADO",
    exitos: [
      "Recorriste un sendero con niebla y solo escuchaste una risa lejana. Nada más 🌫️.",
      "Encontraste una cabaña abandonada con la cena servida para nadie. No comiste 🏚️.",
      "Recolectaste hierbas de luna; la bruja herbolaria te las compró y te advirtió que no las olieras 🌿.",
      "Hallaste monedas junto a una tumba con musgo; la tumba decía 'devuélvelas' y no hiciste caso 🪦.",
      "Hallaste el mapa de un cementerio olvidado; el coleccionista pagó sin saber que el mapa se mueve solo 🗺️.",
      "Cartografiaste un pantano encantado y una rana gigante te dio la mano y una recompensa 🐸.",
      "Rescataste a un viajero perdido; era el Silbón, silbó de agradecimiento y te pagó con huesos de oro 🦴.",
      "Descubriste una cueva con miles de murciélagos; uno llevaba un reloj de oro y te lo dejó 🦇.",
      "Recuperaste reliquias de una capilla abandonada; el cura fantasma te bendijo y te dio permiso de venderlas ⛪.",
      "Descubriste un cofre hundido en un lago negro; una mano lo soltó mientras te miraba con envidia 🕯️.",
      "Localizaste una cripta repleta de oro; el esqueleto guardián dormía la siesta 💀.",
      "Hallaste los restos de una expedición fantasma con su tesoro; los exploradores te saludaron y te pidieron el wifi 👻."
    ]
  },
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

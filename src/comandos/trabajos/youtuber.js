import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "youtuber",
  names: [".youtuber", ".cc"],
  desc: "Contenido en YouTube, buena ganancia (cada 2 horas)",
  emoji: "🎥",
  tituloExito: "MONETIZACIÓN ACTIVADA",
  tituloFallo: "CANAL SANCIONADO",
  emojiFallo: "⚠️",
  chanceFallo: 0.25,
  cooldownMs: 120 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🎥",
    tituloExito: "MONETIZACIÓN ENCANTADA",
    tituloFallo: "CANAL MALDITO",
    emojiFallo: "💀",
    exitos: [
      "Tu video de terror tuvo pocas visitas; un comentario decía 'yo estaba ahí' y no estabas solo 👻.",
      "Tu video recibió pocos comentarios, pero ganaste suscriptores fantasmales que no hacen ruido 🦇.",
      "Llegaste a mil suscriptores; los primeros diez eran la familia Addams y dieron like desde la tumba 🎃.",
      "Tu directo desde una casa embrujada recibió donaciones; la mayor vino de un poltergeist con tarjeta 🏚️.",
      "Vendiste mercancía de tu canal con calabazas y calaveras; la Catrina pidió la edición limitada 💀.",
      "Tu canal de leyendas urbanas creció toda la semana; la Llorona te escribió: 'faltó yo' 😭.",
      "Un video sobre tallar calabazas acumuló miles de vistas; una calabaza reclamó derechos de autor 🎃.",
      "Uno de tus videos de fantasmas llegó a tendencias; los fantasmas ya piden colaboración 👻.",
      "Una marca de dulces patrocinó tu reseña de golosinas; el dulce más ácido hizo gritar a un espectro 🍬.",
      "Conseguiste un patrocinador grande para tu contenido de terror; el contrato venía en pergamino y con firma roja 🕷️.",
      "Recibiste la placa de plata embrujada de la plataforma; la placa cambia sola de lugar cada noche 🏅.",
      "Tu documental sobre brujas duplicó tu audiencia; tres brujas reales te dejaron reseña de cinco estrellas 🧙‍♀️."
    ],
    fallos: [
      "Desmonetizaron un video por demasiado aterrador; la plataforma admitió que ni ellos se atrevieron a verlo 💀.",
      "Te llegó una advertencia de derechos de autor por una banda sonora de terror; la banda es un órgano que toca solo 🎶.",
      "Compraste equipo nuevo tras una falla causada por un poltergeist; ahora él lo usa más que tú 👻."
    ]
  },
  exitos: [
    { texto: "Tu video generó una cantidad baja de visitas.", min: 40, max: 90 },
    { texto: "Tu video recibió pocos comentarios, pero sumó nuevos suscriptores.", min: 60, max: 130 },
    { texto: "Alcanzaste los mil suscriptores y activaste la monetización.", min: 120, max: 240 },
    { texto: "Tu transmisión en vivo recibió donaciones de la comunidad.", min: 150, max: 300 },
    { texto: "Vendiste mercancía oficial de tu canal.", min: 200, max: 380 },
    { texto: "Tu canal tuvo un crecimiento notable durante la semana.", min: 220, max: 420 },
    { texto: "Un video tutorial acumuló miles de reproducciones.", min: 250, max: 450 },
    { texto: "Uno de tus videos entró en tendencias.", min: 300, max: 560 },
    { texto: "Una marca patrocinó tu video de reseñas.", min: 400, max: 700 },
    { texto: "Conseguiste un patrocinador importante para tu contenido.", min: 500, max: 900 },
    { texto: "Recibiste la placa de plata de la plataforma por tu crecimiento.", min: 600, max: 1000 },
    { texto: "Tu documental fue compartido por medios y duplicó tu audiencia.", min: 700, max: 1100 }
  ],
  fallos: [
    { texto: "La plataforma desmonetizó uno de tus videos.", min: 30, max: 70 },
    { texto: "Recibiste una advertencia por derechos de autor.", min: 50, max: 110 },
    { texto: "Debiste invertir en equipo nuevo tras una falla técnica.", min: 40, max: 90 }
  ]
});

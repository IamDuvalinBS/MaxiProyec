import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "influencer",
  names: [".influencer", ".tiktoker"],
  desc: "Contenido viral, buena ganancia con riesgo de fracaso (cada 2 horas)",
  emoji: "📱",
  tituloExito: "CONTENIDO VIRAL",
  tituloFallo: "CONTENIDO SIN ALCANCE",
  emojiFallo: "📉",
  chanceFallo: 0.3,
  cooldownMs: 120 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "👻",
    tituloExito: "VIDEO EMBRUJADO VIRAL",
    tituloFallo: "VIDEO SIN ALMAS",
    emojiFallo: "💀",
    exitos: [
      "Tu publicación de Halloween tuvo poco alcance, aunque un fantasma le dio like desde una cuenta sin foto 🎃.",
      "Tu transmisión desde un cementerio juntó audiencia pequeña pero fiel: puras almas en pena 🪦.",
      "Recibiste donaciones en tus historias de terror; la más grande vino de 'LaLlorona_Real' 😭.",
      "Reseñaste disfraces y ganaste comisión; uno de los clientes era un zombi de verdad y también compró 🧟.",
      "Tu video de fantasma real se hizo viral; nadie sabe que el fantasma pidió derechos de imagen 👻.",
      "Tu baile de zombis se replicó miles de veces, aunque los zombis lo hacían mejor y sin ensayar 🧟💃.",
      "Colaboraste con un creador de terror y creció tu audiencia; era un vampiro que solo graba de noche 🦇.",
      "Te invitaron al estreno de una película de terror; te pagaron por gritar mejor que el elenco 🎬.",
      "Tu sorteo de calabazas gigantes atrajo patrocinadores; uno era el Jinete sin Cabeza con presupuesto de marketing 🎃.",
      "Una marca de dulces te contrató; el contrato lo firmaste con sangre, afortunadamente de tomate 🍬🍅.",
      "Firmaste con una marca de disfraces de terror; la Catrina fue tu primera invitada de lujo 💀🌹.",
      "Tu campaña llegó al millón de vistas en una noche; la mitad eran ojos en la ventana 🌙👀."
    ],
    fallos: [
      "Tu contenido no tuvo vistas; los fantasmas no tienen internet y los vivos están ocupados 👻.",
      "Tu disfraz fue polémico: ofendió a la momia, a la Catrina y a tu mamá, y se acabaron los patrocinios 🎭.",
      "Cancelaron tu campaña: el contrato lo firmaste con un demonio y se fue de vacaciones sin pagar 😈."
    ]
  },
  exitos: [
    { texto: "Tu publicación tuvo un alcance discreto.", min: 30, max: 80 },
    { texto: "Una transmisión en vivo reunió a una audiencia pequeña pero fiel.", min: 40, max: 100 },
    { texto: "Recibiste donaciones durante una transmisión en vivo.", min: 90, max: 200 },
    { texto: "Reseñaste un producto y obtuviste una comisión por ventas.", min: 120, max: 260 },
    { texto: "Tu video se volvió viral y recibiste ingresos por publicidad.", min: 200, max: 400 },
    { texto: "Tu tendencia de baile fue replicada por miles de usuarios.", min: 220, max: 420 },
    { texto: "Colaboraste con otro creador y aumentó tu audiencia.", min: 250, max: 450 },
    { texto: "Fuiste invitado a un evento de lanzamiento y cobraste por tu asistencia.", min: 300, max: 560 },
    { texto: "Un sorteo organizado en tu cuenta atrajo a nuevos seguidores y patrocinadores.", min: 350, max: 620 },
    { texto: "Una marca reconocida te contrató para promocionar su producto.", min: 500, max: 900 },
    { texto: "Firmaste un contrato de embajador con una marca de ropa.", min: 600, max: 1000 },
    { texto: "Tu campaña alcanzó el millón de reproducciones en un solo día.", min: 700, max: 1100 }
  ],
  fallos: [
    { texto: "Tu contenido no obtuvo visualizaciones.", min: 20, max: 60 },
    { texto: "Una polémica en redes provocó la pérdida de patrocinios.", min: 40, max: 100 },
    { texto: "Una campaña publicitaria fue cancelada antes de pagarse.", min: 30, max: 80 }
  ]
});

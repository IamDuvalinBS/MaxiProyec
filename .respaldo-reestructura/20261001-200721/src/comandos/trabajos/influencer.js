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

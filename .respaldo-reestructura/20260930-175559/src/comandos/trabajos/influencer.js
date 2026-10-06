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
    { texto: "Tu video se volvió viral y recibiste ingresos por publicidad.", min: 200, max: 400 },
    { texto: "Una marca reconocida te contrató para promocionar su producto.", min: 500, max: 900 },
    { texto: "Colaboraste con otro creador y aumentó tu audiencia.", min: 250, max: 450 }
  ],
  fallos: [
    { texto: "Tu contenido no obtuvo visualizaciones.", min: 20, max: 60 },
    { texto: "Una polémica en redes provocó la pérdida de patrocinios.", min: 40, max: 100 },
    { texto: "Una campaña publicitaria fue cancelada antes de pagarse.", min: 30, max: 80 }
  ]
});

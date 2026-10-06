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
  exitos: [
    { texto: "Tu video generó una cantidad baja de visitas.", min: 40, max: 90 },
    { texto: "Tu canal tuvo un crecimiento notable durante la semana.", min: 220, max: 420 },
    { texto: "Conseguiste un patrocinador importante para tu contenido.", min: 500, max: 900 },
    { texto: "Uno de tus videos entró en tendencias.", min: 300, max: 560 }
  ],
  fallos: [
    { texto: "La plataforma desmonetizó uno de tus videos.", min: 30, max: 70 },
    { texto: "Recibiste una advertencia por derechos de autor.", min: 50, max: 110 },
    { texto: "Debiste invertir en equipo nuevo tras una falla técnica.", min: 40, max: 90 }
  ]
});

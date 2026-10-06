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
  exitos: [
    { texto: "Cuidaste correctamente al bebé de Sarita y Duva.", min: 1000, max: 3000 },
    { texto: "Mantuviste tranquilo al bebé durante toda la noche y recibiste una excelente calificación.", min: 3000, max: 5000 },
    { texto: "Ayudaste con las tareas escolares de los niños y los acostaste a tiempo.", min: 1500, max: 3500 }
  ],
  fallos: [
    { texto: "Te quedaste dormido mientras el bebé lloraba.", min: 1000, max: 3000 },
    { texto: "El bebé llegó a su casa con mucha hambre por una falta de atención.", min: 2000, max: 5000 },
    { texto: "Olvidaste preparar la cena de los niños.", min: 1000, max: 2500 }
  ]
});

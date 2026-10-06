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

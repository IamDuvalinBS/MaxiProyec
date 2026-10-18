import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "trabajar",
  names: [".trabajar", ".w", ".work"],
  desc: "Trabajo tranquilo, sin riesgo (cada 20 minutos)",
  emoji: "👷",
  tituloExito: "TRABAJO COMPLETADO",
  cooldownMs: 20 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🧹",
    tituloExito: "TURNO EMBRUJADO COMPLETADO",
    exitos: [
      "Paseaste a los perros fantasma de varios vecinos del cementerio. 🐕👻",
      "Repartiste volantes de la fiesta de Halloween por todo el pueblo. 🎃",
      "Limpiaste telarañas y polvo de una mansión embrujada al terminar la noche. 🕸️",
      "Ayudaste a una familia de vampiros con su mudanza de ataúdes. ⚰️",
      "Completaste un turno como ayudante en la cafetería del Conde Drácula. ☕🧛",
      "Organizaste el inventario de pociones de la bodega de una bruja. 🧪",
      "Lavaste escobas voladoras en el estacionamiento de las brujas. 🧹",
      "Repartiste pasteles de calabaza a domicilio por las casas embrujadas. 🥧",
      "Diste una clase de refuerzo de hechizos a un aprendiz de brujo. 🧙‍♂️",
      "Atendiste la caja de la tienda de disfraces durante toda la víspera. 🎭",
      "Armaste pedidos de calabazas talladas en el almacén de una tienda embrujada. 🎃",
      "Cubriste el turno de un fantasma en la oficina de correos del más allá. 👻📮",
      "Terminaste un decorado de terror freelance antes de la medianoche. 🦇"
    ]
  },
  exitos: [
    { texto: "Paseaste a los perros de varios vecinos del sector.", min: 20, max: 60 },
    { texto: "Repartiste volantes publicitarios en el centro de la ciudad.", min: 25, max: 55 },
    { texto: "Limpiaste oficinas al finalizar la jornada laboral.", min: 30, max: 70 },
    { texto: "Colaboraste en una mudanza familiar.", min: 35, max: 85 },
    { texto: "Completaste un turno como ayudante en una cafetería.", min: 40, max: 80 },
    { texto: "Organizaste el inventario de una bodega.", min: 45, max: 90 },
    { texto: "Lavaste autos en un estacionamiento durante la tarde.", min: 50, max: 95 },
    { texto: "Realizaste entregas a domicilio para un comercio local.", min: 50, max: 100 },
    { texto: "Impartiste una clase de refuerzo a un estudiante.", min: 55, max: 110 },
    { texto: "Atendiste la caja de un supermercado durante todo el día.", min: 60, max: 120 },
    { texto: "Armaste pedidos en el almacén de una tienda en línea.", min: 65, max: 115 },
    { texto: "Cubriste el turno de un compañero en la oficina de correos.", min: 80, max: 135 },
    { texto: "Terminaste un proyecto freelance antes de la fecha límite.", min: 130, max: 200 }
  ]
});

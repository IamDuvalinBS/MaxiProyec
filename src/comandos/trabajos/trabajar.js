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
      "Paseaste unos perros del vecindario... uno tenía tres cabezas y ladraba en latín. Era Cerbero 🐕💀.",
      "Repartiste volantes de la fiesta y una señora de blanco te pidió uno... flotando. Era la Dama del Cementerio 👻.",
      "Limpiaste telarañas de una mansión; la araña dueña de la casa te dejó propina por no tocarla 🕷️.",
      "Ayudaste a unos vampiros con su mudanza y descubriste que los ataúdes pesan más cuando tienen dueño adentro ⚰️🧛.",
      "Atendiste la cafetería del Conde Drácula; el 'café rojo' que pedían todos no era café, y mejor no preguntes ☕🩸.",
      "Ordenaste la bodega de una bruja; una poción te dejó verde cinco minutos, pero te pagó doble 🧪.",
      "Lavaste escobas voladoras; una se escapó contigo encima y aterrizaste en el techo, pero igual te pagaron 🧹.",
      "Repartiste pasteles de calabaza; en la última casa abrió el Jinete sin Cabeza, se llevó el pastel... y dejó propina 🎃.",
      "Diste clase de hechizos a un aprendiz que convirtió tu cartera en rana... al revertirlo salió con más calabazas 🐸✨.",
      "Cobraste en la tienda de disfraces toda la noche; el cliente con el disfraz de momia más realista nunca se quitó las vendas 🧟.",
      "Armaste pedidos de calabazas talladas y una te guiñó el ojo. Decidiste no preguntar y cobrar 🎃👁️.",
      "Cubriste el turno de un fantasma en el correo del más allá; las cartas llegan en 200 años, pero el sueldo llegó hoy 📮👻.",
      "Terminaste un decorado de terror tan realista que te dieron bono... y te pidieron que dejaras de aparecer en las fotos 🦇."
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

import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "migajear",
  names: [".migajear", ".limosna", ".ayudas"],
  desc: "Pedir ayudas, ganancia mínima pero rápida (cada 30 minutos)",
  emoji: "🙏",
  tituloExito: "AYUDA RECIBIDA",
  cooldownMs: 30 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🍬",
    tituloExito: "DULCES RECIBIDOS",
    exitos: [
      "Tocaste puertas toda la noche; en una abrió la Llorona y te dio un pañuelo por solidaridad 😭.",
      "Pocas casas abrieron; la última no tenía dueño y te lanzó un hueso como saludo 🦴.",
      "Alguien te lanzó un caramelo desde una ventana oscura; no se veía quién, pero sabía rico 🍬.",
      "Un niño disfrazado de fantasma compartió sus dulces; luego descubriste que era un fantasma de verdad, y de los generosos 👻.",
      "Una señora amable te dio monedas y caramelos; tenía una verruga sospechosa y sombrero puntiagudo 🧙‍♀️🍭.",
      "Un panadero te regaló pan de muerto; el pan decía 'cómeme' y obedeciste 🍞.",
      "Un comerciante te pagó por ayudarle a colgar calaveras; tres de ellas te dieron las gracias 💀.",
      "Una señora te ofreció pastel de calabaza y cambio; el pastel no paraba de hablar de su ex 🥧.",
      "Un turista disfrazado de vampiro te dio su cambio; luego se fue volando, no era disfraz 🧛.",
      "Un desconocido enmascarado te dio una suma gigante; era el Charro Negro y no pidió nada a cambio... por ahora 🐎.",
      "Un grupo de niños monstruo hizo colecta para ti; Frankenstein, el más grande, puso más que todos 🧟‍♂️.",
      "Un conductor disfrazado de calabaza se detuvo y te dio un billete; el carro no tenía motor, solo un cuervo 🐦‍⬛🎃."
    ]
  },
  exitos: [
    { texto: "Pasaste la mañana sin recibir ninguna ayuda.", min: 1, max: 6 },
    { texto: "Pocas personas prestaron atención a tu solicitud.", min: 2, max: 10 },
    { texto: "Alguien te regaló una moneda sin decir palabra.", min: 3, max: 12 },
    { texto: "Un niño te compartió parte de su mesada.", min: 8, max: 20 },
    { texto: "Una persona amable te obsequió unas monedas.", min: 10, max: 30 },
    { texto: "Un panadero te regaló pan y unas monedas.", min: 12, max: 35 },
    { texto: "Un comerciante te ofreció una propina por un pequeño favor.", min: 15, max: 45 },
    { texto: "Una señora te ofreció un almuerzo y algo de cambio.", min: 20, max: 45 },
    { texto: "Un turista te dejó el cambio de su compra.", min: 25, max: 55 },
    { texto: "Un desconocido generoso te entregó una suma considerable.", min: 40, max: 80 },
    { texto: "Un grupo de estudiantes hizo una colecta para ayudarte.", min: 45, max: 90 },
    { texto: "Un conductor se detuvo y te entregó un billete.", min: 50, max: 100 }
  ]
});

import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "superalbanil",
  names: [".superalbañil", ".albañil"],
  desc: "Construcción pesada, la mejor paga (cada 3 horas)",
  emoji: "🧱",
  tituloExito: "OBRA FINALIZADA",
  cooldownMs: 180 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🏚️",
    tituloExito: "CASA EMBRUJADA FINALIZADA",
    exitos: [
      "Resanaste grietas de una mansión embrujada; de una grieta salió una mano a darte las gracias 🕸️.",
      "Instalaste una puerta que rechina y una ventana nueva; la puerta solo abre sola cuando no estás 🚪.",
      "Reparaste una pared por donde asomaban fantasmas; ahora asoman por la ventana nueva, pero sin quejas 👻.",
      "Colocaste piso de madera crujiente; cruje justo la tabla de 'alguien camina detrás de ti' 🪵.",
      "Terminaste la cocina de una bruja con caldero; lloró de felicidad y te pagó con sapos de oro 🧙‍♀️.",
      "Construiste una barda de hierro alrededor de un cementerio; sus inquilinos agradecieron la privacidad 🪦.",
      "Reforzaste los cimientos de un castillo; algo aplaudió desde el sótano y no preguntaste qué 🏰.",
      "Levantaste la estructura de una mansión completa; la casa te dio las gracias con un crujido 🏚️.",
      "Levantaste una torre con vista a la luna llena; el lobo del vecino ya la reservó para aullar 🌕.",
      "Dirigiste a esqueletos en la construcción de una cripta; ellos cobraron en huesos, tú en oro 💀.",
      "Hiciste albañilería, plomería y electricidad en una casa embrujada; el fantasma jura que la luz parpadeante era decorativa 🔌.",
      "Entregaste una casa del terror antes de tiempo; el dueño, un vampiro, te dio un bono y no se acercó al ajo 🎃🧛."
    ]
  },
  exitos: [
    { texto: "Resanaste las grietas de un muro exterior.", min: 120, max: 260 },
    { texto: "Instalaste una puerta y una ventana nuevas.", min: 200, max: 380 },
    { texto: "Reparaste una pared pequeña.", min: 200, max: 400 },
    { texto: "Colocaste el piso de una habitación completa.", min: 250, max: 450 },
    { texto: "Terminaste la remodelación de una cocina.", min: 400, max: 700 },
    { texto: "Construiste una barda perimetral para una vivienda.", min: 450, max: 750 },
    { texto: "Reforzaste los cimientos de una casa antigua.", min: 600, max: 950 },
    { texto: "Levantaste la estructura de un edificio completo.", min: 700, max: 1000 },
    { texto: "Levantaste una terraza con vista a la ciudad.", min: 800, max: 1200 },
    { texto: "Dirigiste a una cuadrilla en la construcción de una bodega.", min: 900, max: 1350 },
    { texto: "Realizaste labores de albañilería, plomería y electricidad en una misma obra.", min: 1000, max: 1500 },
    { texto: "Entregaste una casa completa antes de la fecha prometida y recibiste un bono.", min: 1200, max: 1800 }
  ]
});

import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "crimen",
  names: [".crimen", ".crime"],
  desc: "Ganancia alta, riesgo de multa (cada 1 hora)",
  emoji: "🕵️",
  tituloExito: "OPERACIÓN EXITOSA",
  tituloFallo: "OPERACIÓN FALLIDA",
  emojiFallo: "🚔",
  chanceFallo: 0.4,
  cooldownMs: 60 * 60 * 1000,
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🦇",
    tituloExito: "TRAVESURA EXITOSA",
    tituloFallo: "TRAVESURA FALLIDA",
    emojiFallo: "👻",
    exitos: [
      "Le robaste unos dulces a un niño... Al final no era un niño, era la Llorona. Corriste, pero te quedaste con los dulces 💀.",
      "Te llevaste la bolsa de dulces de un transeúnte distraído; era un esqueleto y ni cuenta se dio 🦴.",
      "Robaste las propinas de la fiesta de disfraces; nadie notó nada, todos culparon al Chupacabras 🐐.",
      "Vaciaste el caldero de dulces de una casa embrujada mientras la bruja dormía... por suerte roncaba fuerte 🧙‍♀️.",
      "Saqueaste la tienda de dulces durante el truco o trato y le echaron la culpa al Charro Negro 🐎.",
      "Vendiste entradas falsas a la casa del terror; nadie reclamó, de todos modos el susto fue real 🎟️.",
      "Vendiste pociones de contrabando; la 'poción de belleza' dejó a tu cliente peludo y feliz, un hombre lobo satisfecho 🐺🧪.",
      "Falsificaste pergaminos de hechizos y los vendiste a un brujo apurado; solo sirven para estornudar, pero ya no estabas ahí 📜.",
      "Desmantelaste un carruaje fúnebre; el fantasma del cochero te vio y, en vez de asustarte, te ayudó a cargar las ruedas ⚰️.",
      "Robaste el reloj de oro de un vampiro dormido. Despertó, pero con el sol afuera no pudo perseguirte 🧛☀️.",
      "Encontraste un anillo maldito en el botín; se te pegó al dedo, pero ya lo empeñaste con dedo y todo 💍💀.",
      "Participaste en el saqueo de una mansión embrujada; los fantasmas, hartos de la casa, hasta te ayudaron a sacar el tesoro 🏚️."
    ],
    fallos: [
      "Un fantasma guardián te sorprendió y gritaste tan fuerte que soltaste el botín. Él también gritó 👻.",
      "Tu cómplice con disfraz de momia te delató; resultó que no era disfraz, era la momia del museo y cobra fianza 🧟.",
      "Entraste a robar y era la casa de la Llorona; saliste llorando más fuerte que ella y dejaste tu cartera 😭.",
      "Un cuervo te vio y te delató con todo el pueblo; nunca confíes en un cuervo chismoso 🐦‍⬛."
    ]
  },
  exitos: [
    { texto: "Sustrajiste un teléfono de juguete que casi no tenía valor.", min: 5, max: 15 },
    { texto: "Sustrajiste la cartera de un transeúnte descuidado.", min: 30, max: 80 },
    { texto: "Sustrajiste las propinas de un restaurante concurrido.", min: 40, max: 110 },
    { texto: "Vaciaste una caja registradora sin vigilancia.", min: 70, max: 160 },
    { texto: "Asaltaste una tienda de barrio.", min: 100, max: 250 },
    { texto: "Falsificaste entradas y las vendiste a la entrada de un evento.", min: 120, max: 280 },
    { texto: "Vendiste mercancía de contrabando en el mercado local.", min: 150, max: 320 },
    { texto: "Falsificaste documentos y los vendiste a un cliente apurado.", min: 250, max: 480 },
    { texto: "Desmantelaste un vehículo y vendiste sus piezas.", min: 300, max: 600 },
    { texto: "Sustrajiste un reloj de diamantes a un empresario.", min: 800, max: 1500 },
    { texto: "Encontraste un anillo de oro puro entre el botín.", min: 1000, max: 1800 },
    { texto: "Participaste en el robo de una joyería del centro.", min: 1200, max: 2000 }
  ],
  fallos: [
    { texto: "Los agentes de policía te sorprendieron en pleno acto.", min: 50, max: 150 },
    { texto: "Un cómplice te delató y debiste pagar una fianza.", min: 80, max: 200 },
    { texto: "Se activó la alarma y abandonaste el lugar sin botín.", min: 30, max: 90 },
    { texto: "Una cámara de seguridad registró tus movimientos y recibiste una multa.", min: 60, max: 160 }
  ]
});

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
  exitos: [
    { texto: "Sustrajiste la cartera de un transeúnte descuidado.", min: 30, max: 80 },
    { texto: "Sustrajiste un teléfono de juguete que casi no tenía valor.", min: 5, max: 15 },
    { texto: "Sustrajiste un reloj de diamantes a un empresario.", min: 800, max: 1500 },
    { texto: "Encontraste un anillo de oro puro entre el botín.", min: 1000, max: 1800 },
    { texto: "Desmantelaste un vehículo y vendiste sus piezas.", min: 300, max: 600 },
    { texto: "Asaltaste una tienda de barrio.", min: 100, max: 250 },
    { texto: "Falsificaste entradas y las vendiste a la entrada de un evento.", min: 120, max: 280 }
  ],
  fallos: [
    { texto: "Los agentes de policía te sorprendieron en pleno acto.", min: 50, max: 150 },
    { texto: "Un cómplice te delató y debiste pagar una fianza.", min: 80, max: 200 },
    { texto: "Se activó la alarma y abandonaste el lugar sin botín.", min: 30, max: 90 },
    { texto: "Una cámara de seguridad registró tus movimientos y recibiste una multa.", min: 60, max: 160 }
  ]
});

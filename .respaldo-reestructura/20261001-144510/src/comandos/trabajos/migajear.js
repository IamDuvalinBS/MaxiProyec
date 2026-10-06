import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "migajear",
  names: [".migajear", ".limosna", ".ayudas"],
  desc: "Pedir ayudas, ganancia mínima pero rápida (cada 30 minutos)",
  emoji: "🙏",
  tituloExito: "AYUDA RECIBIDA",
  cooldownMs: 30 * 60 * 1000,
  exitos: [
    { texto: "Pocas personas prestaron atención a tu solicitud.", min: 2, max: 10 },
    { texto: "Una persona amable te obsequió unas monedas.", min: 10, max: 30 },
    { texto: "Un desconocido generoso te entregó una suma considerable.", min: 40, max: 80 },
    { texto: "Un comerciante te ofreció una propina por un pequeño favor.", min: 15, max: 45 }
  ]
});

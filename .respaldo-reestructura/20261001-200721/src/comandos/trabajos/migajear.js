import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "migajear",
  names: [".migajear", ".limosna", ".ayudas"],
  desc: "Pedir ayudas, ganancia mínima pero rápida (cada 30 minutos)",
  emoji: "🙏",
  tituloExito: "AYUDA RECIBIDA",
  cooldownMs: 30 * 60 * 1000,
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

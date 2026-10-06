import { crearTrabajo } from "../../economia/trabajos.js";

export default crearTrabajo({
  clave: "uber",
  names: [".uber", ".conductor"],
  desc: "Conducción de viajes, riesgo de choques y multas (cada 45 minutos)",
  emoji: "🚕",
  tituloExito: "VIAJE COMPLETADO",
  tituloFallo: "INCIDENTE EN EL VIAJE",
  emojiFallo: "🚨",
  chanceFallo: 0.3,
  cooldownMs: 45 * 60 * 1000,
  exitos: [
    { texto: "Completaste un viaje corto dentro del barrio.", min: 30, max: 70 },
    { texto: "Trasladaste a un pasajero hasta el aeropuerto.", min: 100, max: 200 },
    { texto: "Un pasajero te dejó una propina generosa.", min: 250, max: 450 },
    { texto: "Realizaste un viaje interurbano de larga distancia.", min: 180, max: 320 }
  ],
  fallos: [
    { texto: "Chocaste contra un poste y debiste pagar la reparación.", min: 100, max: 300 },
    { texto: "Recibiste una multa por exceso de velocidad.", min: 50, max: 150 },
    { texto: "Un pasajero canceló el viaje y perdiste tiempo y combustible.", min: 20, max: 60 },
    { texto: "Te quedaste sin combustible en plena ruta.", min: 40, max: 110 }
  ]
});

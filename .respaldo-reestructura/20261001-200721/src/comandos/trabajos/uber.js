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
    { texto: "El pasajero canceló tras una larga espera, pero recibiste una compensación.", min: 10, max: 35 },
    { texto: "Llevaste a un estudiante a su escuela.", min: 25, max: 60 },
    { texto: "Completaste un viaje corto dentro del barrio.", min: 30, max: 70 },
    { texto: "Recogiste a un grupo de amigos tras un concierto.", min: 80, max: 160 },
    { texto: "Trasladaste a un pasajero hasta el aeropuerto.", min: 100, max: 200 },
    { texto: "Trasladaste a una familia con maletas hasta la terminal de autobuses.", min: 120, max: 220 },
    { texto: "Realizaste un viaje nocturno con tarifa dinámica elevada.", min: 150, max: 280 },
    { texto: "Realizaste un viaje interurbano de larga distancia.", min: 180, max: 320 },
    { texto: "Un pasajero frecuente te contrató para un viaje de ida y vuelta.", min: 200, max: 350 },
    { texto: "Un pasajero te dejó una propina generosa.", min: 250, max: 450 },
    { texto: "Cumpliste una racha de viajes consecutivos y recibiste un bono de la plataforma.", min: 300, max: 500 },
    { texto: "Transportaste a un turista durante todo el día como guía improvisado.", min: 350, max: 600 }
  ],
  fallos: [
    { texto: "Chocaste contra un poste y debiste pagar la reparación.", min: 100, max: 300 },
    { texto: "Recibiste una multa por exceso de velocidad.", min: 50, max: 150 },
    { texto: "Un pasajero canceló el viaje y perdiste tiempo y combustible.", min: 20, max: 60 },
    { texto: "Te quedaste sin combustible en plena ruta.", min: 40, max: 110 }
  ]
});

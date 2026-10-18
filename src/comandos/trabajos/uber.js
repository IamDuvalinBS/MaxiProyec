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
  // Extensión de evento: solo textos y emojis (se emparejan por posición con exitos/fallos).
  halloween: {
    emoji: "🛻",
    tituloExito: "VIAJE NOCTURNO COMPLETADO",
    tituloFallo: "INCIDENTE EN EL VIAJE",
    emojiFallo: "🚨",
    exitos: [
      "El pasajero fantasma se desvaneció a medio camino; pagó con una moneda del siglo XVIII y propina de escalofríos 👻.",
      "Llevaste a un niño disfrazado de murciélago a su fiesta; iba pegado al techo del auto, pero con cinturón 🦇.",
      "Completaste un viaje corto al cementerio; el pasajero dijo 'aquí vivo' y le creíste 🪦.",
      "Recogiste amigos disfrazados tras una fiesta; uno era un zombi de verdad y el único sobrio 🧟.",
      "Llevaste a un vampiro al aeropuerto antes del amanecer; no salía en el retrovisor, pero pagó extra 🧛.",
      "Trasladaste a una familia de momias con maletas; olían a antigüedad pero pagaron con billetes secos 🧟.",
      "Viaje a medianoche con tarifa dinámica; hasta la Llorona esperó su turno para pedir viaje 😭.",
      "Viaje largo hasta el castillo de Transilvania; el GPS decía 'recalculando', pero el conde sabía el camino 🏰.",
      "Una bruja frecuente te contrató ida y vuelta en luna llena; pagó la mitad en escoba y la otra en oro 🧙‍♀️.",
      "Un pasajero enmascarado te dio una propina generosa; luego descubriste que la máscara no se quitaba 🎃.",
      "Racha de viajes nocturnos; la plataforma te dio un bono porque ya eras 'familiar de los espectros' 🕯️.",
      "Llevaste a un turista toda la noche como guía de casas embrujadas; en cada casa alguien lo saludaba por su nombre 🏚️."
    ],
    fallos: [
      "Chocaste contra una lápida; la lápida reclamó la reparación y pagaste tú 🪦.",
      "Multa por exceso de velocidad en el camino de niebla; el policía era un esqueleto y cobró en efectivo 🌫️.",
      "Tu pasajero era un espectro, canceló el viaje y se quedó en el asiento; hizo frío todo el trayecto 👻.",
      "Te quedaste sin gasolina en el bosque embrujado; a lo lejos alguien silbaba y el auto no encendía 🌲."
    ]
  },
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

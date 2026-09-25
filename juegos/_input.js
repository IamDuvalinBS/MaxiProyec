// juegos/_input.js
//
// Comando "invisible": nunca lo escribe una persona a mano, siempre llega
// escondido en el buttonId que arma motores/juegos-core.js. Es la UNICA
// puerta de entrada para los botones de TODOS los juegos - no hace falta
// crear un comando de botones por cada juego nuevo. No renombrar ".jbtn"
// o se rompen los juegos ya en uso.
import { procesarBoton } from "../motores/juegos-core.js";

export default {
  names: [".jbtn"],
  desc: "Procesa un boton de un juego (uso interno)",
  category: "Juegos",
  usage: ".jbtn <juego> <accion>",
  handler: async ({ sock, from, msg, cleanText }) => {
    const [, juegoId, accionId] = cleanText.split(/\s+/);
    if (!juegoId || !accionId) return;
    await procesarBoton(sock, from, msg, juegoId, accionId);
  },
};

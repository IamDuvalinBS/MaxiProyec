import { procesarBoton } from "../motores/juegos-core.js";

export default {
  names: [".jbtn"],
  desc: "Procesa un boton de un juego (uso interno)",
  category: "Juegos",
  usage: ".jbtn <juego> <accion>",
  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const [, juegoId, accionId] = cleanText.split(/\s+/);
    if (!juegoId || !accionId) return;
    await procesarBoton(sock, from, sender, msg, juegoId, accionId);
  },
};

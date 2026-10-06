// juegos/_reiniciar.js
//
// Comando "invisible" hermano de _input.js: se dispara solo cuando alguien
// toca el boton "🔁 Jugar de nuevo" que aparece cuando un juego termina.
import { iniciarJuego } from "../motores/juegos-core.js";

export default {
  names: [".jnuevo"],
  desc: "Reinicia un juego (uso interno)",
  category: "Juegos",
  usage: ".jnuevo <juego>",
  handler: async ({ sock, from, sender, msg, cleanText }) => {
    const [, juegoId] = cleanText.split(/\s+/);
    if (!juegoId) return;
    await iniciarJuego(sock, from, sender, msg, juegoId);
  },
};

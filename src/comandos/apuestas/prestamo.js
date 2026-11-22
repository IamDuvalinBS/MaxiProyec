import { manejarPrestamo } from "../../economia/prestamos.js";

export default {
  names: [".prestamo", ".préstamo", ".loan"],
  usage: ".prestamo <monto | estado | pagar>",
  desc: "Pide un préstamo al banco del bot",
  category: "Economía",
  handler: async ({ from, sender, cleanText, reply }) => {
    const argumento = cleanText.trim().split(/\s+/)[1];
    return reply({ text: manejarPrestamo(sender, from, argumento) });
  }
};

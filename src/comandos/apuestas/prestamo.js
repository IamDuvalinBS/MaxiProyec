import { manejarPrestamo } from "../../economia/prestamos.js";

export default {
  names: [".prestamo", ".préstamo", ".loan"],
  usage: ".prestamo <monto> | .prestamo estado | .prestamo pagar",
  desc: "Solicita un préstamo al banco del bot; el límite sube con tu nivel hasta 500k y se paga en un máximo de 6 días",
  category: "Economía",
  handler: async ({ from, sender, cleanText, reply }) => {
    const argumento = cleanText.trim().split(/\s+/)[1];
    return reply({ text: manejarPrestamo(sender, from, argumento) });
  }
};

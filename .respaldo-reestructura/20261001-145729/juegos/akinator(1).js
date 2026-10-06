import { iniciarAkinator } from "../core.js";

export default {
  names: [".akinator", ".aki"],
  desc: "Pensá un personaje y Akinator lo adivina. Si acierta, te da plata y xp",
  category: "Juegos",
  usage: ".akinator",
  handler: async ({ sock, from, sender, msg }) => {
    await iniciarAkinator(sock, from, sender, msg);
  }
};

import { subcomandoS } from "../../nucleo/sticker-acciones.js";

export default {
  names: [".slist", ".slista"],
  desc: "Lista los stickers de acción registrados en el grupo (solo admins)",
  category: "Stickers",
  usage: ".slist",
  handler: async ({ msg, sender, from, sock, reply }) => {
    await subcomandoS({ sock, from, sender, cleanText: ".s lista", msg, reply });
  }
};

import { AYUDA } from "../../nucleo/sticker-acciones.js";

export default {
  names: [".shelp", ".sayuda"],
  desc: "Ayuda de stickers: comandos y variantes de .s para grupos",
  category: "Stickers",
  usage: ".shelp",
  handler: async ({ reply }) => {
    await reply({ text: AYUDA });
  }
};

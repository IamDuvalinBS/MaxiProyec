import { stickerConAudio } from "../../nucleo/sticker-audio.js";

export default {
  names: [".saudio", ".s2", ".stickeraudio"],
  desc: "Crea un sticker con sonido (video con audio, o imagen + nota de voz)",
  category: "Stickers",
  usage: ".saudio",
  handler: async ({ msg, sender, from, sock, reply }) => {
    await stickerConAudio({ sock, from, sender, msg, reply });
  }
};

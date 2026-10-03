import { enviarDescarga } from "./youtube.js";
import { tarjetaUso } from "../../descargas/tarjetas.js";

export default {
  names: [".ytaudio", ".ytvideo"],
  usage: ".ytaudio <enlace> | .ytvideo <enlace>",
  desc: "Descarga el audio o el video de un enlace de YouTube (lo usan los botones de .play)",
  category: "Descargas",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    const partes = cleanText.trim().split(/\s+/);
    const esAudio = partes[0].toLowerCase() === ".ytaudio";
    const enlace = partes[1];

    if (!enlace || !/^https?:\/\//i.test(enlace)) {
      return reply({
        text: tarjetaUso({
          comando: ".ytaudio <enlace> | .ytvideo <enlace>",
          ejemplo: ".ytvideo https://youtu.be/xxxxxxxxxxx",
          nota: "Normalmente se activa con los botones que muestra *.play*."
        }),
        mentions: [sender]
      });
    }

    await enviarDescarga({ sock, from, msg, link: enlace, esAudio });
  }
};

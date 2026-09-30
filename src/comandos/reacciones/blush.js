import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".blush", ".sonrojar"],
  usage: ".blush [@usuario]",
  desc: "Reacción de anime: blush",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "blush",
    fraseConOtro: "se sonrojó por",
    fraseSolo: "se sonrojó."
  })
};

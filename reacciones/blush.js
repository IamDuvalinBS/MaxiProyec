import { reactionCommand } from "../core.js";

export default {
  names: [".blush", ".sonrojar"],
  desc: "Reacción de anime: blush",
  category: "Diversión",
  usage: ".blush [@usuario]",
  handler: reactionCommand({
    apiAction: "blush",
    fraseConOtro: "se sonrojó por",
    fraseSolo: "se sonrojó."
  })
};

import { reactionCommand } from "../core.js";

export default {
  names: [".slap", ".bofetada"],
  desc: "Reacción de anime: slap",
  category: "Diversión",
  usage: ".slap [@usuario]",
  handler: reactionCommand({
    apiAction: "slap",
    fraseConOtro: "le dio una bofetada a",
    fraseSolo: "se dio una bofetada a sí mismo."
  })
};

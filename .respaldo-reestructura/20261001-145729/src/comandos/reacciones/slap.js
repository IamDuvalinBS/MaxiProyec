import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".slap", ".bofetada"],
  usage: ".slap [@usuario]",
  desc: "Reacción de anime: slap",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "slap",
    fraseConOtro: "le dio una bofetada a",
    fraseSolo: "se dio una bofetada a sí mismo."
  })
};

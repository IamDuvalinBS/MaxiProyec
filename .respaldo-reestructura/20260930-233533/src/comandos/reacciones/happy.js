import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".happy", ".feliz"],
  usage: ".happy [@usuario]",
  desc: "Reacción de anime: happy",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "happy",
    fraseConOtro: "está feliz junto a",
    fraseSolo: "está muy feliz."
  })
};

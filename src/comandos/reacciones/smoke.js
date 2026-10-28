import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".smoke",".fumar"],
  usage: ".smoke [@usuario]",
  desc: "Reacción de anime: smoke (Fumar)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "smoke",
    fraseConOtro: "se fumó uno junto a",
    fraseSolo: "se puso a fumar pensativo."
  })
};

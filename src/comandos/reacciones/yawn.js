import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".yawn",".bostezar"],
  usage: ".yawn [@usuario]",
  desc: "Reacción de anime: yawn (Bostezar)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "yawn",
    fraseConOtro: "bostezó frente a",
    fraseSolo: "bostezó del sueño."
  })
};

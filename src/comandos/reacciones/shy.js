import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".shy",".timido",".tímido"],
  usage: ".shy [@usuario]",
  desc: "Reacción de anime: shy (Sentir timidez)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "shy",
    fraseConOtro: "se puso tímido frente a",
    fraseSolo: "se puso muy tímido."
  })
};

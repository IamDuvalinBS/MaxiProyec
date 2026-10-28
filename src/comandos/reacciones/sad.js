import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".sad",".triste"],
  usage: ".sad [@usuario]",
  desc: "Reacción de anime: sad (Expresar tristeza)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "sad",
    fraseConOtro: "está triste por culpa de",
    fraseSolo: "está muy triste."
  })
};

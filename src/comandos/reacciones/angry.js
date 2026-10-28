import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".angry",".enojado"],
  usage: ".angry [@usuario]",
  desc: "Reacción de anime: angry (Estar enojado)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "angry",
    fraseConOtro: "está furioso con",
    fraseSolo: "está de muy mal humor."
  })
};

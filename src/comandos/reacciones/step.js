import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".step",".pisar"],
  usage: ".step [@usuario]",
  desc: "Reacción de anime: step (Pisar a alguien)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "step",
    fraseConOtro: "pisó a",
    fraseSolo: "se pisó a sí mismo."
  })
};

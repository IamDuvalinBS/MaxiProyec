import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".handhold", ".tomar-mano"],
  usage: ".handhold [@usuario]",
  desc: "Reacción de anime: handhold",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "handhold",
    fraseConOtro: "le tomó la mano a",
    fraseSolo: "juntó las manos a solas."
  })
};

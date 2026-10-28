import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".celebrate",".celebrar"],
  usage: ".celebrate [@usuario]",
  desc: "Reacción de anime: celebrate (Celebrar)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "celebrate",
    fraseConOtro: "celebró con",
    fraseSolo: "está celebrando."
  })
};

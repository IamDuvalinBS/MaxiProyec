import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".feed", ".alimentar"],
  usage: ".feed [@usuario]",
  desc: "Reacción de anime: feed",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "feed",
    fraseConOtro: "le está dando de comer a",
    fraseSolo: "está comiendo solo."
  })
};

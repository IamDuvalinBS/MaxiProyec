import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".highfive", ".chocar"],
  usage: ".highfive [@usuario]",
  desc: "Reacción de anime: highfive",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "highfive",
    fraseConOtro: "chocó los cinco con",
    fraseSolo: "se chocó los cinco solo."
  })
};

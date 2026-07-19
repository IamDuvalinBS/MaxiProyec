import { reactionCommand } from "../core.js";

export default {
  names: [".highfive", ".chocar"],
  desc: "Reacción de anime: highfive",
  category: "Diversión",
  usage: ".highfive [@usuario]",
  handler: reactionCommand({
    apiAction: "highfive",
    fraseConOtro: "chocó los cinco con",
    fraseSolo: "se chocó los cinco solo."
  })
};

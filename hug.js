import { reactionCommand } from "../core.js";

export default {
  names: [".hug", ".abrazar"],
  desc: "Reacción de anime: hug",
  category: "Diversión",
  usage: ".hug [@usuario]",
  handler: reactionCommand({
    apiAction: "hug",
    fraseConOtro: "le dio un abrazo a",
    fraseSolo: "se abrazó a sí mismo."
  })
};

import { reactionCommand } from "../core.js";

export default {
  names: [".kiss", ".besar"],
  desc: "Reacción de anime: kiss",
  category: "Diversión",
  usage: ".kiss [@usuario]",
  handler: reactionCommand({
    apiAction: "kiss",
    fraseConOtro: "le dio un beso a",
    fraseSolo: "se mandó un beso al aire."
  })
};

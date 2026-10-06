import { reactionCommand } from "../core.js";

export default {
  names: [".cry", ".llorar"],
  desc: "Reacción de anime: cry",
  category: "Diversión",
  usage: ".cry [@usuario]",
  handler: reactionCommand({
    apiAction: "cry",
    fraseConOtro: "está llorando por",
    fraseSolo: "está llorando."
  })
};

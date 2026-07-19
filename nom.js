import { reactionCommand } from "../core.js";

export default {
  names: [".nom", ".comer"],
  desc: "Reacción de anime: nom",
  category: "Diversión",
  usage: ".nom [@usuario]",
  handler: reactionCommand({
    apiAction: "nom",
    fraseConOtro: "está comiendo con",
    fraseSolo: "está comiendo."
  })
};

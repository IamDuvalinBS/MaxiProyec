import { reactionCommand } from "../core.js";

export default {
  names: [".bite", ".morder"],
  desc: "Reacción de anime: bite",
  category: "Diversión",
  usage: ".bite [@usuario]",
  handler: reactionCommand({
    apiAction: "bite",
    fraseConOtro: "mordió a",
    fraseSolo: "se mordió a sí mismo."
  })
};

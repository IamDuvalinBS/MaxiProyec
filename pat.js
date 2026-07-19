import { reactionCommand } from "../core.js";

export default {
  names: [".pat", ".acariciar"],
  desc: "Reacción de anime: pat",
  category: "Diversión",
  usage: ".pat [@usuario]",
  handler: reactionCommand({
    apiAction: "pat",
    fraseConOtro: "le dio unas palmaditas a",
    fraseSolo: "se acarició la cabeza."
  })
};

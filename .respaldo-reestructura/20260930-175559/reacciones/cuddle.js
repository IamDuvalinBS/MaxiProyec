import { reactionCommand } from "../core.js";

export default {
  names: [".cuddle", ".acurrucar"],
  desc: "Reacción de anime: cuddle",
  category: "Diversión",
  usage: ".cuddle [@usuario]",
  handler: reactionCommand({
    apiAction: "cuddle",
    fraseConOtro: "se acurrucó con",
    fraseSolo: "se acurrucó solo."
  })
};

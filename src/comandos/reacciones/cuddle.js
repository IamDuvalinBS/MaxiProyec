import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".cuddle", ".acurrucar"],
  usage: ".cuddle [@usuario]",
  desc: "Reacción de anime: cuddle",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "cuddle",
    fraseConOtro: "se acurrucó con",
    fraseSolo: "se acurrucó solo."
  })
};

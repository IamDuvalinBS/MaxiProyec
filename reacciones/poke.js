import { reactionCommand } from "../core.js";

export default {
  names: [".poke", ".picar"],
  desc: "Reacción de anime: poke",
  category: "Diversión",
  usage: ".poke [@usuario]",
  handler: reactionCommand({
    apiAction: "poke",
    fraseConOtro: "le picó el hombro a",
    fraseSolo: "se picó a sí mismo."
  })
};

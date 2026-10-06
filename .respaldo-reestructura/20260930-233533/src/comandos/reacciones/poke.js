import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".poke", ".picar"],
  usage: ".poke [@usuario]",
  desc: "Reacción de anime: poke",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "poke",
    fraseConOtro: "le picó el hombro a",
    fraseSolo: "se picó a sí mismo."
  })
};

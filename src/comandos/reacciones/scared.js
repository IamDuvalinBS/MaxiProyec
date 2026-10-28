import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".scared",".asustado"],
  usage: ".scared [@usuario]",
  desc: "Reacción de anime: scared (Estar asustado)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "scared",
    fraseConOtro: "se asustó muchísimo con",
    fraseSolo: "se asustó."
  })
};

import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".cry", ".llorar"],
  usage: ".cry [@usuario]",
  desc: "Reacción de anime: cry",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "cry",
    fraseConOtro: "está llorando por",
    fraseSolo: "está llorando."
  })
};

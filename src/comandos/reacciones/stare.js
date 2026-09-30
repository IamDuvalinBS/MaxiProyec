import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".stare", ".mirar"],
  usage: ".stare [@usuario]",
  desc: "Reacción de anime: stare",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "stare",
    fraseConOtro: "se quedó mirando fijamente a",
    fraseSolo: "se quedó mirando al techo sin razón."
  })
};

import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".love",".amor"],
  usage: ".love [@usuario]",
  desc: "Reacción de anime: love (Sentirse enamorado)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "love",
    fraseConOtro: "está enamorado de",
    fraseSolo: "se siente muy enamorado."
  })
};

import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".seduce",".seducir"],
  usage: ".seduce [@usuario]",
  desc: "Reacción de anime: seduce (Seducir a alguien)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "seduce",
    fraseConOtro: "intentó seducir a",
    fraseSolo: "se creyó irresistible."
  })
};

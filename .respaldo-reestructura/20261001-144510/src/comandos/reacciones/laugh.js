import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".laugh", ".reir"],
  usage: ".laugh [@usuario]",
  desc: "Reacción de anime: laugh",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "laugh",
    fraseConOtro: "se está riendo con",
    fraseSolo: "se está riendo solo."
  })
};

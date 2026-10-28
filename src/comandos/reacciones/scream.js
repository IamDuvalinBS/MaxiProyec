import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".scream",".gritar"],
  usage: ".scream [@usuario]",
  desc: "Reacción de anime: scream (Gritar)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "scream",
    fraseConOtro: "le gritó a",
    fraseSolo: "gritó con todas sus fuerzas."
  })
};

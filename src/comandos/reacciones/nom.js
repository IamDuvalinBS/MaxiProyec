import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".nom", ".comer"],
  usage: ".nom [@usuario]",
  desc: "Reacción de anime: nom",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "nom",
    fraseConOtro: "le está comiendo la mejilla a",
    fraseSolo: "está comiendo algo rico."
  })
};

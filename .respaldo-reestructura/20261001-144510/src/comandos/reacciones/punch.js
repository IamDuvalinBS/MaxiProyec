import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".punch", ".puñetazo"],
  usage: ".punch [@usuario]",
  desc: "Reacción de anime: punch",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "punch",
    fraseConOtro: "le dio un puñetazo a",
    fraseSolo: "lanzó un puñetazo al aire."
  })
};

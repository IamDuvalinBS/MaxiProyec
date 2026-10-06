import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".hug", ".abrazar"],
  usage: ".hug [@usuario]",
  desc: "Reacción de anime: hug",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "hug",
    fraseConOtro: "le dio un abrazo a",
    fraseSolo: "se abrazó a sí mismo."
  })
};

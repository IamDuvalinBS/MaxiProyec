import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".bite", ".morder"],
  usage: ".bite [@usuario]",
  desc: "Reacción de anime: bite",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "bite",
    fraseConOtro: "mordió a",
    fraseSolo: "se mordió a sí mismo."
  })
};

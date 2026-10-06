import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".sleep", ".dormir"],
  usage: ".sleep [@usuario]",
  desc: "Reacción de anime: sleep",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "sleep",
    fraseConOtro: "se durmió junto a",
    fraseSolo: "está durmiendo plácidamente."
  })
};

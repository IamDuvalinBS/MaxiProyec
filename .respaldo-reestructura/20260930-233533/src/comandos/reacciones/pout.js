import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".pout", ".pucheros"],
  usage: ".pout [@usuario]",
  desc: "Reacción de anime: pout",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "pout",
    fraseConOtro: "le hizo pucheros a",
    fraseSolo: "está haciendo pucheros."
  })
};

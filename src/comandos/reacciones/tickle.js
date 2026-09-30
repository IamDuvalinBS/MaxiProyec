import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".tickle", ".cosquillas"],
  usage: ".tickle [@usuario]",
  desc: "Reacción de anime: tickle",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "tickle",
    fraseConOtro: "le está haciendo cosquillas a",
    fraseSolo: "se está haciendo cosquillas."
  })
};

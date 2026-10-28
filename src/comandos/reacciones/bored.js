import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".bored",".aburrido"],
  usage: ".bored [@usuario]",
  desc: "Reacción de anime: bored (Estar aburrido)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "bored",
    fraseConOtro: "se aburre muchísimo con",
    fraseSolo: "está aburridísimo."
  })
};

import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".sigh",".suspirar"],
  usage: ".sigh [@usuario]",
  desc: "Reacción de anime: sigh (Suspirar)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "sigh",
    fraseConOtro: "suspiró profundamente por",
    fraseSolo: "suspiró con resignación."
  })
};

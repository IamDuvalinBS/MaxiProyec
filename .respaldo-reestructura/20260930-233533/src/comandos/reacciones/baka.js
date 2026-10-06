import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".baka", ".tonto"],
  usage: ".baka [@usuario]",
  desc: "Reacción de anime: baka",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "baka",
    fraseConOtro: "le gritó \"baka\" a",
    fraseSolo: "está diciendo tonterías."
  })
};

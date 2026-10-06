import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".pat", ".acariciar"],
  usage: ".pat [@usuario]",
  desc: "Reacción de anime: pat",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "pat",
    fraseConOtro: "le dio unas palmaditas a",
    fraseSolo: "se acarició la cabeza."
  })
};

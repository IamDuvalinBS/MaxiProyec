import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".clap",".aplaudir"],
  usage: ".clap [@usuario]",
  desc: "Reacción de anime: clap (Aplaudir)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "clap",
    fraseConOtro: "está aplaudiendo a",
    fraseSolo: "está aplaudiendo con ganas."
  })
};

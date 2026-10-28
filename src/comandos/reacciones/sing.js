import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".sing",".cantar"],
  usage: ".sing [@usuario]",
  desc: "Reacción de anime: sing (Cantar)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "sing",
    fraseConOtro: "le cantó una canción a",
    fraseSolo: "está cantando a todo pulmón."
  })
};

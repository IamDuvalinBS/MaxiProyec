import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".thumbsup", ".aprobar"],
  usage: ".thumbsup [@usuario]",
  desc: "Reacción de anime: thumbsup",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "thumbsup",
    fraseConOtro: "le dio el visto bueno a",
    fraseSolo: "dio el visto bueno."
  })
};

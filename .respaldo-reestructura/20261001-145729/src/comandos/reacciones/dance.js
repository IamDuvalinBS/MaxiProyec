import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".dance", ".bailar"],
  usage: ".dance [@usuario]",
  desc: "Reacción de anime: dance",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "dance",
    fraseConOtro: "está bailando con",
    fraseSolo: "está bailando solo."
  })
};

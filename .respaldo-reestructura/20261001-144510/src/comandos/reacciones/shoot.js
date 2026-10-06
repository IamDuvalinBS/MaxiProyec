import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".shoot", ".disparar"],
  usage: ".shoot [@usuario]",
  desc: "Reacción de anime: shoot",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "shoot",
    fraseConOtro: "le apuntó y disparó a",
    fraseSolo: "disparó al aire."
  })
};

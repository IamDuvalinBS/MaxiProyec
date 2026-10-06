import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".peck", ".piquito"],
  usage: ".peck [@usuario]",
  desc: "Reacción de anime: peck",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "peck",
    fraseConOtro: "le dio un piquito a",
    fraseSolo: "mandó un beso rápido al aire."
  })
};

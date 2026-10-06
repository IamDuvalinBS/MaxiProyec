import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".lurk", ".acechar"],
  usage: ".lurk [@usuario]",
  desc: "Reacción de anime: lurk",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "lurk",
    fraseConOtro: "está acechando en las sombras cerca de",
    fraseSolo: "está acechando en las sombras."
  })
};

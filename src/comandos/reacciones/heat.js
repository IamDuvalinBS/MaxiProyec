import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".heat",".calor"],
  usage: ".heat [@usuario]",
  desc: "Reacción de anime: heat (Tener calor)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "heat",
    fraseConOtro: "se derrite de calor junto a",
    fraseSolo: "se está derritiendo de calor."
  })
};

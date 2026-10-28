import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".jump",".saltar"],
  usage: ".jump [@usuario]",
  desc: "Reacción de anime: jump (Saltar)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "jump",
    fraseConOtro: "saltó de alegría junto a",
    fraseSolo: "está saltando de un lado a otro."
  })
};

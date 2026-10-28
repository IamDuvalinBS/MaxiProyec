import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".cringe",".grima"],
  usage: ".cringe [@usuario]",
  desc: "Reacción de anime: cringe (Sentir cringe)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "cringe",
    fraseConOtro: "sintió cringe por culpa de",
    fraseSolo: "sintió muchísimo cringe."
  })
};

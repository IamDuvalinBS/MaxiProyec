import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".tea",".te",".té"],
  usage: ".tea [@usuario]",
  desc: "Reacción de anime: tea (Tomar té)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "tea",
    fraseConOtro: "invitó una tacita de té a",
    fraseSolo: "se está tomando un té."
  })
};

import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".bonk", ".golpe"],
  usage: ".bonk [@usuario]",
  desc: "Reacción de anime: yeet",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "yeet",
    fraseConOtro: "le dio un bonk a",
    fraseSolo: "se dio un bonk a sí mismo."
  })
};

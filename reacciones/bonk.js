import { reactionCommand } from "../core.js";

export default {
  names: [".bonk", ".golpe"],
  desc: "Reacción de anime: bonk",
  category: "Diversión",
  usage: ".bonk [@usuario]",
  handler: reactionCommand({
    apiAction: "yeet",
    fraseConOtro: "le dio un bonk a",
    fraseSolo: "se dio un bonk a sí mismo."
  })
};

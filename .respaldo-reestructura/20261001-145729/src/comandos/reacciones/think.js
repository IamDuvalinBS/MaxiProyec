import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".think", ".pensar"],
  usage: ".think [@usuario]",
  desc: "Reacción de anime: think",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "think",
    fraseConOtro: "está pensando profundamente en",
    fraseSolo: "se quedó pensando muy intensamente."
  })
};

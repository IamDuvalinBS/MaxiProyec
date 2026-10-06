import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".facepalm", ".decepcion"],
  usage: ".facepalm [@usuario]",
  desc: "Reacción de anime: facepalm",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "facepalm",
    fraseConOtro: "se llevó la mano a la cara por",
    fraseSolo: "se llevó la mano a la cara, decepcionado."
  })
};

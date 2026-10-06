import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".wink", ".guiñar"],
  usage: ".wink [@usuario]",
  desc: "Reacción de anime: wink",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "wink",
    fraseConOtro: "le guiñó el ojo a",
    fraseSolo: "se guiñó a sí mismo en el espejo."
  })
};

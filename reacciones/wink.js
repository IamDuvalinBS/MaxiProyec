import { reactionCommand } from "../core.js";

export default {
  names: [".wink", ".guiñar"],
  desc: "Reacción de anime: wink",
  category: "Diversión",
  usage: ".wink [@usuario]",
  handler: reactionCommand({
    apiAction: "wink",
    fraseConOtro: "le guiñó el ojo a",
    fraseSolo: "se guiñó a sí mismo en el espejo."
  })
};

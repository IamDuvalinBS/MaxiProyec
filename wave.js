import { reactionCommand } from "../core.js";

export default {
  names: [".wave", ".saludar"],
  desc: "Reacción de anime: wave",
  category: "Diversión",
  usage: ".wave [@usuario]",
  handler: reactionCommand({
    apiAction: "wave",
    fraseConOtro: "está saludando a",
    fraseSolo: "se saludó a sí mismo."
  })
};

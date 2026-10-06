import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".wave", ".saludar"],
  usage: ".wave [@usuario]",
  desc: "Reacción de anime: wave",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "wave",
    fraseConOtro: "está saludando a",
    fraseSolo: "se saludó a sí mismo."
  })
};

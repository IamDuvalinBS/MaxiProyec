import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".nope", ".negar"],
  usage: ".nope [@usuario]",
  desc: "Reacción de anime: nope",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "nope",
    fraseConOtro: "le dijo \"¡No!\" a",
    fraseSolo: "expresa claramente su desacuerdo."
  })
};

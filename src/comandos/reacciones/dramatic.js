import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".dramatic",".drama"],
  usage: ".dramatic [@usuario]",
  desc: "Reacción de anime: dramatic (Drama)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "dramatic",
    fraseConOtro: "le hizo un drama enorme a",
    fraseSolo: "está haciendo un drama."
  })
};

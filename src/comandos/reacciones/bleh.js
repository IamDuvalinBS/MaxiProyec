import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".bleh",".lengua"],
  usage: ".bleh [@usuario]",
  desc: "Reacción de anime: bleh (Sacar la lengua)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "bleh",
    fraseConOtro: "le sacó la lengua a",
    fraseSolo: "sacó la lengua al aire."
  })
};

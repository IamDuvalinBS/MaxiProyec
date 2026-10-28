import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".lick",".lamer"],
  usage: ".lick [@usuario]",
  desc: "Reacción de anime: lick (Lamer a alguien)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "lick",
    fraseConOtro: "lamió a",
    fraseSolo: "lamió el aire."
  })
};

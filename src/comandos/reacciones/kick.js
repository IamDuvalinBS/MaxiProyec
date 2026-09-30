import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".kick", ".patada"],
  usage: ".kick [@usuario]",
  desc: "Reacción de anime: kick",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "kick",
    fraseConOtro: "le dio una patada a",
    fraseSolo: "pateó el aire sin motivo."
  })
};

import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".smile", ".sonreir"],
  usage: ".smile [@usuario]",
  desc: "Reacción de anime: smile",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "smile",
    fraseConOtro: "le sonrió a",
    fraseSolo: "está sonriendo."
  })
};

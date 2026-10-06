import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".nod", ".asentir"],
  usage: ".nod [@usuario]",
  desc: "Reacción de anime: nod",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "nod",
    fraseConOtro: "asintió mirando a",
    fraseSolo: "asintió con la cabeza."
  })
};

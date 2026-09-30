import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".shrug", ".encogerse"],
  usage: ".shrug [@usuario]",
  desc: "Reacción de anime: shrug",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "shrug",
    fraseConOtro: "se encogió de hombros mirando a",
    fraseSolo: "se encogió de hombros."
  })
};

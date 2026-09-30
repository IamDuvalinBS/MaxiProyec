import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".smug", ".engreido"],
  usage: ".smug [@usuario]",
  desc: "Reacción de anime: smug",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "smug",
    fraseConOtro: "puso cara de superioridad frente a",
    fraseSolo: "puso cara de superioridad."
  })
};

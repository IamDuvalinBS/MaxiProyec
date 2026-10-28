import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".eat",".comida"],
  usage: ".eat [@usuario]",
  desc: "Reacción de anime: eat (Comer algo delicioso)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "eat",
    fraseConOtro: "está comiendo con",
    fraseSolo: "está comiendo algo delicioso."
  })
};

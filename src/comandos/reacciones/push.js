import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".push",".empujar"],
  usage: ".push [@usuario]",
  desc: "Reacción de anime: push (Empujar a alguien)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "push",
    fraseConOtro: "empujó a",
    fraseSolo: "se empujó a sí mismo."
  })
};

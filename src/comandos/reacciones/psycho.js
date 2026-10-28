import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".psycho",".psicopata",".psicópata"],
  usage: ".psycho [@usuario]",
  desc: "Reacción de anime: psycho (Hacerse el psicópata)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "psycho",
    fraseConOtro: "miró de forma psicópata a",
    fraseSolo: "se hizo el psicópata."
  })
};

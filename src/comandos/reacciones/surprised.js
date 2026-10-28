import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".surprised",".sorprendido"],
  usage: ".surprised [@usuario]",
  desc: "Reacción de anime: surprised (Estar sorprendido)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "surprised",
    fraseConOtro: "se sorprendió muchísimo con",
    fraseSolo: "se quedó con la boca abierta."
  })
};

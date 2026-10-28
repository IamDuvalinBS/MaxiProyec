import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".lewd",".lascivo"],
  usage: ".lewd [@usuario]",
  desc: "Reacción de anime: lewd (Hacer algo lascivo)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "lewd",
    fraseConOtro: "le lanzó una mirada pícara a",
    fraseSolo: "puso una cara muy pícara."
  })
};

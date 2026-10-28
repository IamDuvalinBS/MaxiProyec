import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".cookie",".galleta"],
  usage: ".cookie [@usuario]",
  desc: "Reacción de anime: cookie (Comer galletas)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "cookie",
    fraseConOtro: "le dio una galleta a",
    fraseSolo: "se comió una galleta."
  })
};

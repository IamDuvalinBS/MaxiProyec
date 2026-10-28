import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".run",".correr"],
  usage: ".run [@usuario]",
  desc: "Reacción de anime: run (Correr)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "run",
    fraseConOtro: "salió corriendo de",
    fraseSolo: "salió corriendo."
  })
};

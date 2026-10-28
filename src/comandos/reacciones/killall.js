import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".killall",".matartodos"],
  usage: ".killall [@usuario]",
  desc: "Reacción de anime: killall (Ejecutar un killall (en broma))",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "killall",
    fraseConOtro: "ejecutó killall y desapareció a todos menos a",
    fraseSolo: "ejecutó killall y desapareció a todos."
  })
};

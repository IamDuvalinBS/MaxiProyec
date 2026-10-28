import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".coffee",".cafe",".café"],
  usage: ".coffee [@usuario]",
  desc: "Reacción de anime: coffee (Tomar café)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "coffee",
    fraseConOtro: "invitó un cafecito a",
    fraseSolo: "se está tomando un cafecito."
  })
};

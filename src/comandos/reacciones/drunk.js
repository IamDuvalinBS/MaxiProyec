import { reactionCommand } from "../../reacciones/motor.js";

export default {
  names: [".drunk",".borracho"],
  usage: ".drunk [@usuario]",
  desc: "Reacción de anime: drunk (Estar borracho)",
  category: "Diversión",
  handler: reactionCommand({
    apiAction: "drunk",
    fraseConOtro: "está borracho junto a",
    fraseSolo: "está borracho y no sabe dónde está."
  })
};

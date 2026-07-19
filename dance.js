import { reactionCommand } from "../core.js";

export default {
  names: [".dance", ".bailar"],
  desc: "Reacción de anime: dance",
  category: "Diversión",
  usage: ".dance [@usuario]",
  handler: reactionCommand({
    apiAction: "dance",
    fraseConOtro: "está bailando con",
    fraseSolo: "está bailando solo."
  })
};

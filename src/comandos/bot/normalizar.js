import { ownerCommand } from "../../../motores/owner.js";
import { activarEvento } from "./cambiar.js";

export default {
  names: [".normalizar", ".normalidad", ".estilonormal"],
  usage: ".normalizar",
  desc: "Volver toda la economía al estilo normal, quitando cualquier evento activo (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ reply }) => {
    await activarEvento(reply, "normal");
  })
};

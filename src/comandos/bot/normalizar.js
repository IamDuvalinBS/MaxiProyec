import { ownerCommand } from "../../../motores/owner.js";
import { activarEvento } from "./cambiar.js";

export default {
  names: [".normalizar", ".normalidad", ".estilonormal"],
  usage: ".normalizar",
  desc: "Vuelve la economía al estilo normal (solo owner)",
  category: "Owner",
  handler: ownerCommand(async ({ reply }) => {
    await activarEvento(reply, "normal");
  })
};

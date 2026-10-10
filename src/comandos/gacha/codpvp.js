import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

export default {
  names: [".codpvp"],
  desc: "Desafía a otro usuario con tu ítem de COD: .codpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
  category: "Gacha",
  usage: ".codpvp <@usuario> <apuesta> <ID>",
  handler: crearHandlerPvp({ categoria: "cod", comando: "codpvp", nombreLuchador: "ítem de COD" })
};

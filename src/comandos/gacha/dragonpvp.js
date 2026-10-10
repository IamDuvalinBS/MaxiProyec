import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

export default {
  names: [".dragonpvp"],
  desc: "Desafía a otro usuario con tu dragón: .dragonpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
  category: "Gacha",
  usage: ".dragonpvp <@usuario> <apuesta> <ID>",
  handler: crearHandlerPvp({ categoria: "dragon", comando: "dragonpvp", nombreLuchador: "dragón" })
};

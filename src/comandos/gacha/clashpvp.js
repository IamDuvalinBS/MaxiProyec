import { crearHandlerPvp } from "../../../motores/gacha-pvp.js";

export default {
  names: [".clashpvp"],
  desc: "Desafía a otro usuario con tu carta: .clashpvp <@usuario> <apuesta> <ID> (el combate se juega por rondas)",
  category: "Gacha",
  usage: ".clashpvp <@usuario> <apuesta> <ID>",
  handler: crearHandlerPvp({ categoria: "clash", comando: "clashpvp", nombreLuchador: "carta" })
};

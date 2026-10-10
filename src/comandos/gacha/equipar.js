import { crearComandoClaim } from "../../../motores/gacha-comandos.js";

export default crearComandoClaim({
  categoria: "cod",
  names: [".equipar"],
  desc: "Reclama el personaje que apareció en la última tirada de este gacha"
});

import { crearComandoClaim } from "../../../motores/gacha-core.js";

export default crearComandoClaim({
  categoria: "pokemon",
  names: [".atrapar", ".catch"],
  desc: "Atrapa el Pokémon generado con .pokemon"
});

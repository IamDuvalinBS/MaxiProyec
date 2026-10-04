import { crearComandoDar } from "../../../motores/gacha-tienda.js";

export default crearComandoDar({
  categoria: "pokemon",
  names: [".pokedar", ".pokealimentar"],
  desc: "Da de comer a un Pokémon para subirlo de nivel: .pokedar <número> [ID]"
});

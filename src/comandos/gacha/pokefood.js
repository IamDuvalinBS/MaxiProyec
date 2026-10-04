import { crearComandoComprar } from "../../../motores/gacha-tienda.js";

export default crearComandoComprar({
  categoria: "pokemon",
  names: [".pokefood", ".pokecomprar"],
  desc: "Compra comida Pokémon por su número: .pokefood <número> [cantidad]"
});

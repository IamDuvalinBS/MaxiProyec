import { crearComandoComprar } from "../../../motores/gacha-comandos.js";

export default crearComandoComprar({
  categoria: "dragon",
  names: [".dragoncomprar"],
  desc: "Compra artículos de la tienda por su número: <comando> <número> [cantidad]"
});

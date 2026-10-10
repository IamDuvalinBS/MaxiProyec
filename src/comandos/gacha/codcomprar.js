import { crearComandoComprar } from "../../../motores/gacha-comandos.js";

export default crearComandoComprar({
  categoria: "cod",
  names: [".codcomprar"],
  desc: "Compra artículos de la tienda por su número: <comando> <número> [cantidad]"
});

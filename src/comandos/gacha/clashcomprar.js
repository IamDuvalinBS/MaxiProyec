import { crearComandoComprar } from "../../../motores/gacha-comandos.js";

export default crearComandoComprar({
  categoria: "clash",
  names: [".clashcomprar"],
  desc: "Compra artículos de la tienda por su número: <comando> <número> [cantidad]"
});

import { crearComandoComprar } from "../../../motores/gacha-tienda.js";

export default crearComandoComprar({
  categoria: "snake",
  names: [".orbe", ".comprarorbe"],
  desc: "Compra orbes por su número: .orbe <número> [cantidad]"
});

import { crearComandoComprar } from "../../../motores/gacha-tienda.js";

export default crearComandoComprar({
  categoria: "waifu",
  names: [".waifucomprar", ".comprarregalo"],
  desc: "Compra regalos para tus waifus por su número: .waifucomprar <número> [cantidad]"
});

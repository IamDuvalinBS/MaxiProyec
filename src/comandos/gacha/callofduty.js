import { crearComandoTirada } from "../../../motores/gacha-comandos.js";

export default crearComandoTirada({
  categoria: "cod",
  names: [".callofduty", ".cod"],
  textoVacio: "❌ Todavía no hay ítems de Call of Duty cargados. Un owner tiene que usar *.cargarcod buscar operators* para encontrar la categoría de la wiki y *.cargarcod <categoría> <tipo>* para cargarla."
});

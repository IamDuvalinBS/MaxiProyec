import { crearComandoTirada } from "../../../motores/gacha-comandos.js";

export default crearComandoTirada({
  categoria: "dragon",
  names: [".dragon", ".dragonmania"],
  textoVacio: "❌ Todavía no hay dragones cargados. Un owner tiene que usar *.cargardragones* para importarlos."
});

import { crearComandoTirada } from "../../../motores/gacha-comandos.js";
import { asegurarClash, sincronizarClash } from "../../../motores/gacha-catalogos.js";

export default crearComandoTirada({
  categoria: "clash",
  names: [".clashroyale", ".cr"],
  asegurar: asegurarClash,
  sincronizar: sincronizarClash,
  textoVacio: "❌ No se pudieron cargar las cartas de Clash Royale. Inténtalo de nuevo en un momento."
});

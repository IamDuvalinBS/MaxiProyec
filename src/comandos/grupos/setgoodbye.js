import { crearComandoMensaje } from "../../grupos/mensajes-editables.js";

export default crearComandoMensaje({
  names: [".setgoodbye", ".setbye"],
  uso: ".setgoodbye <mensaje con broches> | .setgoodbye reset",
  desc: "Edita el mensaje de despedida del grupo",
  emoji: "🪺",
  titulo: "SETGOODBYE",
  tituloGuardado: "DESPEDIDA ACTUALIZADA",
  clave: "plantillaDespedida",
  nombreMensaje: "mensaje de despedida",
  comandoPrueba: ".testbye",
  comandoInterruptor: ".goodbye",
  ejemplo: "Adiós {usuario}, te fuiste del {grupo}. Ahora quedamos {miembros} integrantes."
});

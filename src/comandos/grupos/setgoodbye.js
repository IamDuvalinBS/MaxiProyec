import { crearComandoMensaje } from "../../grupos/mensajes-editables.js";

export default crearComandoMensaje({
  names: [".setgoodbye", ".setbye"],
  uso: ".setgoodbye <mensaje con broches> | .setgoodbye reset",
  desc: "Editar el mensaje de despedida con broches como {usuario}, {grupo}, {miembros}, {creacion} y {link} (máx. 1000 caracteres)",
  emoji: "🪺",
  titulo: "SETGOODBYE",
  tituloGuardado: "DESPEDIDA ACTUALIZADA",
  clave: "plantillaDespedida",
  nombreMensaje: "mensaje de despedida",
  comandoPrueba: ".testbye",
  comandoInterruptor: ".goodbye",
  ejemplo: "Adiós {usuario}, te fuiste del {grupo}. Ahora quedamos {miembros} integrantes."
});

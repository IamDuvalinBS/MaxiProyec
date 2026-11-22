import { crearComandoMensaje } from "../../grupos/mensajes-editables.js";

export default crearComandoMensaje({
  names: [".setwelcome"],
  uso: ".setwelcome <mensaje con broches> | .setwelcome reset",
  desc: "Edita el mensaje de bienvenida del grupo",
  emoji: "🏰",
  titulo: "SETWELCOME",
  tituloGuardado: "BIENVENIDA ACTUALIZADA",
  clave: "plantillaBienvenida",
  clavesViejas: ["textoBienvenida"],
  nombreMensaje: "mensaje de bienvenida",
  comandoPrueba: ".testwelcome",
  comandoInterruptor: ".welcome",
  ejemplo: "Hola {usuario} bienvenido al {grupo}, ahora formas parte de {miembros} amiguitos. El grupo fue creado {creacion}\n\nComparte el link del grupo:\n{link}"
});

import { crearInterruptor } from "../../grupos/interruptores.js";

export default crearInterruptor({
  names: [".welcome", ".bienvenida"],
  usage: ".welcome on/off",
  desc: "Activar o desactivar la bienvenida del grupo",
  clave: "bienvenida",
  emoji: "🏰",
  titulo: "WELCOME",
  tituloActivado: "BIENVENIDA ACTIVADA",
  tituloDesactivado: "BIENVENIDA DESACTIVADA",
  relatoActivado: "A partir de ahora se dará la bienvenida a cada nuevo integrante del grupo.",
  relatoDesactivado: "Ya no se enviará un mensaje de bienvenida a los nuevos integrantes.",
  tipActivado: ["Para personalizar el mensaje usa *.setwelcome* (admins).", "Para probarlo usa *.testwelcome* (admins)."],
  tipDesactivado: "Para activarla nuevamente usa *.welcome on* (admins)."
});

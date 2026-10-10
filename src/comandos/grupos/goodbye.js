import { crearInterruptor } from "../../grupos/interruptores.js";

export default crearInterruptor({
  names: [".goodbye", ".despedida"],
  usage: ".goodbye on/off",
  desc: "Activar o desactivar la despedida del grupo",
  clave: "despedida",
  emoji: "🪺",
  titulo: "GOODBYE",
  tituloActivado: "DESPEDIDA ACTIVADA",
  tituloDesactivado: "DESPEDIDA DESACTIVADA",
  relatoActivado: "A partir de ahora se enviará un mensaje cuando un integrante abandone el grupo.",
  relatoDesactivado: "Ya no se enviará un mensaje cuando un integrante abandone el grupo.",
  tipActivado: "Para probarla usa *.testbye* (admins).",
  tipDesactivado: "Para activarla nuevamente usa *.goodbye on* (admins)."
});

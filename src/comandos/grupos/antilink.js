import { crearInterruptor } from "../../grupos/interruptores.js";

export default crearInterruptor({
  names: [".antilink"],
  usage: ".antilink on/off",
  desc: "Eliminar enlaces de otros grupos",
  clave: "antilink",
  emoji: "🛡️",
  titulo: "ANTILINK",
  tituloActivado: "ANTILINK ACTIVADO",
  tituloDesactivado: "ANTILINK DESACTIVADO",
  relatoActivado: "Los enlaces de invitación a otros grupos serán eliminados automáticamente. Los administradores quedan exentos.",
  relatoDesactivado: "Los enlaces de invitación a otros grupos ya no serán eliminados.",
  tipActivado: "Para desactivarlo usa *.antilink off* (admins).",
  tipDesactivado: "Para activarlo nuevamente usa *.antilink on* (admins).",
  botAdmin: true
});

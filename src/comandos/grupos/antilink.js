import { crearInterruptor } from "../../grupos/interruptores.js";

export default crearInterruptor({
  names: [".antilink"],
  usage: ".antilink on/off",
  desc: "Expulsar a quien envíe enlaces de otros grupos",
  clave: "antilink",
  emoji: "🛡️",
  titulo: "ANTILINK",
  tituloActivado: "ANTILINK ACTIVADO",
  tituloDesactivado: "ANTILINK DESACTIVADO",
  relatoActivado: "Quien envíe un enlace de invitación a otros grupos será expulsado automáticamente. Los administradores quedan exentos.",
  relatoDesactivado: "Los enlaces de invitación a otros grupos ya no serán sancionados.",
  tipActivado: "Para desactivarlo usa *.antilink off* (admins).",
  tipDesactivado: "Para activarlo nuevamente usa *.antilink on* (admins).",
  botAdmin: true
});

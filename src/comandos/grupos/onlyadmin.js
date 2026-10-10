import { crearInterruptor } from "../../grupos/interruptores.js";

export default crearInterruptor({
  names: [".onlyadmin", ".soloadmin"],
  usage: ".onlyadmin on/off",
  desc: "Hacer que el bot solo responda a los administradores",
  clave: "soloAdmins",
  emoji: "🐲",
  titulo: "ADMIN - BOT",
  tituloActivado: "ADMIN - BOT",
  tituloDesactivado: "BOT - TODOS",
  relatoActivado: "Un administrador colocó el bot para que únicamente los admins puedan utilizarlo.",
  relatoDesactivado: "Un administrador permitió que todos los miembros utilicen el bot nuevamente.",
  tipActivado: "Para remover esta acción usa *.onlyadmin off* (admins).",
  tipDesactivado: "Para restringirlo nuevamente usa *.onlyadmin on* (admins)."
});

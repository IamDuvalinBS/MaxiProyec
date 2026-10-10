import { comandoGrupo } from "../../grupos/nucleo.js";
import { enviarBienvenida } from "../../eventos/welcome.js";

export default {
  names: [".testwelcome"],
  usage: ".testwelcome",
  desc: "Probar la bienvenida con tu usuario",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🏰", titulo: "TESTWELCOME" }, async ({ sock, from, sender }) => {
    await enviarBienvenida(sock, from, sender);
  })
};

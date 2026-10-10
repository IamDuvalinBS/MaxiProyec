import { comandoGrupo } from "../../grupos/nucleo.js";
import { enviarDespedida } from "../../eventos/goodbye.js";

export default {
  names: [".testbye"],
  usage: ".testbye",
  desc: "Probar la despedida con tu usuario",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🪺", titulo: "TESTBYE" }, async ({ sock, from, sender }) => {
    await enviarDespedida(sock, from, sender);
  })
};

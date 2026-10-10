import { comandoGrupo, enlaceDeGrupo, olvidarEnlace } from "../../grupos/nucleo.js";
import { tarjetaMarcada } from "../../economia/estilo.js";
import { enviarConBoton } from "../../../motores/botones.js";

export default {
  names: [".link", ".enlace"],
  usage: ".link",
  desc: "Mostrar el enlace de invitación del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "⚙️", titulo: "GRUPO - LINK", admin: false, botAdmin: true }, async ({ sock, from, msg, responder, avisar }) => {
    olvidarEnlace(from);
    const enlace = await enlaceDeGrupo(sock, from);
    if (!enlace) return avisar("No fue posible obtener el enlace del grupo.");

    const texto = tarjetaMarcada({
      emoji: "⚙️",
      titulo: "GRUPO - LINK",
      relato: "Puedes usar este enlace para compartirlo, y gracias a ello posiblemente tengas más usuarios.",
      lineas: ["⧼🪂⧽ *Link del grupo*::", `> ${enlace}`],
      tip: "Puedes presionar el botón de abajo para copiar directamente el enlace."
    });

    const enviado = await enviarConBoton({
      sock,
      from,
      msg,
      texto,
      footer: "Enlace de invitación del grupo",
      boton: { texto: "Copiar enlace", copiar: enlace }
    });
    if (!enviado) await responder(texto);
  })
};

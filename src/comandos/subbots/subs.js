import { ownerCommand } from "../../../motores/owner.js";
import { estadoSubbots } from "../../subbots/gestor.js";

export default {
  names: [".subs", ".subbots"],
  usage: ".subs",
  desc: "Lista los subbots activos y la memoria que usa el bot",
  category: "Owner",
  handler: ownerCommand(async ({ reply }) => {
    const { limite, lista } = estadoSubbots();
    const mb = (n) => `${(n / 1048576).toFixed(0)} MB`;
    const memoria = process.memoryUsage();
    const filas = lista.map((s) => `• ${s.numero} › ${s.vinculando ? "vinculando" : s.enLinea ? "en línea" : `reconectando (${s.reintentos})`}`);
    await reply({
      text: [
        "🤖 *SUBBOTS*",
        "",
        `Activos:: *${lista.length}/${limite}*`,
        ...(filas.length ? filas : ["• Ninguno"]),
        "",
        "🧠 *MEMORIA*",
        `RSS:: *${mb(memoria.rss)}*`,
        `Heap:: *${mb(memoria.heapUsed)}* de *${mb(memoria.heapTotal)}*`,
        `Externa:: *${mb(memoria.external + memoria.arrayBuffers)}*`
      ].join("\n")
    });
  })
};

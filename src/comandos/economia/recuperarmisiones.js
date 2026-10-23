import { ownerCommand } from "../../../motores/owner.js";
import { recuperarMisionesDiarias } from "../../economia/logros.js";

export default {
  names: [".recuperarmisiones"],
  usage: ".recuperarmisiones",
  desc: "Cuenta las misiones diarias de economía que se hicieron antes de corregir el registro",
  category: "Owner",
  handler: ownerCommand(async ({ reply }) => {
    const r = recuperarMisionesDiarias();
    await reply({
      text: [
        "📋 *MISIONES RECUPERADAS*",
        "",
        `Cuentas con misiones vigentes:: *${r.revisadas}*`,
        `Cuentas corregidas:: *${r.cuentas}*`,
        `Misiones actualizadas:: *${r.misiones}*`,
        "",
        "> Solo se recuperan cofre, daily, semanal, trivia y trabajos hechos después de que empezaron sus misiones del día."
      ].join("\n")
    });
  })
};

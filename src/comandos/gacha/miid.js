import { esOwnerGacha, numeroDe } from "../../../motores/gacha-owners.js";
import { tarjeta } from "../../../motores/gacha-core.js";

export default {
  names: [".miid", ".whoami"],
  desc: "Muestra tu ID de WhatsApp y si el gacha te reconoce como owner",
  category: "Gacha",
  handler: async ({ sender, reply }) => {
    const num = numeroDe(sender);
    const esLid = String(sender).endsWith("@lid");
    const owner = esOwnerGacha(sender);
    const lineas = [
      `🆔 *Tu ID* ›› ${sender}`,
      `🔢 *Número* ›› ${num}${esLid ? " (ID interno @lid)" : ""}`,
      `👑 *Owner del gacha* ›› ${owner ? "Sí ✅" : "No ❌"}`
    ];
    if (!owner) {
      lineas.push("", "Si eres owner, en Termux (dentro de la carpeta del bot) ejecuta:", `echo "${num}" >> data/owners-gacha.txt`, "y ya funciona, sin reiniciar.");
    }
    return reply({ text: tarjeta({ emoji: "🪪", titulo: "MI ID", lineas }) });
  }
};

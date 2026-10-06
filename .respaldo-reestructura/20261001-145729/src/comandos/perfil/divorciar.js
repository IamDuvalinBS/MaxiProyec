import { getProfile } from "../../../motores/profile.js";
import { saveAccount } from "../../../motores/db.js";

export default {
  names: [".divorciar", ".divorce"],
  desc: "Separarte de tu pareja actual",
  category: "Perfil",
  handler: async ({ sender, reply }) => {
    const p = getProfile(sender);
    if (!p.marriedTo) return reply({ text: "❌ No estás casado con nadie." });

    const exPareja = getProfile(p.marriedTo);
    const exId = p.marriedTo;
    p.marriedTo = "";
    p.marriedSince = "";
    exPareja.marriedTo = "";
    exPareja.marriedSince = "";

    await saveAccount(sender);
    await saveAccount(exId);

    await reply({ text: "💔 Te has divorciado. Ya puedes volver a casarte con otra persona." });
  }
};

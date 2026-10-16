const LIMITE_TITULO = 60;
const MEDALLAS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

const numero = (jid) => String(jid || "").split("@")[0].split(":")[0];

const mezclar = (lista) => {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
};

export default {
  names: [".top5", ".topazar", ".topgrupo"],
  usage: ".top5 <título>",
  desc: "Etiqueta a 5 personas al azar del grupo según el título que elijas",
  category: "Diversión",
  handler: async ({ sock, from, msg, cleanText, reply }) => {
    if (!from.endsWith("@g.us")) {
      await reply({ text: "⧼🏆⧽ *TOP DEL GRUPO*\n\nEste comando solo se puede usar dentro de un grupo." });
      return;
    }

    const titulo = cleanText.split(/\s+/).slice(1).join(" ").trim().slice(0, LIMITE_TITULO);
    if (!titulo) {
      await reply({ text: "⧼🏆⧽ *TOP DEL GRUPO*\n\nIndica el título del top que deseas generar.\n\n> Usa *.top5 Más pros del grupo*." });
      return;
    }

    let meta;
    try {
      meta = await sock.groupMetadata(from);
    } catch (e) {
      console.log("❌ Error leyendo el grupo para .top5: " + e.message);
      await reply({ text: "❌ No se pudo obtener la lista de participantes del grupo." });
      return;
    }

    const propios = new Set([numero(sock.user?.id), numero(sock.user?.lid)]);
    const candidatos = meta.participants.map((p) => p.id).filter((id) => !propios.has(numero(id)));
    if (!candidatos.length) {
      await reply({ text: "❌ No hay suficientes participantes en el grupo para generar el top." });
      return;
    }

    const elegidos = mezclar(candidatos).slice(0, 5);
    const lista = elegidos.map((id, i) => `${MEDALLAS[i]} @${numero(id)}`).join("\n");

    await sock.sendMessage(
      from,
      {
        text: `⧼🏆⧽ *TOP ${elegidos.length} • ${titulo.toUpperCase()}*\n\nEstas son las personas elegidas al azar para este ranking.\n\n${lista}\n\n> Usa *.top5 <título>* para generar otro ranking.`,
        mentions: elegidos
      },
      { quoted: msg }
    );
  }
};

/**
 * Envía la despedida cuando un participante sale o es eliminado del grupo.
 * @param {object} conn - Cliente/conexión de Baileys
 * @param {object} event - Evento de actualización de grupo
 */
export const sendGoodbye = async (conn, event) => {
    try {
        if (event.action !== 'remove') return;
        const user = event.participants[0];
        const group = await conn.groupMetadata(event.id);
        const date = new Date().toLocaleDateString();

        const userTag = user.split('@')[0];

        const texto = `⧼🪺⧽ \`\`\`##\`\`\` *USUARIO FUERA* \n\n> 🪨 Es una pena terrible... A Oliver le calló un meteorito mientras caminaba por la calle. \n\n 〔🧠〕  *¿QUIEN ES ESTE TIPO?*\n\n⧼📢⧽* ⁂❧ *Usuario*::\n> @${userTag}\n⧼🪷⧽* ⁂❧ *Fecha*::\n> ${date} fue su último resplandor. \n⧼🏡⧽* ⁂❧ *Usuarios*::\n> ${group.participants.length} actualmente. \n\n> *Posiblemente nadie lo quiso en este grupo.*`;

        await conn.sendMessage(event.id, { text: texto, mentions: [user] });
    } catch (error) {
        console.error('Error al enviar la despedida:', error);
    }
};

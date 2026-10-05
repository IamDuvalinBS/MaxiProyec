/**
 * Envía la bienvenida cuando entra un participante al grupo.
 * @param {object} conn - Cliente/conexión de Baileys
 * @param {object} event - Evento de actualización de grupo
 */
export const sendWelcome = async (conn, event) => {
    try {
        if (event.action !== 'add') return;
        const user = event.participants[0];
        const group = await conn.groupMetadata(event.id);
        const date = new Date().toLocaleDateString();
        const customText = global.welcomeTexts?.[event.id] || "Bienvenido al grupo.";
        const link = await conn.groupInviteCode(event.id).catch(() => 'No disponible');

        const userTag = user.split('@')[0];
        const creationDate = new Date(group.creation * 1000).toLocaleDateString();

        const texto = `⏤͟͟͞͞⁂ ⧼🏰⧽ \`\`\`##\`\`\` *NUEVO MIEMBRO* \n\n> 📡 ${customText}\n\n 〔📚〕 *INFORMACIÓN*\n\n⧼📢⧽* ⁂❧ *Usuario*::\n> @${userTag}\n⧼🪷⧽* ⁂❧ *Fecha*::\n> ${date}\n⧼🦦⧽* ⁂❧ *Link Grupo*::\n> https://chat.whatsapp.com/${link} \n\n 〔📡〕 *INFO DEL GRUPO*\n\n⧼🪼⧽* ⁂❧ *Grupo*:: \n> ${group.subject}\n⧼🏡⧽* ⁂❧ *Usuarios*::\n> ${group.participants.length} incluyéndote. \n⧼🦕 ⧽* ⁂❧ *Creación*::\n> ${creationDate}\n\n> *Disfruta tu estadia mientras estés en este grupo. (^ω^)*`;

        await conn.sendMessage(event.id, { text: texto, mentions: [user] });
    } catch (error) {
        console.error('Error al enviar la bienvenida:', error);
    }
};

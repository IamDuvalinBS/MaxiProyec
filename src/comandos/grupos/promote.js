export default {
    name: 'promote',
    description: 'Otorga el rol de administrador a un usuario mencionado o respondido',
    admin: true,
    run: async (m, { conn, text }) => {
        try {
            const user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
            if (!user) {
                return await conn.sendMessage(m.chat, { text: '⚠️ Debes mencionar o responder al mensaje del usuario que deseas promover.' }, { quoted: m });
            }
            await conn.groupParticipantsUpdate(m.chat, [user], 'promote');
            const userTag = user.split('@')[0];
            const senderTag = m.sender.split('@')[0];
            const texto = `⧼🚂⧽ \`\`\`##\`\`\` *NUEVO ADMIN*\n\n> Un nuevo administrador ha llegado a este grupo.\n\n⧼🎲⧽ *Nuevo admin*::\n> @${userTag}\n⧼🎯⧽ *Responsable*:: \n> @${senderTag} le otorgó admin.\n\n> Para remover esta acción usa *.demote* (admins).`;
            await conn.sendMessage(m.chat, { text: texto, mentions: [user, m.sender] }, { quoted: m });
        } catch (error) {
            console.error('Error al promover usuario:', error);
            await conn.sendMessage(m.chat, { text: '❌ Ocurrió un error al intentar promover al usuario.' }, { quoted: m });
        }
    }
};

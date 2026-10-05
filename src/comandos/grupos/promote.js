module.exports = {
    name: "promote",
    execute: async (bot, msg, args) => {
        if (!msg.key.remoteJid.endsWith('@g.us')) return;
        const user = msg.message.extendedTextMessage?.contextInfo?.participant || (args[0] ? args[0].replace('@', '') + '@s.whatsapp.net' : null);
        if (!user) return await bot.sendMessage(msg.key.remoteJid, { text: "Mencione a un usuario o responda a su mensaje." }, { quoted: msg });
        await bot.groupParticipantsUpdate(msg.key.remoteJid, [user], "promote");
        const adminUser = msg.key.participant || msg.key.remoteJid;
        const text = `⧼🚂⧽ \`\`\`##\`\`\` *NUEVO ADMIN*\n\n> Un nuevo administrador ha llegado a este grupo.\n\n⧼🎲⧽ *Nuevo admin*::\n> @${user.split('@')[0]}\n⧼🎯⧽ *Responsable*::\n> @${adminUser.split('@')[0]} le otorgó admin.\n\n> Para remover esta acción usa *.demote* (admins).`;
        await bot.sendMessage(msg.key.remoteJid, { text: text, mentions: [user, adminUser] }, { quoted: msg });
    },
    run: async function(bot, msg, args) { return this.execute(bot, msg, args); }
};

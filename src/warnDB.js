import { MongoClient } from 'mongodb';

// Configuración de la base de datos MongoDB
const uri = process.env.MONGODB_URI || "TU_URL_DE_MONGODB";
const client = new MongoClient(uri);

let db;
let warnsCollection;

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db("BotDB");
        warnsCollection = db.collection("warns");
    }
}

/**
 * Agrega una advertencia a un usuario en un grupo específico.
 * @param {string} userId - ID del usuario (JID de WhatsApp)
 * @param {string} groupId - ID del grupo (JID de WhatsApp)
 * @returns {Promise<number>} Número total acumulado de advertencias
 */
export const addWarn = async (userId, groupId) => {
    await connectDB();
    await warnsCollection.updateOne(
        { userId, groupId },
        { $inc: { count: 1 } },
        { upsert: true }
    );
    const user = await warnsCollection.findOne({ userId, groupId });
    return user ? user.count : 1;
};

/**
 * Limpia/elimina todas las advertencias de un usuario en un grupo.
 * @param {string} userId - ID del usuario
 * @param {string} groupId - ID del grupo
 */
export const clearWarns = async (userId, groupId) => {
    await connectDB();
    await warnsCollection.deleteOne({ userId, groupId });
};

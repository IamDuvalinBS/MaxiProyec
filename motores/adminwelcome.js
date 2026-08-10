import { getProfile, config } from "./db.js";

// Numeros/nombres de los admins principales a los que hay que avisar - editalo aca
const ADMINS_PRINCIPALES = "🏆*IamDuvalin* 2️⃣*IamCris* 3️⃣";

function construirMensaje({ target, autor, sock }) {
  const perfil = getProfile(target);
  const nombre = perfil.name || "No establecido";
  const numero = target.split("@")[0];

  return {
    text: `🧸\`FELICIDADES ADMIN\`🏆

🦆 *REGLAS ADMIN::*🌱

- Avisar todo a los principales admins: ${ADMINS_PRINCIPALES}

- No dar admin sin antes haber avisado a los admins principales. *(Regla n° 1)*


> 🌱 -Son reglas básicas. Se pide respetarlas sin abusar del admin..

🪺 \`REQUISITOS::\` 


- Compartir el grupo para atraer más gente. 
> *🧸 Avisen que es un grupo para usar el bot y socializar.*

🎊\`PERFIL ADMIN\`🎁

> *Próximamente estará disponible un alojamiento (página) para cada perfíl de admin.*

🧩NOMBRE:: *${nombre}*
🏷️EDAD USER:: *?*
🌎PAÍS USER:: *No establecido*
NÚMERO:: ${numero}
🌱RANGO:: *Usuario - admin*
👑 Admin otorgado por:: @${autor.split("@")[0]}

🤖 \`BOTSITOS\` ‼️

> 🤖 Powered By • *${config.ownerName}* con *${config.botNameLong}*

> 🤖 Assisted By • *${config.botNameShort}*`,
    mentions: [autor]
  };
}

// Se llama desde index.js cada vez que cambian los participantes de un grupo.
export async function manejarCambioParticipantes(sock, update) {
  if (update.action !== "promote") return;
  const autor = update.author;
  if (!autor) return;

  for (const target of update.participants) {
    try {
      await sock.sendMessage(target, construirMensaje({ target, autor, sock }));
    } catch (e) {
      console.log(`No se pudo avisar a ${target} de su ascenso a admin: ${e.message}`);
    }
  }
}

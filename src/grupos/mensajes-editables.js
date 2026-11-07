import { comandoGrupo, textoTrasComando } from "./nucleo.js";
import { ajustesDe, definirAjusteMongo, quitarAjustesMongo } from "./estado.js";
import { tarjetaMarcada, mencion } from "../economia/estilo.js";
import { LIMITE_PLANTILLA, revisarBroches, textoBroches } from "./plantillas.js";

const AVISO_SIN_MONGO = "⚠️ Se guardó en el bot, pero MongoDB no respondió: se sincronizará cuando vuelva la conexión.";

// Crea .setwelcome y .setgoodbye: mismo comportamiento, distinta clave guardada.
export function crearComandoMensaje({ names, uso, desc, emoji, titulo, tituloGuardado, clave, clavesViejas = [], ejemplo, comandoPrueba, comandoInterruptor, nombreMensaje }) {
  return {
    names,
    usage: uso,
    desc,
    category: "Grupos",
    handler: comandoGrupo({ emoji, titulo }, async ({ from, sender, cleanText, responder, avisar }) => {
      const nuevo = textoTrasComando(cleanText);
      const actual = ajustesDe(from)[clave];

      if (!nuevo) {
        return responder(
          tarjetaMarcada({
            emoji,
            titulo,
            relato: actual ? "Este es el mensaje que está guardado ahora:" : `Ahora mismo se usa el ${nombreMensaje} predeterminado.`,
            lineas: [
              ...(actual ? [actual, ""] : []),
              "*Broches disponibles* (usa solo los que quieras):",
              textoBroches(),
              "",
              "*Ejemplo:*",
              ejemplo
            ],
            tip: [`Escribe *${names[0]} <mensaje>* para guardarlo.`, `Usa *${names[0]} reset* para volver al predeterminado.`]
          })
        );
      }

      if (nuevo.toLowerCase() === "reset") {
        const guardado = await quitarAjustesMongo(from, [clave, ...clavesViejas]);
        return avisar(`Se restableció el ${nombreMensaje} predeterminado.${guardado ? "" : `\n\n${AVISO_SIN_MONGO}`}`);
      }

      if (nuevo.length > LIMITE_PLANTILLA) {
        return avisar(`El mensaje supera el máximo permitido. Tiene ${nuevo.length} de ${LIMITE_PLANTILLA} caracteres.`);
      }

      const { usados, desconocidos } = revisarBroches(nuevo);
      // Si el grupo tenía la frase vieja (solo cambiaba una línea de la tarjeta), se retira: ahora manda el mensaje completo.
      if (clavesViejas.some((vieja) => ajustesDe(from)[vieja] !== undefined)) await quitarAjustesMongo(from, clavesViejas);
      const enMongo = await definirAjusteMongo(from, clave, nuevo);

      const lineas = [
        "⧼🎯⧽ *Responsable*::",
        `> ${mencion(sender)} actualizó el mensaje.`,
        "⧼🧷⧽ *Broches usados*::",
        `> ${usados.length ? usados.map((c) => `{${c}}`).join(" ") : "ninguno (texto fijo)"}`
      ];
      if (desconocidos.length) {
        lineas.push("⧼⚠️⧽ *Broches no reconocidos*::", `> ${desconocidos.join(" ")} (se enviarán tal cual)`);
      }
      if (!enMongo) lineas.push("", AVISO_SIN_MONGO);

      await responder(
        tarjetaMarcada({
          emoji,
          titulo: tituloGuardado,
          relato: "Mensaje guardado. Así quedó escrito:",
          lineas: [nuevo, "", ...lineas],
          tip: [`Para probarlo usa *${comandoPrueba}* (admins).`, `Para restablecerlo usa *${names[0]} reset* (admins).`, `Recuerda activarlo con *${comandoInterruptor} on*.`]
        }),
        [sender]
      );
    })
  };
}

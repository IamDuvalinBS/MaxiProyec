import { comandoGrupo, numeroDe } from "../../grupos/nucleo.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";
import { listarAdvertencias } from "../../../motores/advertencias.js";
import { LIMITE_ADVERTENCIAS } from "./warn.js";

const MAXIMO_EN_LISTA = 40;

export default {
  names: [".warnlist", ".listawarns"],
  usage: ".warnlist",
  desc: "Ver la lista de usuarios advertidos del grupo",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "📋", titulo: "WARNLIST", admin: false }, async (ctx) => {
    const { from, meta, responder, avisar } = ctx;

    let lista;
    try {
      lista = await listarAdvertencias(from);
    } catch (e) {
      console.log(`Error al leer la lista de advertencias en ${from}: ${e.message}`);
      return avisar("No fue posible consultar la lista. Intenta nuevamente.");
    }
    if (lista === null) return avisar("La base de datos no está disponible en este momento.");
    if (!lista.length) return avisar("Nadie tiene advertencias en este grupo.");

    const mostrados = lista.slice(0, MAXIMO_EN_LISTA);
    const menciones = [];
    const lineas = mostrados.map(({ usuario, total }) => {
      // La base guarda solo el número; se busca al participante para mencionarlo bien
      const p = meta.participantes.find((x) => x.ids.some((id) => numeroDe(id) === usuario));
      const jid = p ? p.id : `${usuario}@s.whatsapp.net`;
      menciones.push(jid);
      return `> ${mencion(jid)} ${Math.min(total, LIMITE_ADVERTENCIAS)}/${LIMITE_ADVERTENCIAS}`;
    });
    if (lista.length > mostrados.length) lineas.push(`> ...y ${lista.length - mostrados.length} más`);

    const texto = tarjetaMarcada({
      emoji: "📋",
      titulo: "USUARIOS ADVERTIDOS",
      lineas,
      tip: "Usa *.warn* para advertir o *.unwarn* para retirar (admins)."
    });
    await responder(texto, menciones);
  })
};

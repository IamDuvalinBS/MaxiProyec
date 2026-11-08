import { comandoGrupo } from "../../grupos/nucleo.js";
import { prefijosDeGrupo, definirPrefijosDeGrupo } from "../../grupos/estado.js";
import { config } from "../../../motores/db.js";
import { tarjetaMarcada, mencion } from "../../economia/estilo.js";

const VALIDO = /^[^\s\p{L}\p{N}@]{1,3}$/u;
const MAXIMO = 10;

const globales = () => (config.prefixes && config.prefixes.length ? config.prefixes : [config.prefix || "."]);
const lista = (prefijos) => prefijos.map((p) => `*${p}*`).join("  ");

export default {
  names: [".gprefix", ".setgprefix", ".addgprefix", ".delgprefix", ".resetgprefix"],
  usage: ".gprefix | .setgprefix <p> [p2 p3] | .addgprefix <p> | .delgprefix <p> | .resetgprefix",
  desc: "Prefijos propios del grupo: uno solo o varios (admins)",
  category: "Grupos",
  handler: comandoGrupo({ emoji: "🔧", titulo: "PREFIJOS" }, async ({ from, sender, cleanText, responder, avisar }) => {
    const [comando, ...valores] = cleanText.trim().split(/\s+/);
    const accion = comando.toLowerCase();
    const propios = prefijosDeGrupo(from);

    if (accion === ".gprefix" || (accion !== ".resetgprefix" && !valores.length)) {
      return avisar(
        `Prefijos en este grupo: ${lista(propios || globales())}${propios ? "" : " (los generales del bot)"}\n\n` +
          "> *.setgprefix ! #*  → deja solo esos\n> *.addgprefix $*  → agrega uno\n> *.delgprefix #*  → quita uno\n> *.resetgprefix*  → vuelve a los generales"
      );
    }

    if (accion === ".resetgprefix") {
      if (!propios) return avisar("Este grupo ya usa los prefijos generales del bot.");
      definirPrefijosDeGrupo(from, null);
      return responder(
        tarjetaMarcada({
          emoji: "🔧",
          titulo: "PREFIJOS RESTABLECIDOS",
          relato: `Ahora el grupo usa los prefijos generales: ${lista(globales())}`,
          lineas: ["⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`]
        }),
        [sender]
      );
    }

    const invalido = valores.find((v) => !VALIDO.test(v));
    if (invalido) return avisar(`*${invalido}* no es válido. Debe tener de 1 a 3 caracteres, sin letras, números, espacios ni @.`);

    let nuevos;
    if (accion === ".setgprefix") {
      nuevos = [...new Set(valores)];
    } else if (accion === ".addgprefix") {
      const base = propios || globales();
      nuevos = [...new Set([...base, ...valores])];
      if (nuevos.length === base.length) return avisar("Esos prefijos ya están activos.");
    } else {
      if (!propios) return avisar("Este grupo usa los generales del bot. Primero define los tuyos con *.setgprefix*.");
      nuevos = propios.filter((p) => !valores.includes(p));
      if (nuevos.length === propios.length) return avisar("Ninguno de esos prefijos está activo en este grupo.");
    }
    if (nuevos.length > MAXIMO) return avisar(`El máximo es ${MAXIMO} prefijos por grupo.`);

    definirPrefijosDeGrupo(from, nuevos);
    const texto = nuevos.length
      ? tarjetaMarcada({
          emoji: "🔧",
          titulo: "PREFIJOS ACTUALIZADOS",
          relato: `Los comandos de este grupo ahora se usan con: ${lista(nuevos)}`,
          lineas: ["⧼🫯⧽ *Responsable*::", `> ${mencion(sender)} hizo esta acción.`],
          tip: "Si lo olvidas, *.gprefix* siempre funciona con un prefijo general."
        })
      : tarjetaMarcada({
          emoji: "🔧",
          titulo: "PREFIJOS RESTABLECIDOS",
          relato: `Quitaste todos los propios, así que vuelven los generales: ${lista(globales())}`
        });
    await responder(texto, [sender]);
  })
};

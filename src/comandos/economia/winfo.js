import { getAccount } from "../../../motores/db.js";
import { trabajosRegistrados } from "../../economia/trabajos.js";
import { fmt, jidObjetivo } from "../../economia/formato.js";
import { encabezado, mencion, tiempoLargo } from "../../economia/estilo.js";

const HORA_MS = 60 * 60 * 1000;

const COMANDOS_BASE = [
  { nombre: "Daily", clave: "daily", ms: 24 * HORA_MS },
  { nombre: "Semanal", clave: "semanal", ms: 7 * 24 * HORA_MS },
  { nombre: "Cofre", clave: "cofre", ms: 24 * HORA_MS },
  { nombre: "Trivia", clave: "trivia", ms: 30 * 60 * 1000 }
];

function nombreDe(trabajo) {
  const base = trabajo.names[0].slice(1);
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function listaDeComandos() {
  const lista = [...COMANDOS_BASE];
  for (const trabajo of trabajosRegistrados.values()) {
    lista.push({ nombre: nombreDe(trabajo), clave: trabajo.clave, ms: trabajo.cooldownMs });
  }
  return lista;
}

export default {
  names: [".winfo", ".cooldowns", ".esperas"],
  usage: ".winfo | .winfo @usuario",
  desc: "Ver el tiempo de espera de todos los comandos de economía",
  category: "Economía",
  handler: async ({ sender, msg, reply }) => {
    const objetivo = jidObjetivo(msg) || sender;
    const cuenta = getAccount(objetivo);
    const ahora = Date.now();
    const partes = [
      encabezado("⏳", "Cooldown de Economía"),
      "",
      `> El tiempo de recarga que falta para utilizar cada comando de economía. ${mencion(objetivo)}`,
      ""
    ];

    for (const comando of listaDeComandos()) {
      const restante = (cuenta.cooldowns[comando.clave] || 0) + comando.ms - ahora;
      partes.push(`ⴵ ${comando.nombre} » `);
      partes.push(restante > 0 ? `> *En cooldown, ${tiempoLargo(restante)}.*` : "> *Puedes usarlo*");
    }

    partes.push("", `> ⛁ ¥enes » ${fmt(cuenta.wallet)}`, "> Usa .allw para reclamar todos los comandos de economía.");

    await reply({ text: partes.join("\n"), mentions: [objetivo] });
  }
};

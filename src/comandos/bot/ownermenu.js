import { commandRegistry } from "../../../core.js";
import { ajusteBot, fotoBot } from "../../../motores/ajustes-bot.js";
import { enviarConBoton } from "../../../motores/botones.js";
import { isOwner, isDueno } from "../../../motores/owner.js";
import { etiquetaDe, resumirDesc } from "../../nucleo/menu-texto.js";

// ════════════════════════════════════════════════════════════════════════════
//  PERMISOS POR COMANDO — aquí eliges qué archivo es de quién.
//  Solo escribe la ruta del archivo del comando (con o sin ".js"):
//      "src/comandos/economia/addcoin"
//  También sirve una carpeta entera (termina en "/"):  "src/comandos/economia/"
//  Un archivo con varios nombres (ej. .banear / .desbanear / .baneos) se controla completo.
//
//  • COMANDOS_DUENOS  → solo los DUENOS (ver motores/owner.js) pueden usarlos. Salen en .menudueno
//  • COMANDOS_OWNERS  → owners y dueños pueden usarlos. Salen en .ownermenu
//  • COMANDOS_NADIE   → desactivados para ABSOLUTAMENTE todos (ni dueños ni owners)
//
//  Un archivo debe estar en UNA sola lista (si está en varias, gana la más estricta: NADIE > DUEÑOS > OWNERS).
//  Los comandos que NO están en ninguna lista siguen funcionando como siempre.
//
//  Para elegir quién puede usar .banear, pon su ruta en la lista que quieras:
//      "src/comandos/bot/banear"
// ════════════════════════════════════════════════════════════════════════════
export const COMANDOS_DUENOS = [
  // "src/comandos/economia/addcoin",
];

export const COMANDOS_OWNERS = [
  // "src/comandos/bot/banear",
  "src/comandos/bot/stickerreact",
];

export const COMANDOS_NADIE = [
  // "src/comandos/bot/banear",
];

// ───────────────────────── a partir de aquí no hace falta tocar nada ─────────────────────────
const normalizarRuta = (ruta) =>
  String(ruta || "").trim().toLowerCase().replace(/\\/g, "/").replace(/^\.?\/+/, "").replace(/\.js$/, "");

function estaEn(lista, archivo) {
  const ruta = normalizarRuta(archivo);
  if (!ruta) return false;
  const nombre = ruta.split("/").pop();
  return lista.some((entrada) => {
    const e = normalizarRuta(entrada);
    if (!e) return false;
    if (e.endsWith("/")) return ruta.startsWith(e);
    return e.includes("/") ? e === ruta : e === nombre;
  });
}

// "nadie" | "dueno" | "owner" | null (null = sin restricción por lista)
export function permisoDeArchivo(archivo) {
  if (estaEn(COMANDOS_NADIE, archivo)) return "nadie";
  if (estaEn(COMANDOS_DUENOS, archivo)) return "dueno";
  if (estaEn(COMANDOS_OWNERS, archivo)) return "owner";
  return null;
}

// En qué menú sale cada comando: lo que diga la lista; si no está en ninguna, los de categoría Owner/Subbots van al menú de owners.
function nivelParaMenu(info) {
  const permiso = permisoDeArchivo(info.archivo);
  if (permiso) return permiso === "nadie" ? null : permiso;
  return ["Owner", "Subbots"].includes(info.category) ? "owner" : null;
}

function comandosDeNivel(nivel, excluir) {
  const vistos = new Set();
  const lista = [];
  for (const info of commandRegistry.values()) {
    if (vistos.has(info) || info.names.some((n) => excluir.includes(n))) continue;
    vistos.add(info);
    if (nivelParaMenu(info) === nivel) lista.push(info);
  }
  return lista.sort((a, b) => a.names[0].localeCompare(b.names[0]));
}

async function enviarMenu({ sock, from, sender, msg }, { titulo, cabecera, nivel, excluir, vacio, pie }) {
  const bloques = comandosDeNivel(nivel, excluir).map((info) => `✿ *${etiquetaDe(info)}*\n> ${resumirDesc(info.desc)}`);
  const usuario = `@${sender.split("@")[0]}`;
  const texto =
    `✿ *${titulo}* — 『 *${ajusteBot("botNameLong")}* 』\n\n` +
    `> Hola ${usuario}, este menú solo es visible para ti.\n\n` +
    `${cabecera}\n\n${bloques.length ? bloques.join("\n\n") : vacio}` +
    (pie ? `\n\n> ${pie}` : "");

  const enviado = await enviarConBoton({
    sock,
    from,
    msg,
    texto,
    footer: ajusteBot("botNameShort"),
    foto: fotoBot(),
    boton: null,
    mentions: [sender]
  });
  if (!enviado) await sock.sendMessage(from, { text: texto, mentions: [sender] }, { quoted: msg });
}

export default [
  {
    names: [".ownermenu", ".menuowner", ".menuowners"],
    usage: ".ownermenu",
    desc: "Ver los comandos exclusivos de owners",
    category: "Owner",
    handler: async (ctx) => {
      if (!isOwner(ctx.sender)) return;
      return enviarMenu(ctx, {
        titulo: "Panel exclusivo de owners",
        cabecera: "👑 ⧼⧼ OWNERS ⧽⧽",
        nivel: "owner",
        excluir: [".ownermenu", ".menudueno"],
        vacio: "> Todavía no hay comandos asignados a owners."
      });
    }
  },
  {
    names: [".menudueno", ".menudueño", ".menuduenos", ".menudueños", ".duenomenu"],
    usage: ".menudueno",
    desc: "Ver los comandos exclusivos de dueños",
    category: "Owner",
    handler: async (ctx) => {
      if (!isDueno(ctx.sender)) return;
      return enviarMenu(ctx, {
        titulo: "Panel exclusivo de dueños",
        cabecera: "💎 ⧼⧼ DUEÑOS ⧽⧽",
        nivel: "dueno",
        excluir: [".menudueno"],
        vacio: "> Todavía no hay comandos asignados a dueños. Agrégalos en COMANDOS_DUENOS (src/comandos/bot/ownermenu.js).",
        pie: "Además puedes usar todos los comandos de owners: *.ownermenu*"
      });
    }
  }
];

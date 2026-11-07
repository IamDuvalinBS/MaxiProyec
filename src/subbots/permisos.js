import { isOwner } from "../../motores/owner.js";
import { PRINCIPAL } from "../../motores/ajustes-bot.js";
import { numeroSubbot, subDeUsuario } from "./gestor.js";

// Quién puede personalizar el bot y sobre CUÁL bot actúa:
//  • Owner: sobre el bot donde ejecuta el comando (el principal o el subbot en el que esté).
//  • Dueño de un subbot (quien lo vinculó, o la propia cuenta del subbot): sobre su propio subbot,
//    aunque ejecute el comando desde otro bot.
// Devuelve { ok, botId, esPrincipal, via } ("via": "owner" | "dueno" | "sub").
export async function objetivoBot({ sock, sender, msg }) {
  const propioDelSock = numeroSubbot(sock);
  if (isOwner(sender)) return { ok: true, botId: propioDelSock || PRINCIPAL, esPrincipal: !propioDelSock, via: "owner" };
  if (propioDelSock && msg?.key?.fromMe) return { ok: true, botId: propioDelSock, esPrincipal: false, via: "dueno" };
  const suyo = await subDeUsuario(sender);
  if (suyo) return { ok: true, botId: suyo, esPrincipal: false, via: "sub" };
  return { ok: false };
}

export const MENSAJE_SIN_PERMISO =
  "🚫 Este comando es solo para owners y para usuarios que tengan un subbot vinculado en su cuenta.\n\n> Si quieres tener el tuyo, usa *.code*.";

// Envuelve un handler: solo owners y dueños de subbot. El handler recibe además `objetivo` (ver objetivoBot).
export function comandoDeBot(handler) {
  return async (ctx) => {
    const objetivo = await objetivoBot(ctx);
    if (!objetivo.ok) return ctx.reply({ text: MENSAJE_SIN_PERMISO });
    return handler({ ...ctx, objetivo });
  };
}

// Texto que indica sobre qué bot se aplicó el cambio.
export function nombreDelObjetivo(objetivo) {
  return objetivo.esPrincipal ? "el bot principal" : `el subbot ${objetivo.botId}`;
}

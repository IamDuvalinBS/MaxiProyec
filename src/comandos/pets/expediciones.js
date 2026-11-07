import { getAccount, addToWallet } from "../../../motores/db.js";
import { tarjeta, monto } from "../../economia/formato-evento.js";
import { getProfile } from "../../../motores/profile.js";
import { cargarMascotas, guardarMascotas } from "../../../motores/mascotas-core.js";
import { obtenerClimaZonas } from "../../../motores/mascotas-clima.js";
import { htmlZonas } from "../../../motores/mascotas-html.js";
import { ESPECIES, RAREZAS } from "../../../motores/mascotas-datos.js";
import { ZONAS, ITEMS, ORDEN_RAREZA, MAX_MINUTOS_EXPEDICION, buscarZona, buscarItem } from "../../../motores/mascotas-zonas.js";
import { mascotaPorNumero, nivelDe, explorando } from "../../../motores/mascotas-logica.js";
import { iniciarExpedicion, reclamarExpedicion, parsearTiempo, textoDuracion, vender, venderTodo } from "../../../motores/mascotas-expedicion.js";

const FIRMA = "Powered By ItsDuva";
const TIEMPO_CON_UNIDAD = /^\d+([.,]\d+)?(m|min|mins|h|hr|hrs)$/i;
const NUMERO = /^#?\d+$/;

const lineaItem = (id, n) => `${ITEMS[id].emoji} *${ITEMS[id].nombre}* ×${n} — ${monto(ITEMS[id].precio * n)}`;
const porRareza = ([a], [b]) => ORDEN_RAREZA.indexOf(ITEMS[b].rareza) - ORDEN_RAREZA.indexOf(ITEMS[a].rareza) || ITEMS[a].nombre.localeCompare(ITEMS[b].nombre);

function leerArgumentos(tokens) {
  const conUnidad = tokens.find((t) => TIEMPO_CON_UNIDAD.test(t));
  const numeros = tokens.filter((t) => NUMERO.test(t));
  const aNumero = (t) => parseInt(t.replace("#", ""), 10);
  let minutos = null;
  let numero = null;
  if (conUnidad) {
    minutos = parsearTiempo(conUnidad);
    if (numeros.length) numero = aNumero(numeros[numeros.length - 1]);
  } else if (numeros.length >= 2) {
    minutos = parsearTiempo(numeros[0].replace("#", ""));
    numero = aNumero(numeros[1]);
  } else if (numeros.length === 1) {
    numero = aNumero(numeros[0]);
  }
  const texto = tokens.filter((t) => !NUMERO.test(t) && !TIEMPO_CON_UNIDAD.test(t)).join(" ");
  return { minutos, numero, texto };
}

export default [
  {
    names: [".petzonas", ".petmapa"],
    usage: ".petzonas",
    desc: "Muestra las 6 zonas de exploración con su clima real en vivo",
    category: "Pets",
    handler: async ({ sock, from, sender, msg, reply }) => {
      const { est, ahora } = await cargarMascotas(sender);
      const climaZonas = await obtenerClimaZonas(ZONAS);
      if (typeof sock.sendHtml !== "function") {
        const lineas = Object.values(ZONAS).map((z) => `${z.emoji} *${z.nombre}* — nivel ${z.nivel} · desde ${z.minutos} min\n     📍 ${z.lugar}`);
        return reply({ text: tarjeta({ emoji: "🗺️", titulo: "ZONAS DE EXPLORACIÓN", lineas, tip: "Usa *.petinvestigar <zona> [tiempo] [mascota]*." }) });
      }
      try {
        const html = htmlZonas({ nombre: msg?.pushName || getProfile(sender)?.name || "Entrenador", est, ahora, climaZonas, firma: FIRMA });
        await sock.sendHtml(from, html, [], msg, {});
      } catch (e) {
        console.log("[petzonas] ERROR: " + (e.stack || e.message));
        await reply({ text: "❌ No pude mostrar las zonas en este momento." });
      }
    }
  },
  {
    names: [".petinvestigar", ".petexplorar", ".petexpedicion"],
    usage: ".petinvestigar <zona> [tiempo] [mascota]",
    desc: "Envía a una mascota a investigar una zona; mientras más tiempo busque, más ítems encontrará",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const tokens = cleanText.trim().split(/\s+/).slice(1);
      const { minutos, numero, texto } = leerArgumentos(tokens);
      const zona = buscarZona(texto);
      if (!zona) {
        return reply({
          text: tarjeta({
            emoji: "🔍",
            titulo: "INVESTIGAR UNA ZONA",
            lineas: Object.values(ZONAS).map((z) => `${z.emoji} *${z.nombre}* — nivel ${z.nivel} · desde ${z.minutos} min`),
            tip: ["Ejemplo: *.petinvestigar bosque 2h 1*", "El tiempo máximo es de 6 horas. Mira el clima de cada zona con *.petzonas*."]
          })
        });
      }
      const datos = await cargarMascotas(sender);
      const { cuenta, est, ahora } = datos;
      if (!est.mascotas.length) return reply({ text: "Aún no tienes mascotas. Compra una incubadora y un huevo con *.pettienda*." });
      const m = mascotaPorNumero(est, numero);
      if (!m) {
        return reply({ text: numero ? `No tienes una mascota con el número *${numero}*.` : "Tienes varias mascotas. Indica cuál investigará, por ejemplo: *.petinvestigar bosque 30m 2*." });
      }
      const duracion = minutos ?? zona.minutos;
      const r = iniciarExpedicion(m, zona, duracion, ahora);
      if (!r.ok) return reply({ text: `⚠️ ${r.error}` });
      guardarMascotas(sender, cuenta, est);
      const climaZonas = await obtenerClimaZonas(ZONAS);
      const c = climaZonas[zona.id];
      await reply({
        text: tarjeta({
          emoji: zona.emoji,
          titulo: "EXPEDICIÓN INICIADA",
          relato: `${m.nombre} salió a investigar *${zona.nombre}*.`,
          lineas: [
            `📍 *LUGAR::* ${zona.lugar}`,
            `⏱️ *TIEMPO::* ${textoDuracion(duracion)}`,
            ...(c?.disponible ? [`🌡️ *CLIMA AHORA::* ${c.tipo}${c.temperatura !== null ? `, ${Math.round(c.temperatura)}°C` : ""}`] : [])
          ],
          tip: ["Míralo buscando en la zona con *.mispets*.", "Cuando termine, usa *.petreclamar*. Mientras tanto no podrá jugar, comer ni dormir."]
        })
      });
    }
  },
  {
    names: [".petreclamar", ".petclaim"],
    usage: ".petreclamar [mascota]",
    desc: "Recibe los ítems que encontraron tus mascotas al terminar su expedición",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const { cuenta, est, ahora } = await cargarMascotas(sender);
      const numero = parseInt(cleanText.trim().split(/\s+/)[1], 10) || null;
      let candidatas = est.mascotas.filter((m) => m.expedicion);
      if (numero) {
        const m = mascotaPorNumero(est, numero);
        if (!m) return reply({ text: `No tienes una mascota con el número *${numero}*.` });
        candidatas = [m];
      }
      if (!candidatas.length) return reply({ text: "Ninguna de tus mascotas está en una expedición. Envía una con *.petinvestigar*." });
      const listas = candidatas.filter((m) => !explorando(m, ahora));
      if (!listas.length) {
        const m = candidatas[0];
        return reply({ text: `⏳ ${m.nombre} sigue investigando. Volverá en *${textoDuracion(Math.ceil((m.expedicion.fin - ahora) / 60000))}*.` });
      }
      const climaZonas = await obtenerClimaZonas(ZONAS);
      for (const m of listas) {
        const r = reclamarExpedicion(est, m, ahora, climaZonas[m.expedicion.zona]);
        const lineas = Object.entries(r.botin).sort(porRareza).map(([id, n]) => lineaItem(id, n));
        lineas.push("", `💰 *VALOR TOTAL::* ${monto(r.valor)}`, `✨ *EXPERIENCIA::* +${r.xp}`);
        if (r.nivelDespues > r.nivelAntes) lineas.push(`⬆️ *NIVEL::* ${r.nivelAntes} → ${r.nivelDespues}`);
        await reply({
          text: tarjeta({
            emoji: r.zona.emoji,
            titulo: `${m.nombre.toUpperCase()} VOLVIÓ`,
            relato: `Después de ${textoDuracion(r.minutos)} en *${r.zona.nombre}*, encontró ${r.tiradas} hallazgo${r.tiradas > 1 ? "s" : ""}.`,
            lineas,
            tip: "Véndelos con *.petvender* o revísalos con *.petmochila*."
          })
        });
      }
      guardarMascotas(sender, cuenta, est);
    }
  },
  {
    names: [".petmochila", ".petitems"],
    usage: ".petmochila",
    desc: "Muestra los ítems que han encontrado tus mascotas y cuánto valen",
    category: "Pets",
    handler: async ({ sender, reply }) => {
      const { est } = await cargarMascotas(sender);
      const entradas = Object.entries(est.items).sort(porRareza);
      if (!entradas.length) return reply({ text: "Tu mochila de hallazgos está vacía. Envía a una mascota con *.petinvestigar*." });
      const total = entradas.reduce((a, [id, n]) => a + ITEMS[id].precio * n, 0);
      const lineas = entradas.map(([id, n]) => `${RAREZAS[ITEMS[id].rareza].emoji} ${lineaItem(id, n)}`);
      lineas.push("", `💰 *VALOR TOTAL::* ${monto(total)}`);
      await reply({ text: tarjeta({ emoji: "🎒", titulo: "HALLAZGOS", lineas, tip: "Vende con *.petvender <ítem> [cantidad]* o *.petvender todo*." }) });
    }
  },
  {
    names: [".petvender", ".petsell"],
    usage: ".petvender <ítem> [cantidad|todo] | .petvender todo",
    desc: "Vende los ítems que encontraron tus mascotas para ganar ¥enes",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const tokens = cleanText.trim().split(/\s+/).slice(1);
      if (!tokens.length) return reply({ text: "Indica qué vender: *.petvender todo* o *.petvender rama seca 2*. Mira tus ítems con *.petmochila*." });
      const { cuenta, est } = await cargarMascotas(sender);
      if (!Object.keys(est.items).length) return reply({ text: "No tienes ítems para vender. Envía a una mascota con *.petinvestigar*." });

      if (["todo", "todos"].includes(tokens[0].toLowerCase()) && tokens.length === 1) {
        const r = venderTodo(est);
        addToWallet(sender, r.total);
        guardarMascotas(sender, cuenta, est);
        return reply({ text: tarjeta({ emoji: "💰", titulo: "VENTA REALIZADA", relato: `Vendiste *${r.cantidad}* ítems.`, lineas: [`💵 *GANANCIA::* +${monto(r.total)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`] }) });
      }

      let cantidad = null;
      const ultimo = tokens[tokens.length - 1].toLowerCase();
      if (tokens.length > 1 && (ultimo === "todo" || /^\d+$/.test(ultimo))) {
        cantidad = ultimo === "todo" ? "todo" : Math.max(1, parseInt(ultimo, 10));
        tokens.pop();
      }
      const { item, candidatos } = buscarItem(tokens.join(" "));
      let elegido = item;
      if (!elegido) {
        const tenidos = (candidatos || []).filter((i) => est.items[i.id] > 0);
        if (tenidos.length === 1) elegido = tenidos[0];
        else if (tenidos.length > 1) return reply({ text: `Hay varios ítems con ese nombre: ${tenidos.slice(0, 5).map((i) => `*${i.nombre}*`).join(", ")}. Sé más específico.` });
        else return reply({ text: "No reconozco ese ítem entre los que tienes. Mira tu lista con *.petmochila*." });
      }
      const r = vender(est, elegido.id, cantidad);
      if (!r.ok) return reply({ text: `⚠️ No tienes *${elegido.nombre}*.` });
      addToWallet(sender, r.total);
      guardarMascotas(sender, cuenta, est);
      await reply({
        text: tarjeta({
          emoji: "💰",
          titulo: "VENTA REALIZADA",
          relato: `Vendiste ${elegido.emoji} *${elegido.nombre}* ×${r.cantidad}.`,
          lineas: [`💵 *GANANCIA::* +${monto(r.total)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`]
        })
      });
    }
  }
];

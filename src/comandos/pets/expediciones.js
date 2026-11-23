import { getAccount, addToWallet } from "../../../motores/db.js";
import { tarjeta, monto } from "../../economia/formato-evento.js";
import { getProfile } from "../../../motores/profile.js";
import { cargarMascotas, guardarMascotas } from "../../../motores/mascotas-core.js";
import { obtenerClimaZonas } from "../../../motores/mascotas-clima.js";
import { htmlZonas, htmlArbol } from "../../../motores/mascotas-html.js";
import { ESPECIES, RAREZAS, HABILIDADES, NIVEL_HABILIDAD, ARBOL, FLAUTA, PERDIDA_HORAS, BONOS_NIVEL } from "../../../motores/mascotas-datos.js";
import { ZONAS, ITEMS, ORDEN_RAREZA, buscarZona, buscarItem } from "../../../motores/mascotas-zonas.js";
import { mascotaPorNumero, nivelDe, explorando, xpParaNivel } from "../../../motores/mascotas-logica.js";
import { iniciarExpedicion, reclamarExpedicion, devolverPerdida, probPerdida, mejorarArbol, parsearTiempo, textoDuracion, vender, venderTodo } from "../../../motores/mascotas-expedicion.js";

const FIRMA = "Powered By ItsDuva";
const TIEMPO_CON_UNIDAD = /^\d+([.,]\d+)?(m|min|mins|h|hr|hrs)$/i;
const NUMERO = /^#?\d+$/;

const lineaItem = (id, n) => `${ITEMS[id].emoji} *${ITEMS[id].nombre}* ×${n} — ${monto(ITEMS[id].precio * n)}`;
const RAMAS_PALABRAS = {
  bosque: ["despensa"],
  nieve: ["conservas", "conserva", "helada", "heladas"],
  lago: ["pesca", "pescado", "fresca"],
  encantado: ["hongos", "magicos", "magico"],
  volcan: ["brasas", "brasa", "eternas"],
  islas: ["ambrosia", "celestial", "celestiales"]
};

const sinTildes = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function buscarRama(texto) {
  const t = sinTildes(texto);
  for (const [id, claves] of Object.entries(RAMAS_PALABRAS)) {
    if (claves.some((c) => t.split(/\s+/).includes(c))) return id;
  }
  const zona = buscarZona(texto);
  return zona ? zona.id : null;
}

async function mostrarBotin(sender, reply, m, r, titulo, relato) {
  const lineas = Object.entries(r.botin).sort(porRareza).map(([id, n]) => lineaItem(id, n));
  lineas.push("", `💰 *VALOR TOTAL::* ${monto(r.valor)}`, `✨ *EXPERIENCIA::* +${r.xp}`);
  if (r.monedas > 0) {
    addToWallet(sender, r.monedas);
    lineas.push(`🪙 *BONO DE MONEDAS::* +${monto(r.monedas)} (${Math.round(r.porcentaje * 100)}%)`);
  }
  lineas.push(...r.notas);
  if (r.nivelDespues > r.nivelAntes) lineas.push(`⬆️ *NIVEL::* ${r.nivelAntes} → ${r.nivelDespues}`);
  await reply({ text: tarjeta({ emoji: r.zona.emoji, titulo, relato, lineas, tip: "Véndelos con *.petvender*, revísalos con *.petmochila* o guárdalos para mejorar el árbol de comida (*.petarbol*)." }) });
}

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
    usage: ".petinvestigar <zona> [tiempo]",
    desc: "Envía una mascota a investigar una zona",
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
            `🛡️ *PREPARACIÓN::* ${r.prep}`,
            `⚠️ *RIESGO DE PERDERSE::* ${Math.round(probPerdida(zona, m, duracion, r.prep, est) * 100)}%`,
            ...(c?.disponible ? [`🌡️ *CLIMA AHORA::* ${c.tipo}${c.temperatura !== null ? `, ${Math.round(c.temperatura)}°C` : ""}`] : [])
          ],
          tip: ["Míralo buscando en la zona con *.mispets*.", "Cuando termine, usa *.petreclamar*. Mientras tanto no podrá jugar, comer ni dormir.", "Alimentar antes de salir reduce el riesgo de perderse."]
        })
      });
    }
  },
  {
    names: [".petreclamar", ".petclaim"],
    usage: ".petreclamar [mascota]",
    desc: "Recibe los ítems de tus mascotas al terminar su expedición",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const { cuenta, est, ahora } = await cargarMascotas(sender);
      const numero = parseInt(cleanText.trim().split(/\s+/)[1], 10) || null;
      let candidatas = est.mascotas.filter((m) => m.expedicion || m.perdida);
      if (numero) {
        const m = mascotaPorNumero(est, numero);
        if (!m) return reply({ text: `No tienes una mascota con el número *${numero}*.` });
        candidatas = [m];
      }
      if (!candidatas.length) return reply({ text: "Ninguna de tus mascotas está en una expedición. Envía una con *.petinvestigar*." });
      const perdidas = candidatas.filter((m) => m.perdida);
      const listas = candidatas.filter((m) => m.expedicion && !explorando(m, ahora));
      if (!listas.length) {
        if (perdidas.length) return reply({ text: `🌫️ ${perdidas[0].nombre} se perdió en su expedición. Llámala con *.petllamar*.` });
        const m = candidatas[0];
        return reply({ text: `⏳ ${m.nombre} sigue investigando. Volverá en *${textoDuracion(Math.ceil((m.expedicion.fin - ahora) / 60000))}*.` });
      }
      const climaZonas = await obtenerClimaZonas(ZONAS);
      for (const m of listas) {
        const r = reclamarExpedicion(est, m, ahora, climaZonas[m.expedicion.zona]);
        if (r.perdida) {
          await reply({
            text: tarjeta({
              emoji: "🌫️",
              titulo: `${m.nombre.toUpperCase()} SE PERDIÓ`,
              relato: `En el camino de vuelta desde *${r.zona.nombre}*, ${m.nombre} se desorientó y no regresó.`,
              lineas: [`🎒 *LO QUE ENCONTRÓ::* lo traerá consigo al volver`, `⏳ *VOLVERÁ SOLA EN::* ${PERDIDA_HORAS} h`],
              tip: [`Llámala al instante con *.petllamar* (necesitas la ${FLAUTA.nombre.toLowerCase()}: *.petcomprar flauta*).`, "Alimentarla antes de salir y mejorar *Ambrosía celestial* en el árbol de comida reduce el riesgo."]
            })
          });
          continue;
        }
        await mostrarBotin(sender, reply, m, r, `${m.nombre.toUpperCase()} VOLVIÓ`, `Después de ${textoDuracion(r.minutos)} en *${r.zona.nombre}*, encontró ${r.tiradas} hallazgo${r.tiradas > 1 ? "s" : ""}.`);
      }
      guardarMascotas(sender, cuenta, est);
    }
  },
  {
    names: [".petllamar", ".petflauta"],
    usage: ".petllamar [mascota]",
    desc: "Llama con la flauta a una mascota perdida en una expedición",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const { cuenta, est, ahora } = await cargarMascotas(sender);
      const numero = parseInt(cleanText.trim().split(/\s+/)[1], 10) || null;
      let perdidas = est.mascotas.filter((m) => m.perdida);
      if (numero) {
        const m = mascotaPorNumero(est, numero);
        if (!m) return reply({ text: `No tienes una mascota con el número *${numero}*.` });
        perdidas = m.perdida ? [m] : [];
      }
      if (!perdidas.length) return reply({ text: "Ninguna de tus mascotas está perdida." });
      let cambios = false;
      for (const m of perdidas) {
        const r = devolverPerdida(est, m, ahora);
        if (!r.ok) {
          await reply({
            text: tarjeta({
              emoji: "🌫️",
              titulo: "AÚN NO REGRESA",
              relato: `${m.nombre} sigue perdida. Volverá sola en *${textoDuracion(Math.ceil(r.espera / 60000))}*.`,
              tip: `Con la ${FLAUTA.nombre.toLowerCase()} podrías llamarla al instante: *.petcomprar flauta*.`
            })
          });
          continue;
        }
        cambios = true;
        await mostrarBotin(sender, reply, m, r, `${m.nombre.toUpperCase()} REGRESÓ`, r.conFlauta ? `${FLAUTA.emoji} La flauta mágica sonó y ${m.nombre} corrió de vuelta, cansado y sucio, pero con todo lo que encontró.` : `${m.nombre} encontró el camino de vuelta por sí sola, cansada y sucia, con todo lo que encontró.`);
      }
      if (cambios) guardarMascotas(sender, cuenta, est);
    }
  },
  {
    names: [".petniveles", ".petnivel"],
    usage: ".petniveles",
    desc: "Bonos y habilidades por nivel de tus mascotas",
    category: "Pets",
    handler: async ({ sender, reply }) => {
      const { est } = await cargarMascotas(sender);
      const habilidades = Object.entries(HABILIDADES).map(([id, h]) => `${ESPECIES[id].emoji} *${h.nombre}* — ${h.texto}`);
      const tuyas = est.mascotas.map((m, i) => {
        const nv = nivelDe(m);
        return `*${i + 1}.* ${ESPECIES[m.especie].emoji} *${m.nombre}* — Nv ${nv} (faltan ${Math.max(0, xpParaNivel(nv + 1) - Math.floor(m.crec + m.xp))} XP para el ${nv + 1})`;
      });
      await reply({
        text: tarjeta({
          emoji: "🎚️",
          titulo: "NIVELES Y HABILIDADES",
          lineas: [...BONOS_NIVEL.map((b) => b.texto), "", `*HABILIDADES (nivel ${NIVEL_HABILIDAD}+)*`, ...habilidades, ...(tuyas.length ? ["", "*TUS MASCOTAS*", ...tuyas] : [])],
          tip: "El nivel sube cuidando a tu mascota (comida, juego, sueño y limpieza) y con las expediciones."
        })
      });
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
    usage: ".petvender <ítem | todo>",
    desc: "Vende los ítems que encontraron tus mascotas",
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
        return reply({ text: tarjeta({ emoji: "💰", titulo: "VENTA REALIZADA", relato: `Vendiste *${r.cantidad}* ítems.`, lineas: [`💵 *GANANCIA::* +${monto(r.total)}`] }) });
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
          lineas: [`💵 *GANANCIA::* +${monto(r.total)}`]
        })
      });
    }
  },
  {
    names: [".petarbol", ".petcomida"],
    usage: ".petarbol",
    desc: "Muestra el árbol de comida: sus mejoras y los materiales que necesitas",
    category: "Pets",
    handler: async ({ sock, from, sender, msg, reply }) => {
      const { est } = await cargarMascotas(sender);
      const textoArbol = () => tarjeta({
        emoji: "🌳",
        titulo: "ÁRBOL DE COMIDA",
        lineas: Object.entries(ARBOL).map(([id, r]) => {
          const n = est.arbol[id];
          return `${r.emoji} *${r.nombre}* — nivel ${n}/3\n     ${n ? r.formato(r.valores[n - 1]) : r.efecto}`;
        }),
        tip: "Mejora una rama con *.petarbolmejorar <rama>*. Los materiales salen de las expediciones."
      });
      if (typeof sock.sendHtml !== "function") return reply({ text: textoArbol() });
      try {
        const html = htmlArbol({ nombre: msg?.pushName || getProfile(sender)?.name || "Entrenador", est, firma: FIRMA });
        await sock.sendHtml(from, html, [], msg, {});
      } catch (e) {
        console.log("[petarbol] ERROR: " + (e.stack || e.message));
        await reply({ text: textoArbol() });
      }
    }
  },
  {
    names: [".petarbolmejorar", ".petcocinar"],
    usage: ".petarbolmejorar <rama>",
    desc: "Mejora el árbol de comida con materiales y ¥enes",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const texto = cleanText.trim().split(/\s+/).slice(1).join(" ");
      const rama = buscarRama(texto);
      if (!rama) {
        return reply({
          text: tarjeta({
            emoji: "🌳",
            titulo: "MEJORAR EL ÁRBOL",
            lineas: Object.entries(ARBOL).map(([id, r]) => `${r.emoji} *${r.nombre}* → *.petarbolmejorar ${id === "nieve" ? "nieve" : id}*`),
            tip: "Mira los costos con *.petarbol*."
          })
        });
      }
      const { cuenta, est } = await cargarMascotas(sender);
      const r = mejorarArbol(est, rama, cuenta.wallet);
      if (!r.ok) {
        if (r.falta) return reply({ text: `⚠️ Fondos insuficientes. La mejora cuesta *${monto(r.falta)}* y tienes *${monto(cuenta.wallet)}* en mano.` });
        return reply({ text: `⚠️ ${r.error}` });
      }
      addToWallet(sender, -r.coste.monedas);
      guardarMascotas(sender, cuenta, est);
      const def = ARBOL[rama];
      await reply({
        text: tarjeta({
          emoji: def.emoji,
          titulo: "ÁRBOL MEJORADO",
          relato: `*${def.nombre}* subió al nivel *${r.nivel}*.`,
          lineas: [`✨ *EFECTO::* ${def.formato(def.valores[r.nivel - 1])}`, `💸 *COSTO::* -${monto(r.coste.monedas)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`],
          tip: "Alimenta a tu mascota para ver el efecto."
        })
      });
    }
  }
];

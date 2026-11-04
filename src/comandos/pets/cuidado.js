import { tarjeta, textoEspera } from "../../economia/formato-evento.js";
import { cargarMascotas, guardarMascotas, elegirMascota } from "../../../motores/mascotas-core.js";
import { COMIDAS, ACCESORIOS } from "../../../motores/mascotas-datos.js";
import { alimentar, jugar, dormir, despertar, equipar, quitar, resolverAccesorio, limpiarNombre, mascotaPorNumero } from "../../../motores/mascotas-logica.js";

const sinTildes = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const redondo = (n) => Math.round(n);

const JUEGOS = [
  "{n} persiguió una pelota por todo el patio.",
  "{n} corrió en círculos persiguiendo su propia cola.",
  "{n} encontró un palito y no lo quiso soltar.",
  "{n} saltó entre los charcos y se divirtió muchísimo.",
  "{n} jugó a esconderse detrás de una caja."
];

const elegirTexto = (lista, n) => lista[Math.floor(Math.random() * lista.length)].replaceAll("{n}", n);

async function conMascota(ctx, accion) {
  const { sender, cleanText, reply } = ctx;
  const datos = await cargarMascotas(sender);
  const elegido = elegirMascota(datos.est, cleanText);
  if (elegido.error) return reply({ text: elegido.error });
  const resultado = await accion({ ...datos, m: elegido.m, resto: elegido.resto, numero: datos.est.mascotas.indexOf(elegido.m) + 1 });
  if (resultado === false) return null;
  return guardarMascotas(sender, datos.cuenta, datos.est);
}

const tarjetaCuidado = (emoji, titulo, relato, lineas, tip) => tarjeta({ emoji, titulo, relato, lineas, tip });

export default [
  {
    names: [".petalimentar", ".petcomer"],
    usage: ".petalimentar [número] [comida]",
    desc: "Alimenta a tu mascota con la comida que tengas en tu mochila",
    category: "Pets",
    handler: async (ctx) => conMascota(ctx, async ({ est, m, resto }) => {
      const texto = sinTildes(resto.join(" "));
      const tipo = Object.keys(COMIDAS).find((k) => texto.includes(k)) || null;
      const r = alimentar(est, m, tipo);
      if (!r.ok) {
        await ctx.reply({ text: `⚠️ ${r.error}` });
        return false;
      }
      await ctx.reply({
        text: tarjetaCuidado("🍖", "MASCOTA ALIMENTADA", `${m.nombre} comió *${r.comida.nombre}* con muchas ganas.`, [
          `${r.comida.emoji} *COMIDA RECUPERADA::* +${r.recuperado}`,
          `🍖 *COMIDA::* ${redondo(m.hambre)}/100`,
          `🎒 *RESTANTES::* ${est.comida[Object.keys(COMIDAS).find((k) => COMIDAS[k] === r.comida)]}`
        ])
      });
    })
  },
  {
    names: [".petjugar", ".petplay"],
    usage: ".petjugar [número]",
    desc: "Juega con tu mascota para aumentar su diversión (consume energía)",
    category: "Pets",
    handler: async (ctx) => conMascota(ctx, async ({ m, ahora }) => {
      const r = jugar(m, ahora);
      if (!r.ok) {
        await ctx.reply({ text: r.espera ? textoEspera(r.espera) : `⚠️ ${r.error}` });
        return false;
      }
      await ctx.reply({
        text: tarjetaCuidado("🎾", "HORA DE JUGAR", elegirTexto(JUEGOS, m.nombre), [
          `🎾 *DIVERSIÓN::* ${redondo(m.diversion)}/100`,
          `⚡ *ENERGÍA::* ${redondo(m.energia)}/100`,
          `🍖 *COMIDA::* ${redondo(m.hambre)}/100`
        ], "Puedes volver a jugar con tu mascota en 10 minutos.")
      });
    })
  },
  {
    names: [".petdormir", ".petsleep"],
    usage: ".petdormir [número]",
    desc: "Envía a tu mascota a dormir para recuperar energía y crecer más rápido",
    category: "Pets",
    handler: async (ctx) => conMascota(ctx, async ({ m }) => {
      const r = dormir(m);
      if (!r.ok) {
        await ctx.reply({ text: `⚠️ ${r.error}` });
        return false;
      }
      await ctx.reply({
        text: tarjetaCuidado("😴", "A DORMIR", `${m.nombre} se acurrucó y se quedó dormido.`, [
          `⚡ *ENERGÍA::* ${redondo(m.energia)}/100`
        ], m.casa ? "Su casa le da mayor comodidad mientras descansa." : "Una casa le permitiría descansar con mayor comodidad.")
      });
    })
  },
  {
    names: [".petdespertar", ".petwake"],
    usage: ".petdespertar [número]",
    desc: "Despierta a tu mascota",
    category: "Pets",
    handler: async (ctx) => conMascota(ctx, async ({ m }) => {
      const r = despertar(m);
      if (!r.ok) {
        await ctx.reply({ text: `⚠️ ${r.error}` });
        return false;
      }
      await ctx.reply({
        text: tarjetaCuidado("☀️", "MASCOTA DESPIERTA", r.molesto ? `${m.nombre} despertó de mal humor porque aún tenía sueño.` : `${m.nombre} despertó descansado y con energía.`, [
          `⚡ *ENERGÍA::* ${redondo(m.energia)}/100`,
          `🎾 *DIVERSIÓN::* ${redondo(m.diversion)}/100`
        ])
      });
    })
  },
  {
    names: [".petequipar", ".petponer"],
    usage: ".petequipar [número] <accesorio>",
    desc: "Equipa un accesorio que hayas comprado a tu mascota",
    category: "Pets",
    handler: async (ctx) => conMascota(ctx, async ({ est, m, resto }) => {
      const id = resolverAccesorio(resto.join(" "));
      if (!id) {
        await ctx.reply({ text: "Indica el accesorio que deseas equipar, por ejemplo: *.petequipar 1 gafas*. Usa *.pettienda* para ver la lista." });
        return false;
      }
      const r = equipar(est, m, id);
      if (!r.ok) {
        await ctx.reply({ text: `⚠️ ${r.error}` });
        return false;
      }
      await ctx.reply({
        text: tarjetaCuidado(r.acc.emoji, "ACCESORIO EQUIPADO", `${m.nombre} ahora lleva *${r.acc.nombre}*.`, [`${r.acc.emoji} *ESPACIO::* ${r.acc.espacio}`, ...(r.anterior ? [`🎒 *DEVUELTO A LA MOCHILA::* ${r.anterior.nombre}`] : [])], "Usa *.mispets* para ver cómo luce.")
      });
    })
  },
  {
    names: [".petquitar", ".petretirar"],
    usage: ".petquitar [número] <accesorio>",
    desc: "Retira un accesorio de tu mascota y lo guarda en tu mochila",
    category: "Pets",
    handler: async (ctx) => conMascota(ctx, async ({ est, m, resto }) => {
      const r = quitar(est, m, resto.join(" "));
      if (!r.ok) {
        await ctx.reply({ text: `⚠️ ${r.error}` });
        return false;
      }
      await ctx.reply({ text: tarjetaCuidado(r.acc.emoji, "ACCESORIO RETIRADO", `${m.nombre} ya no lleva *${r.acc.nombre}*. Quedó guardado en tu mochila.`, []) });
    })
  },
  {
    names: [".petnombre", ".petrename"],
    usage: ".petnombre <número> <nombre>",
    desc: "Cambia el nombre de tu mascota",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const datos = await cargarMascotas(sender);
      const { est } = datos;
      if (!est.mascotas.length) return reply({ text: "Aún no tienes mascotas." });
      const partes = cleanText.trim().split(/\s+/).slice(1);
      let m;
      if (partes.length && /^#?\d+$/.test(partes[0])) {
        m = mascotaPorNumero(est, parseInt(partes.shift().replace("#", ""), 10));
        if (!m) return reply({ text: "No tienes una mascota con ese número. Usa *.mispets* para ver tu lista." });
      } else if (est.mascotas.length === 1) {
        m = est.mascotas[0];
      } else {
        return reply({ text: "Indica el número de la mascota, por ejemplo: *.petnombre 2 Rocky*." });
      }
      const nombre = limpiarNombre(partes.join(" "));
      if (!nombre) return reply({ text: "Escribe el nuevo nombre, por ejemplo: *.petnombre 1 Rocky*." });
      const anterior = m.nombre;
      m.nombre = nombre;
      guardarMascotas(sender, datos.cuenta, est);
      await reply({ text: tarjetaCuidado("✏️", "NOMBRE ACTUALIZADO", `*${anterior}* ahora se llama *${nombre}*.`, []) });
    }
  }
];

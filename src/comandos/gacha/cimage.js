import { gachaListo, prepararImagen, fmt } from "../../../motores/gacha-core.js";
import { buscarWaifus, galeriaDe, palabras } from "../../../motores/gacha-busqueda.js";

const USO = [
  "⚙️ Uso: *.cimage <nombre de la waifu>*",
  "",
  "> Muestra una foto de la waifu con su nombre, género y serie. Cada vez que lo uses puede salir una foto distinta.",
  "> Para ver una foto en concreto agrega su número: *.cimage <nombre> <número>*.",
  "",
  "Ejemplo: .cimage Yakumo Mitama"
].join("\n");

const aleatorio = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default {
  names: [".cimage", ".cimg", ".fotowaifu"],
  desc: "Busca una waifu por su nombre y muestra una de sus fotos: .cimage <nombre> [número de foto]",
  category: "Waifu",
  usage: ".cimage <nombre> [número de foto]",
  handler: async ({ cleanText, reply }) => {
    await gachaListo;
    const fichas = cleanText.trim().split(/\s+/).slice(1);
    let numero = null;
    if (fichas.length > 1 && /^\d{1,3}$/.test(fichas[fichas.length - 1])) numero = parseInt(fichas.pop(), 10);
    const consulta = fichas.join(" ");
    if (palabras(consulta).join("").length < 2) return reply({ text: USO });

    const encontrados = buscarWaifus(consulta, 5);
    if (!encontrados.length) return reply({ text: `🔎 No encontré ninguna waifu parecida a *${consulta}*.` });

    const { p, s } = encontrados[0];
    const galeria = galeriaDe(p);
    const indice = numero && numero <= galeria.length ? numero - 1 : Math.floor(Math.random() * galeria.length);
    const url = galeria[indice];
    const respaldo = [p.img, aleatorio(galeria), aleatorio(galeria)].filter((u) => u && u !== url);

    const lineas = [
      `❀ Nombre » *${p.nombre}*`,
      `⚥ Género » *${p.genero || "Desconocido"}*`,
      `❖ Serie » *${p.serie || "Desconocida"}*`,
      `✦ Valor » *${fmt(p.valor)}*`,
      `❒ Foto » *${indice + 1}/${galeria.length}*`
    ];
    if (numero && numero > galeria.length) lineas.push(`> Esta waifu solo tiene ${galeria.length} ${galeria.length === 1 ? "foto" : "fotos"}, así que te muestro una al azar.`);

    const parecidas = encontrados.slice(1).filter((x) => x.s <= s + 0.5 && x.p.id !== p.id);
    if (parecidas.length) {
      lineas.push("", `> También coinciden: ${parecidas.map((x) => `${x.p.nombre} (${x.p.serie || "Desconocida"})`).join(", ")}.`);
    }
    const caption = lineas.join("\n");

    let imagen;
    try {
      imagen = await prepararImagen([url, ...respaldo]);
    } catch (e) {
      console.log(`[cimage] Imagen no disponible (${p.nombre}): ${e.message}`);
      return reply({ text: `${caption}\n\n> 🖼️ La imagen no está disponible en este momento. Inténtalo de nuevo.` });
    }
    try {
      await reply({ image: { url: imagen.ruta }, caption });
    } finally {
      imagen.limpiar();
    }
  }
};

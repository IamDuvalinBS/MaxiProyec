import { gachaListo, mostrarColeccion, monto } from "../../../motores/gacha-core.js";
import { coleccionDe, contarColeccion, contarPersonajes } from "../../../motores/gacha-db.js";
import { statsEfectivas, nivelMaxDe } from "../../../motores/gacha-niveles.js";
import { getProfile } from "../../../motores/profile.js";
import { htmlBrawlers } from "../../../motores/brawlers-html.js";
import { imagenesCompactas } from "../../../motores/gacha-imagen-html.js";
import { candidatosDeUsuario, buscarUsuarioConDatos } from "../../../motores/gacha-usuario.js";
import { esHalloween } from "../../economia/temas.js";

const POR_PARTE = 36;
const FIRMA = "Powered By ItsDuva";

const CLASES = {
  "Damage Dealer": "Dañador",
  Tank: "Tanque",
  Assassin: "Asesino",
  Marksman: "Tirador",
  Sniper: "Francotirador",
  Artillery: "Artillero",
  Controller: "Controlador",
  Support: "Apoyo",
  Thrower: "Lanzador",
  Skirmisher: "Combatiente"
};

const respaldoTexto = ({ usuario, cleanText, reply }) =>
  mostrarColeccion({
    categoria: "brawler", titulo: "Tus Brawlers", sender: usuario, cleanText, reply,
    pista: "⚡ Súbelos de nivel con *.cubitos* y *.subirbrawler* (usa #id para elegir cuál)."
  });

export default {
  names: [".misbrawlers"],
  desc: "Muestra tu colección de Brawlers con su nivel y sus estadísticas",
  category: "Gacha",
  usage: ".misbrawlers [parte]",
  handler: async ({ sock, from, sender, msg, cleanText, reply }) => {
    await gachaListo;
    const usuario = await buscarUsuarioConDatos(
      candidatosDeUsuario(sock, msg, sender),
      (u) => contarColeccion(u, "brawler").n,
      "misbrawlers"
    );
    const todos = coleccionDe(usuario, "brawler", 100000, 0);
    if (!todos.length || typeof sock.sendHtml !== "function") {
      return respaldoTexto({ usuario, cleanText, reply });
    }

    try {
      const partes = Math.ceil(todos.length / POR_PARTE);
      const parte = Math.min(partes, Math.max(1, parseInt(cleanText.split(/\s+/)[1], 10) || 1));
      const trozo = todos.slice((parte - 1) * POR_PARTE, parte * POR_PARTE);
      const imagenes = await imagenesCompactas(
        trozo.map((c) => c.img),
        { ancho: 144, alto: 144, modo: "contain", fondo: null, formato: "png" }
      );

      const conteoRareza = new Map();
      for (const c of todos) conteoRareza.set(c.rareza, (conteoRareza.get(c.rareza) || 0) + 1);

      const datos = {
        halloween: esHalloween(),
        nombre: msg?.pushName || getProfile(usuario).name || "Jugador",
        n: todos.length,
        total: Math.max(contarPersonajes("brawler"), todos.length),
        valorTxt: monto(todos.reduce((a, c) => a + c.valor, 0)),
        rarezas: [...conteoRareza].map(([n, c]) => ({ n, c })),
        parte,
        partes,
        porParte: POR_PARTE,
        firma: FIRMA,
        items: trozo.map((c, i) => {
          const st = statsEfectivas(c, c.nivel);
          const clase = c.meta?.clase || "Brawler";
          return {
            id: c.id,
            nombre: c.nombre,
            serie: c.serie || "Brawl Stars",
            nivel: c.nivel,
            max: nivelMaxDe("brawler", c.estrellas),
            estrellas: c.estrellas || 0,
            rareza: c.rareza,
            clase,
            claseN: CLASES[clase] || clase,
            st: { hp: st.hp, atk: st.atk, def: st.def, spe: st.spe },
            img: imagenes[i]
          };
        })
      };

      await sock.sendHtml(from, htmlBrawlers(datos), [], undefined, {});
    } catch (e) {
      console.log("[misbrawlers] ERROR: " + e.stack);
      await respaldoTexto({ usuario, cleanText, reply });
    }
  }
};

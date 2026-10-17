// Pase de temporada: niveles con recompensas. La página lo muestra y el bot entrega lo que va a WhatsApp (¥enes y tickets).
// Para cambiar de temporada: cambia id, nombre, fin y las recompensas (la página reinicia el progreso sola).
// Tipos de recompensa:
//   { t: "yenes",  v: 5000 }                      → monedas del bot
//   { t: "ticket", cat: "waifu", v: 1 }           → tickets del gacha (waifu, pokemon, brawler, snake, cod, dragon, clash)
//   { t: "cos",    id: "pmarco1" }                → marco/portada para el perfil (se define en la página: modulos/pases.js)
//   { t: "ins",    id: "novato" }                 → insignia para el perfil (se define en la página: modulos/pases.js)
export const TEMPORADA = {
  id: "T1",
  nombre: "Temporada 1",
  fin: Date.parse("2026-12-01T05:59:59Z"),   // cuando termina (la página muestra la cuenta atrás)
  xpNivel: 100,                               // XP por nivel (2 anuncios = 1 nivel: cada anuncio da la mitad)
  niveles: [
    { n: 1,  r: { t: "yenes", v: 5000 } },
    { n: 2,  r: { t: "ins", id: "novato" } },
    { n: 3,  r: { t: "ticket", cat: "waifu", v: 1 } },
    { n: 4,  r: { t: "yenes", v: 10000 } },
    { n: 5,  r: { t: "cos", id: "pmarco1" } },
    { n: 6,  r: { t: "ins", id: "estrella" } },
    { n: 7,  r: { t: "yenes", v: 15000 } },
    { n: 8,  r: { t: "cos", id: "pportada1" } },
    { n: 9,  r: { t: "ticket", cat: "pokemon", v: 1 } },
    { n: 10, r: { t: "ins", id: "rayo" } },
    { n: 11, r: { t: "yenes", v: 20000 } },
    { n: 12, r: { t: "ticket", cat: "waifu", v: 1 } },
    { n: 13, r: { t: "cos", id: "pmarco2" } },
    { n: 14, r: { t: "yenes", v: 30000 } },
    { n: 15, r: { t: "ins", id: "corona" } },
    { n: 16, r: { t: "ticket", cat: "pokemon", v: 1 } },
    { n: 17, r: { t: "cos", id: "pportada2" } },
    { n: 18, r: { t: "yenes", v: 50000 } },
    { n: 19, r: { t: "ticket", cat: "waifu", v: 1 } },
    { n: 20, r: { t: "ins", id: "leyenda" } }
  ]
};

export const vaAlBot = (r) => r?.t === "yenes" || r?.t === "ticket";
export const nivelPorNumero = (n) => TEMPORADA.niveles.find((x) => x.n === n) || null;
export const catalogoParaPagina = () => ({
  id: TEMPORADA.id, nombre: TEMPORADA.nombre, fin: TEMPORADA.fin, xn: TEMPORADA.xpNivel,
  niv: TEMPORADA.niveles.map((x) => ({ n: x.n, r: x.r }))
});

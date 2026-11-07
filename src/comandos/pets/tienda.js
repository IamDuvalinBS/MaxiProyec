import { getAccount, addToWallet } from "../../../motores/db.js";
import { tarjeta, monto } from "../../economia/formato-evento.js";
import { cargarMascotas, guardarMascotas } from "../../../motores/mascotas-core.js";
import { INCUBADORA, HUEVOS, COMIDAS, CASAS, ACCESORIOS, RAREZAS, JABON, MAX_MASCOTAS } from "../../../motores/mascotas-datos.js";
import { resolverArticulo, precioDe, mascotaPorNumero } from "../../../motores/mascotas-logica.js";

const lineaHuevo = ([id, h]) => `${h.emoji} *${h.nombre}* (${id}) — ${monto(h.precio)} · ${h.horas} h\n     ${Object.keys(h.rarezas).map((r) => `${RAREZAS[r].emoji} ${RAREZAS[r].nombre}`).join(" / ")}`;
const lineaComida = ([id, c]) => `${c.emoji} *${c.nombre}* (${id}) — ${monto(c.precio)} · +${c.hambre} comida`;
const lineaAccesorio = ([id, a]) => `${a.emoji} *${a.nombre}* (${id}) — ${monto(a.precio)} · ${a.espacio}${a.lluvia ? ` · ${Math.round(a.lluvia * 100)}% contra lluvia` : ""}`;

function textoTienda() {
  const incubadoras = INCUBADORA.niveles.map((n) => `🔥 *${n.nombre}* — ${n.mejora ? `mejora ${monto(n.mejora)}` : monto(INCUBADORA.precio)} · ${n.espacios} espacio${n.espacios > 1 ? "s" : ""} · tiempo x${n.tiempo}`);
  const casas = CASAS.niveles.map((n) => `🏠 *${n.nombre}* — ${n.mejora ? `mejora ${monto(n.mejora)}` : monto(CASAS.precio)} · comodidad +${Math.round(n.comodidad * 100)}%`);
  return [
    tarjeta({
      emoji: "🐾",
      titulo: "TIENDA DE MASCOTAS",
      relato: "Todo se compra aquí. Nadie comienza con una incubadora ni con mascotas.",
      lineas: [
        "*INCUBADORA*", ...incubadoras, "",
        "*HUEVOS*", ...Object.entries(HUEVOS).map(lineaHuevo), "",
        "*COMIDA*", ...Object.entries(COMIDAS).map(lineaComida), "",
        `*BAÑO*`, `${JABON.emoji} *${JABON.nombre}* (jabon) — ${monto(JABON.precio)} · un baño completo`, "",
        "*CASAS (una por mascota)*", ...casas, "",
        "*ACCESORIOS*", ...Object.entries(ACCESORIOS).map(lineaAccesorio)
      ],
      tip: [
        "Compra con *.petcomprar huevo raro 2*, *.petcomprar comida premium 5* o *.petcomprar casa 1* (el número es tu mascota).",
        "Mejora con *.petmejorar incubadora* o *.petmejorar casa 1*."
      ]
    })
  ].join("\n");
}

export default [
  {
    names: [".pettienda", ".petshop", ".tiendapets"],
    usage: ".pettienda",
    desc: "Muestra los precios de incubadoras, huevos, comida, casas y accesorios",
    category: "Pets",
    handler: async ({ reply }) => reply({ text: textoTienda() })
  },
  {
    names: [".petcomprar", ".petbuy"],
    usage: ".petcomprar <artículo> [cantidad]",
    desc: "Compra incubadora, huevos, comida, casas y accesorios para tus mascotas",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const texto = cleanText.trim().split(/\s+/).slice(1).join(" ");
      const articulo = resolverArticulo(texto);
      if (!articulo) return reply({ text: "No reconozco ese artículo. Usa *.pettienda* para ver lo que puedes comprar." });

      const { cuenta, est } = await cargarMascotas(sender);
      let cantidad = 1;
      if (["huevo", "comida", "accesorio", "jabon"].includes(articulo.tipo)) cantidad = articulo.numero || 1;

      if (articulo.tipo === "incubadora" && est.incubadora) {
        return reply({ text: "Ya tienes una incubadora. Puedes mejorarla con *.petmejorar incubadora*." });
      }
      let mascota = null;
      if (articulo.tipo === "casa") {
        if (!est.mascotas.length) return reply({ text: "Primero necesitas una mascota para comprarle una casa." });
        mascota = mascotaPorNumero(est, articulo.numero);
        if (!mascota) return reply({ text: "Indica el número de la mascota, por ejemplo: *.petcomprar casa 1*." });
        if (mascota.casa) return reply({ text: `${mascota.nombre} ya tiene casa. Puedes mejorarla con *.petmejorar casa ${articulo.numero || 1}*.` });
      }
      if (articulo.tipo === "huevo") {
        const enIncubadora = est.incubadora ? est.incubadora.huevos.length : 0;
        const tienes = Object.values(est.huevos).reduce((a, b) => a + b, 0);
        if (est.mascotas.length + enIncubadora + tienes + cantidad > MAX_MASCOTAS) {
          return reply({ text: `El límite es de ${MAX_MASCOTAS} mascotas entre las que ya tienes, los huevos guardados y los que están en la incubadora.` });
        }
      }

      const costo = precioDe(articulo, cantidad);
      if (cuenta.wallet < costo) {
        return reply({ text: `⚠️ Fondos insuficientes. Cuesta *${monto(costo)}* y tienes *${monto(cuenta.wallet)}* en mano. Usa *.retirar* para sacar dinero del banco.` });
      }
      addToWallet(sender, -costo);

      let nombre;
      if (articulo.tipo === "incubadora") {
        est.incubadora = { nivel: 1, huevos: [] };
        nombre = INCUBADORA.niveles[0].nombre;
      } else if (articulo.tipo === "huevo") {
        est.huevos[articulo.id] += cantidad;
        nombre = `${cantidad} × ${HUEVOS[articulo.id].nombre}`;
      } else if (articulo.tipo === "comida") {
        est.comida[articulo.id] += cantidad;
        nombre = `${cantidad} × ${COMIDAS[articulo.id].nombre}`;
      } else if (articulo.tipo === "jabon") {
        est.jabon += cantidad;
        nombre = `${cantidad} × ${JABON.nombre}`;
      } else if (articulo.tipo === "casa") {
        mascota.casa = 1;
        nombre = `${CASAS.niveles[0].nombre} para ${mascota.nombre}`;
      } else {
        est.accesorios[articulo.id] += cantidad;
        nombre = `${cantidad} × ${ACCESORIOS[articulo.id].nombre}`;
      }
      guardarMascotas(sender, cuenta, est);

      const sugerencia = {
        incubadora: "Compra un huevo con *.petcomprar huevo* y colócalo con *.petincubar*.",
        huevo: "Colócalo en la incubadora con *.petincubar*.",
        comida: "Alimenta a tu mascota con *.petalimentar <número>*.",
        jabon: "Báñala con *.petbañar <número>*.",
        casa: "Ahora tu mascota estará protegida de la lluvia.",
        accesorio: "Equípalo con *.petequipar <número> <accesorio>*."
      }[articulo.tipo];
      await reply({
        text: tarjeta({
          emoji: "🛍️",
          titulo: "COMPRA REALIZADA",
          relato: `Adquiriste *${nombre}*.`,
          lineas: [`💸 *COSTO::* -${monto(costo)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`],
          tip: sugerencia
        })
      });
    }
  },
  {
    names: [".petmejorar", ".petupgrade"],
    usage: ".petmejorar incubadora | .petmejorar casa <número>",
    desc: "Mejora tu incubadora o la casa de una mascota",
    category: "Pets",
    handler: async ({ sender, cleanText, reply }) => {
      const texto = cleanText.trim().split(/\s+/).slice(1).join(" ");
      const articulo = resolverArticulo(texto);
      if (!articulo || !["incubadora", "casa"].includes(articulo.tipo)) {
        return reply({ text: "Puedes mejorar la *incubadora* o la *casa* de una mascota. Ejemplo: *.petmejorar casa 1*." });
      }
      const { cuenta, est } = await cargarMascotas(sender);
      let siguiente;
      let objetivo;
      if (articulo.tipo === "incubadora") {
        if (!est.incubadora) return reply({ text: "Aún no tienes una incubadora. Puedes comprarla con *.petcomprar incubadora*." });
        siguiente = INCUBADORA.niveles[est.incubadora.nivel];
        objetivo = "tu incubadora";
      } else {
        const mascota = mascotaPorNumero(est, articulo.numero);
        if (!mascota) return reply({ text: "Indica el número de la mascota, por ejemplo: *.petmejorar casa 1*." });
        if (!mascota.casa) return reply({ text: `${mascota.nombre} no tiene casa. Compra una con *.petcomprar casa ${articulo.numero || 1}*.` });
        siguiente = CASAS.niveles[mascota.casa];
        objetivo = `la casa de ${mascota.nombre}`;
        articulo.mascota = mascota;
      }
      if (!siguiente) return reply({ text: `Ya mejoraste ${objetivo} al nivel máximo.` });
      if (cuenta.wallet < siguiente.mejora) {
        return reply({ text: `⚠️ Fondos insuficientes. La mejora cuesta *${monto(siguiente.mejora)}* y tienes *${monto(cuenta.wallet)}* en mano.` });
      }
      addToWallet(sender, -siguiente.mejora);
      if (articulo.tipo === "incubadora") est.incubadora.nivel = siguiente.nivel;
      else articulo.mascota.casa = siguiente.nivel;
      guardarMascotas(sender, cuenta, est);
      await reply({
        text: tarjeta({
          emoji: "⬆️",
          titulo: "MEJORA COMPLETADA",
          relato: `Mejoraste ${objetivo} a *${siguiente.nombre}*.`,
          lineas: [`💸 *COSTO::* -${monto(siguiente.mejora)}`, `⛁ *CARTERA::* ${monto(getAccount(sender).wallet)}`]
        })
      });
    }
  }
];

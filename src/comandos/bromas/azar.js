import {
  numero, personasDe, argumentos, sinMenciones, azar, elegir, mezclar, porcentaje, barra, tramo,
  enviarConEdicion, enviarResultado, enviarConGif, enviarTexto, soloGrupo, participantesDelGrupo
} from "./_lib/bromas-core.js";

const CAT = "Bromas";

const AVISO_GRUPO = (titulo, emoji) => `⧼${emoji}⧽ *${titulo}*\n\nEste comando solo se puede usar dentro de un grupo.`;

const objetivoDe = (msg, sender) => personasDe(msg)[0] || sender;

const BOLA8 = [
  "Sí, sin ninguna duda.", "Todo apunta a que sí.", "Es lo más probable.", "Claro que sí.",
  "Ahora mismo no se puede saber.", "Vuelve a preguntar más tarde.", "Mejor no te lo digo ahora.",
  "No cuentes con ello.", "Mi respuesta es no.", "Las señales dicen que no.", "Ni de broma.", "Muy dudoso."
];

const VERDADES = [
  "¿Cuál fue la última mentira que dijiste?", "¿Qué canción escuchas a escondidas?", "¿Cuál es tu peor hábito?",
  "¿Qué es lo más vergonzoso que te pasó en clase o en el trabajo?", "¿A quién del grupo le responderías más rápido?",
  "¿Qué app usas más y no lo admites?", "¿Cuál fue tu peor corte de pelo?", "¿Qué es lo más raro que has comido?",
  "¿Cuál es tu mayor miedo tonto?", "¿Qué regalo recibiste que nunca usaste?", "¿Qué serie viste a escondidas?",
  "¿A quién del grupo le prestarías tu celular sin miedo?", "¿Cuál fue tu mayor torpeza en público?"
];

const RETOS = [
  "Manda un audio cantando tu canción favorita.", "Cambia tu foto de perfil por la que elija el grupo durante una hora.",
  "Escribe un mensaje solo con emojis y que el grupo lo adivine.", "Imita a un animal en un audio de 10 segundos.",
  "Manda una foto de lo que tienes más cerca ahora mismo.", "Habla con rimas durante los próximos 5 mensajes.",
  "Cuenta un chiste (aunque sea malo) al grupo.", "Escribe un poema corto para la última persona que escribió.",
  "Di tres cosas buenas de cada persona que escribió hoy.", "Manda un sticker que describa tu día.",
  "Escribe tu nombre con los pies o la mano que no usas (y manda la foto).", "Haz un discurso de 20 segundos sobre tu comida favorita."
];

const PIROPOS = [
  "Si fueras una canción, serías la que no puedo dejar de repetir.", "Tienes más estilo que un domingo sin tareas.",
  "Eres el WiFi de mi vida: contigo todo carga mejor.", "Si la amabilidad fuera un deporte, tendrías medalla de oro.",
  "Hasta el café se alegra cuando llegas.", "Contigo hasta los lunes tienen gracia.",
  "Eres de esas personas que mejoran cualquier grupo.", "Tu sonrisa necesita permiso de la NASA: ilumina demasiado.",
  "Eres el sticker favorito de mi chat.", "Si fueras videojuego, serías el que nunca quiero terminar."
];

const CHISTES = [
  "¿Qué le dice un cero a un ocho? Bonito cinturón.", "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter.",
  "¿Cuál es el animal más antiguo? La cebra, porque está en blanco y negro.", "¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
  "¿Cómo se despiden los químicos? Ácido un placer.", "¿Qué le dijo un techo a otro? Techo de menos.",
  "¿Qué le dice una iguana a su hermana gemela? Iguanita.", "¿Por qué el libro de matemáticas estaba triste? Porque tenía muchos problemas.",
  "¿Cuál es el colmo de un electricista? Que su esposa se llame Luz y sus hijos le sigan la corriente.",
  "¿Qué le dice un semáforo a otro? No me mires, me estoy cambiando.", "¿Qué hace un perro con un taladro? ¡Taladrando!",
  "¿Qué le dice un gusano a otro? Voy a dar una vuelta a la manzana."
];

const CONSEJOS = [
  "Si tienes sueño, duerme. El grupo puede esperar.", "Nunca confíes en un enchufe que no tiene luz.",
  "Antes de responder enojado, cuenta hasta tres y manda un sticker.", "Bebe agua, que las ideas también se deshidratan.",
  "Si el WiFi falla, reinicia. Si falla otra vez, culpa al vecino.", "Hoy es buen día para no discutir con nadie.",
  "Come algo antes de tomar decisiones importantes.", "Si dudas entre dos opciones, escoge la que tenga snacks."
];

const ROASTS = [
  "tiene el WiFi más lento del grupo: contesta y ya es mañana.", "pone alarma para despertarse y la apaga con maestría ninja.",
  "dice 'ya voy' desde hace tres horas.", "tiene más pestañas abiertas que amigos reales.",
  "se pierde hasta en su propia casa si le cambian un mueble.", "pide ayuda con el celular y lo tiene en la mano.",
  "dice 'no tengo hambre' y se come el plato de todos.", "dejó el chat en visto tantas veces que ya tiene récord.",
  "cuenta chistes tan malos que hasta el bot se sonroja.", "siempre dice 'esta vez sí' y nunca es así.",
  "se ríe de sus propios chistes antes de terminarlos.", "tiene la batería al 1% y aun así abre redes sociales."
];

const HALAGOS = [
  "es de las mejores personas del grupo.", "siempre sabe cómo sacar una sonrisa.", "tiene una energía que contagia.",
  "es de esas personas que nunca falla cuando se le necesita.", "tiene un humor que alegra el chat.",
  "es más valioso/a de lo que cree.", "se merece un aplauso por existir hoy."
];

const SUFIJOS = ["el Valiente", "la Misteriosa", "el Sabio", "la Veloz", "el Tranquilo", "la Imparable", "el Legendario", "la Brillante",
  "el Curioso", "el Inquebrantable", "la Soñadora", "el Ninja", "la Maga", "el Chef", "el Astronauta"];
const PREFIJOS = ["Capitán", "Doctor", "Señor", "Don", "Sir", "Lord", "Maestro", "Super", "Mega", "Mini"];
const CHISTOSOS = ["Chispitas", "Galletita", "Bombón", "Pixel", "Turbo", "Mango", "Nugget", "Pelusa", "Ñoño", "Chocolatito", "Panqueque", "Fideo"];

const PROFESIONES = [
  "astronauta que olvidó el casco", "chef de microondas profesional", "domador de pulpos", "detective de calcetines perdidos",
  "mago que solo sabe hacer desaparecer el WiFi", "piloto de carritos de supermercado", "youtuber de siestas", "inventor de excusas",
  "capitán de barco de papel", "ingeniero de memes", "científico loco con licencia", "DJ de ollas y sartenes",
  "entrenador de gatos (sin éxito)", "bibliotecario de chismes", "guardián oficial de las llaves perdidas"
];

const ANIMALES = [
  { n: "gato", d: "independiente y con siete vidas de siesta." }, { n: "perro", d: "leal y siempre feliz de ver a todos." },
  { n: "búho", d: "despierto a las 3 a. m. y con mucha sabiduría." }, { n: "capibara", d: "tranquilo, amigo de todos y sin estrés." },
  { n: "zorro", d: "astuto y con mucha chispa." }, { n: "panda", d: "tierno y dormilón, con hambre constante." },
  { n: "delfín", d: "simpático, listo y siempre sonriendo." }, { n: "lobo", d: "líder, protector y muy leal a su manada." },
  { n: "pingüino", d: "elegante aunque camine raro." }, { n: "mapache", d: "curioso, ágil y fan de los tesoros ajenos." },
  { n: "tortuga", d: "paciente: llega a todos lados, pero con calma." }, { n: "león", d: "con carisma de sobra y melena propia." }
];

const PODERES = [
  "Teletransportarse, pero solo a la cocina.", "Hablar con los gatos (y que le respondan mal).", "Pausar el tiempo mientras duerme.",
  "Volverse invisible cuando suena el despertador.", "Siempre encontrar el control remoto.", "Leer la mente, pero solo cuando piensan en comida.",
  "Volar a un metro del suelo.", "Hacer aparecer WiFi donde no hay.", "Convertir cualquier cosa en pizza.",
  "Cargar el celular con la mirada.", "Hacer que el semáforo siempre esté en verde.", "Entender a los bebés."
];

const DESTINOS = [
  "Dentro de un año será dueño/a de una tienda de galletas.", "Este mes encontrará dinero olvidado en un bolsillo.",
  "Pronto vivirá una aventura con final inesperado.", "Se hará famoso/a por un meme del que no sabe nada.",
  "Un día se despertará y todo irá bien (se nota que será un lunes).", "Viajará a un lugar que siempre quiso conocer.",
  "Muy pronto recibirá una noticia que lo/la hará sonreír.", "Encontrará su canción favorita en la radio, justo a tiempo."
];

const CUANDOS = ["mañana mismo", "dentro de 3 días", "la próxima semana", "en un mes", "en 6 meses", "el año que viene",
  "cuando las vacas vuelen", "nunca jamás", "en 10 minutos", "cuando el WiFi funcione bien", "cuando menos lo esperes", "después de la siesta"];

const MEDALLAS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

const bloque = (titulo, emoji, cuerpo, uso) => `⧼${emoji}⧽ *${titulo}*\n\n${cuerpo}${uso ? `\n\n> ${uso}` : ""}`;

export default [
  {
    names: [".quien", ".quién", ".quienes", ".quiensera"],
    usage: ".quien <frase>",
    desc: "Elige a una persona del grupo al azar para tu pregunta.",
    category: CAT,
    handler: async ({ sock, from, msg, cleanText, reply }) => {
      if (!soloGrupo(from)) return reply({ text: AVISO_GRUPO("¿QUIÉN?", "🎲") });
      const frase = sinMenciones(argumentos(cleanText)).slice(0, 80);
      if (!frase) return reply({ text: bloque("¿QUIÉN?", "🎲", "Escribe una frase para saber quién del grupo es.", "Usa *.quien es el más dormilón*.") });
      let lista;
      try { lista = await participantesDelGrupo(sock, from); } catch { return reply({ text: "❌ No se pudo leer la lista del grupo." }); }
      if (!lista.length) return reply({ text: "❌ No hay suficientes participantes." });
      const elegido = elegir(lista);
      await enviarTexto(sock, from, msg, bloque("¿QUIÉN?", "🎲", `*${frase}*\n\nLa persona elegida es @${numero(elegido)}`), [elegido]);
    }
  },
  {
    names: [".parejas", ".parejadelgrupo", ".matchgrupo"],
    usage: ".parejas",
    desc: "Junta a dos personas del grupo al azar y mide su compatibilidad.",
    category: CAT,
    handler: async ({ sock, from, msg, reply }) => {
      if (!soloGrupo(from)) return reply({ text: AVISO_GRUPO("PAREJA DEL GRUPO", "💞") });
      let lista;
      try { lista = await participantesDelGrupo(sock, from); } catch { return reply({ text: "❌ No se pudo leer la lista del grupo." }); }
      if (lista.length < 2) return reply({ text: "❌ Hacen falta al menos dos personas en el grupo." });
      const pareja = mezclar(lista).slice(0, 2);
      const pct = porcentaje();
      const frases = ["Mejor que cada uno siga con su vida.", "Podrían ser buenos conocidos.", "Hay química, ¡quién sabe!", "El grupo ya está organizando la fiesta."];
      const texto = bloque("PAREJA DEL GRUPO", "💞", `@${numero(pareja[0])} 💞 @${numero(pareja[1])}\n\n${barra(pct)}\n\n${tramo(pct, frases)}`);
      await enviarResultado(sock, from, msg, { clave: ".parejas", inicio: "*Buscando una pareja al azar...*", mentions: pareja, texto, etiqueta: ".parejas" });
    }
  },
  {
    names: [".bola8", ".8ball", ".bolamagica"],
    usage: ".bola8 <pregunta>",
    desc: "Hazle una pregunta a la bola mágica.",
    category: CAT,
    handler: async ({ sock, from, msg, cleanText, reply }) => {
      const pregunta = argumentos(cleanText).slice(0, 120);
      if (!pregunta) return reply({ text: bloque("BOLA MÁGICA", "🎱", "Hazle una pregunta a la bola.", "Usa *.bola8 ¿Aprobaré el examen?*") });
      await enviarTexto(sock, from, msg, bloque("BOLA MÁGICA", "🎱", `*${pregunta}*\n\n${elegir(BOLA8)}`));
    }
  },
  {
    names: [".cuando", ".cuándo", ".cuandosera"],
    usage: ".cuando <pregunta>",
    desc: "Predice cuándo va a pasar algo.",
    category: CAT,
    handler: async ({ sock, from, msg, cleanText, reply }) => {
      const pregunta = argumentos(cleanText).slice(0, 100);
      if (!pregunta) return reply({ text: bloque("¿CUÁNDO?", "📅", "Dime qué quieres saber.", "Usa *.cuando me sale la lotería*.") });
      await enviarTexto(sock, from, msg, bloque("¿CUÁNDO?", "📅", `*${pregunta}*\n\nPasará ${elegir(CUANDOS)}.`));
    }
  },
  {
    names: [".porcentaje", ".probabilidad", ".porc"],
    usage: ".porcentaje <frase>",
    desc: "Calcula qué tan probable es algo.",
    category: CAT,
    handler: async ({ sock, from, msg, cleanText, reply }) => {
      const frase = argumentos(cleanText).slice(0, 100);
      if (!frase) return reply({ text: bloque("PROBABILIDAD", "📊", "Escribe qué quieres calcular.", "Usa *.porcentaje que mañana llueva*.") });
      const pct = porcentaje();
      await enviarTexto(sock, from, msg, bloque("PROBABILIDAD", "📊", `*${frase}*\n\n${barra(pct)}`));
    }
  },
  {
    names: [".elegir", ".decidir", ".escoger"],
    usage: ".elegir opción1, opción2, opción3",
    desc: "Elige una opción entre las que escribas.",
    category: CAT,
    handler: async ({ sock, from, msg, cleanText, reply }) => {
      const partes = argumentos(cleanText).split(/,|\s+o\s+|\|/i).map((s) => s.trim()).filter(Boolean).slice(0, 15);
      if (partes.length < 2) return reply({ text: bloque("DECISIÓN", "🧭", "Escribe al menos dos opciones separadas por comas.", "Usa *.elegir pizza, tacos, sushi*.") });
      await enviarTexto(sock, from, msg, bloque("DECISIÓN", "🧭", `Entre ${partes.length} opciones, elijo:\n\n✅ *${elegir(partes)}*`));
    }
  },
  {
    names: [".caraocruz", ".flip", ".cara"],
    usage: ".caraocruz",
    desc: "Lanza una moneda: cara o cruz.",
    category: CAT,
    handler: async ({ sock, from, msg }) => {
      const sale = azar(2) ? "🪙 *CARA*" : "🪙 *CRUZ*";
      await enviarConEdicion(sock, from, msg, {
        inicio: "*Lanzando la moneda...*",
        mentions: [],
        texto: bloque("MONEDA", "🪙", `Cayó: ${sale}`),
        espera: 1200,
        etiqueta: ".caraocruz"
      });
    }
  },
  {
    names: [".verdad", ".truth"],
    usage: ".verdad [@mencion]",
    desc: "Una pregunta para jugar a verdad o reto.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      await enviarConGif(sock, from, msg, { clave: ".verdad", texto: bloque("VERDAD", "🕵️", `Para @${numero(quien)}:\n\n${elegir(VERDADES)}`), mentions: [quien] });
    }
  },
  {
    names: [".reto", ".dare"],
    usage: ".reto [@mencion]",
    desc: "Un reto divertido para jugar a verdad o reto.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      await enviarTexto(sock, from, msg, bloque("RETO", "🎯", `Para @${numero(quien)}:\n\n${elegir(RETOS)}`), [quien]);
    }
  },
  {
    names: [".piropo", ".piropos"],
    usage: ".piropo [@mencion]",
    desc: "Un piropo sano para alguien del grupo.",
    category: CAT,
    handler: async ({ sock, from, msg }) => {
      const quien = personasDe(msg)[0];
      const encabezado = quien ? `Para @${numero(quien)}:\n\n` : "";
      await enviarConGif(sock, from, msg, { clave: ".piropo", texto: bloque("PIROPO", "🌹", `${encabezado}${elegir(PIROPOS)}`), mentions: quien ? [quien] : [] });
    }
  },
  {
    names: [".chiste", ".joke"],
    usage: ".chiste",
    desc: "Cuenta un chiste (casi siempre malo).",
    category: CAT,
    handler: async ({ sock, from, msg }) => {
      await enviarConGif(sock, from, msg, { clave: ".chiste", texto: bloque("CHISTE", "😂", elegir(CHISTES)), mentions: [] });
    }
  },
  {
    names: [".consejo", ".sabiduria", ".sabiduría"],
    usage: ".consejo",
    desc: "Un consejo de vida muy dudoso.",
    category: CAT,
    handler: async ({ sock, from, msg }) => {
      await enviarTexto(sock, from, msg, bloque("CONSEJO", "📜", elegir(CONSEJOS)));
    }
  },
  {
    names: [".roast", ".quemar", ".tirarindirecta"],
    usage: ".roast @mencion",
    desc: "Una broma ligera y sin mala intención para tu amigue.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      await enviarConGif(sock, from, msg, { clave: ".roast", texto: bloque("ROAST SUAVE", "🔥", `@${numero(quien)} ${elegir(ROASTS)}`), mentions: [quien] });
    }
  },
  {
    names: [".halago", ".cumplido"],
    usage: ".halago @mencion",
    desc: "Un halago sincero para tu amigue.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      await enviarConGif(sock, from, msg, { clave: ".halago", texto: bloque("HALAGO", "💖", `@${numero(quien)} ${elegir(HALAGOS)}`), mentions: [quien] });
    }
  },
  {
    names: [".apodo", ".mote"],
    usage: ".apodo @mencion",
    desc: "Le inventa un apodo gracioso a tu amigue.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      const apodo = azar(2) ? `${elegir(PREFIJOS)} ${elegir(CHISTOSOS)}` : `${elegir(CHISTOSOS)} ${elegir(SUFIJOS)}`;
      await enviarTexto(sock, from, msg, bloque("APODO", "🏷️", `A partir de hoy, @${numero(quien)} será conocido/a como:\n\n*${apodo}*`), [quien]);
    }
  },
  {
    names: [".profesion", ".profesión", ".trabajofuturo"],
    usage: ".profesion @mencion",
    desc: "Descubre la profesión secreta de tu amigue.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      await enviarTexto(sock, from, msg, bloque("PROFESIÓN SECRETA", "💼", `@${numero(quien)} trabaja de *${elegir(PROFESIONES)}*.`), [quien]);
    }
  },
  {
    names: [".animalespiritual", ".espiritu", ".espíritu", ".animal"],
    usage: ".animalespiritual @mencion",
    desc: "Descubre qué animal espiritual es tu amigue.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      const a = elegir(ANIMALES);
      await enviarTexto(sock, from, msg, bloque("ANIMAL ESPIRITUAL", "🔮", `El animal espiritual de @${numero(quien)} es el *${a.n}*: ${a.d}`), [quien]);
    }
  },
  {
    names: [".superpoder", ".poder"],
    usage: ".superpoder @mencion",
    desc: "Le da un superpoder inútil a tu amigue.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      await enviarTexto(sock, from, msg, bloque("SUPERPODER", "⚡", `El superpoder de @${numero(quien)} es:\n\n${elegir(PODERES)}`), [quien]);
    }
  },
  {
    names: [".destino", ".futuro"],
    usage: ".destino @mencion",
    desc: "Predice el futuro de tu amigue.",
    category: CAT,
    handler: async ({ sock, from, sender, msg }) => {
      const quien = objetivoDe(msg, sender);
      await enviarTexto(sock, from, msg, bloque("DESTINO", "🔮", `Para @${numero(quien)}:\n\n${elegir(DESTINOS)}`), [quien]);
    }
  },
  {
    names: [".vs", ".duelo", ".versus"],
    usage: ".vs @mencion @mencion",
    desc: "Enfrenta a dos personas y decide quién gana.",
    category: CAT,
    handler: async ({ sock, from, sender, msg, reply }) => {
      const personas = personasDe(msg);
      if (personas.length === 1) personas.unshift(sender);
      const par = personas.slice(0, 2);
      if (par.length < 2 || numero(par[0]) === numero(par[1])) {
        return reply({ text: bloque("DUELO", "⚔️", "Etiqueta a dos personas para enfrentarlas.", "Usa *.vs @usuario @usuario*.") });
      }
      const a = Math.round(Math.random() * 1000) / 10;
      const b = Math.round((100 - a) * 10) / 10;
      const ganador = a >= b ? par[0] : par[1];
      const texto = bloque("DUELO", "⚔️", `@${numero(par[0])} *${a}%*  🆚  *${b}%* @${numero(par[1])}\n\n🏆 Gana @${numero(ganador)}`);
      await enviarResultado(sock, from, msg, { clave: ".vs", inicio: "*Preparando el duelo...*", mentions: par, texto, etiqueta: ".vs" });
    }
  },
  {
    names: [".podio", ".top3"],
    usage: ".podio <título>",
    desc: "Arma un podio de 3 personas al azar con tu título.",
    category: CAT,
    handler: async ({ sock, from, msg, cleanText, reply }) => {
      if (!soloGrupo(from)) return reply({ text: AVISO_GRUPO("PODIO", "🏅") });
      const titulo = sinMenciones(argumentos(cleanText)).slice(0, 60);
      if (!titulo) return reply({ text: bloque("PODIO", "🏅", "Indica el título del podio.", "Usa *.podio Los más dormilones*.") });
      let lista;
      try { lista = await participantesDelGrupo(sock, from); } catch { return reply({ text: "❌ No se pudo leer la lista del grupo." }); }
      if (!lista.length) return reply({ text: "❌ No hay suficientes participantes." });
      const elegidos = mezclar(lista).slice(0, 3);
      const filas = elegidos.map((id, i) => `${MEDALLAS[i]} @${numero(id)}`).join("\n");
      await enviarTexto(sock, from, msg, bloque(`PODIO • ${titulo.toUpperCase()}`, "🏅", filas), elegidos);
    }
  }
];

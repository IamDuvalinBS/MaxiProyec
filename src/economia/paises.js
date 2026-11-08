// Países para .bombardear: banderas, nombres (en español e inglés vía Intl), dificultad y platillo de la victoria.

const CODIGOS =
  "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VE VN YE ZM ZW VA PS TW XK AQ".split(" ");

const NOMBRES_ES = new Intl.DisplayNames(["es"], { type: "region" });
const NOMBRES_EN = new Intl.DisplayNames(["en"], { type: "region" });

const sinAcentos = (t) =>
  String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const bandera = (codigo) => String.fromCodePoint(...[...codigo].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

// Países con defensa fuerte (nivel 5), media-alta (4) y los más pequeños/indefensos (1). El resto sale entre 2 y 3.
const NIVEL_5 = new Set(["US", "RU", "CN", "IN", "GB", "FR", "KP", "IL"]);
const NIVEL_4 = new Set(["DE", "JP", "KR", "TR", "IR", "PK", "BR", "IT", "UA", "SA", "EG", "CA", "AU", "PL"]);
const NIVEL_1 = new Set(["VA", "MC", "SM", "LI", "AD", "MT", "LU", "NR", "TV", "PW", "KI", "MH", "FM", "ST", "SC", "KN", "LC", "VC", "DM", "GD", "AG", "BB", "MV", "WS", "TO", "BZ", "AQ"]);

function nivelDe(codigo) {
  if (NIVEL_5.has(codigo)) return 5;
  if (NIVEL_4.has(codigo)) return 4;
  if (NIVEL_1.has(codigo)) return 1;
  return 2 + ((codigo.charCodeAt(0) + codigo.charCodeAt(1)) % 2);
}

// Platillo con el que se celebra la victoria.
const PLATOS = {
  PE: "un ceviche 🐟", MX: "unos tacos al pastor 🌮", AR: "un asado 🥩", IT: "una pizza 🍕", JP: "un sushi 🍣", FR: "un croissant 🥐",
  ES: "una paella 🥘", US: "una hamburguesa 🍔", DE: "una salchicha con pretzel 🌭", BR: "una feijoada 🍲", CL: "una empanada de pino 🥟",
  CO: "una bandeja paisa 🍛", VE: "una arepa 🫓", EC: "un encebollado 🍲", BO: "una salteña 🥟", UY: "un chivito 🥪", PY: "una sopa paraguaya 🌽",
  CN: "un pato laqueado 🦆", IN: "un curry 🍛", TR: "un kebab 🥙", GR: "un gyros 🥙", KR: "un kimchi 🌶️", TH: "un pad thai 🍜", VN: "un pho 🍜",
  EG: "un koshari 🍚", MA: "un cuscús 🍲", RU: "un borscht 🍲", UA: "un borscht 🍲", PL: "unos pierogi 🥟", CH: "una fondue 🧀", BE: "un waffle 🧇",
  NL: "un stroopwafel 🧇", GB: "un fish and chips 🍟", IE: "un estofado irlandés 🍲", SE: "unas albóndigas 🍝", NO: "un salmón 🐟", PT: "un pastel de nata 🥧",
  CU: "una ropa vieja 🍛", DO: "un mangú 🍌", PA: "un sancocho 🍲", CR: "un gallo pinto 🍚", GT: "un pepián 🍲", HN: "una baleada 🫓", SV: "una pupusa 🫓",
  NI: "un nacatamal 🫔", AU: "un meat pie 🥧", CA: "una poutine 🍟", NZ: "un pavlova 🍰", ID: "un nasi goreng 🍛", PH: "un adobo 🍗", MY: "un nasi lemak 🍚",
  LB: "un hummus 🧆", IL: "un falafel 🧆", IR: "un chelo kebab 🍢", SA: "un kabsa 🍛", ET: "un injera 🫓", NG: "un jollof rice 🍚", ZA: "un braai 🍖",
  AT: "un schnitzel 🍖", HU: "un goulash 🍲", CZ: "un svíčková 🍖", FI: "unos Karelian pies 🥧", DK: "un smørrebrød 🥪", IS: "un hákarl (con valentía) 🦈"
};

const alias = new Map([
  ["usa", "US"], ["eeuu", "US"], ["ee uu", "US"], ["estados unidos de america", "US"], ["united states of america", "US"], ["america", "US"],
  ["uk", "GB"], ["inglaterra", "GB"], ["gran bretana", "GB"], ["reino unido", "GB"], ["holanda", "NL"], ["paises bajos", "NL"],
  ["birmania", "MM"], ["myanmar", "MM"], ["republica checa", "CZ"], ["chequia", "CZ"], ["suazilandia", "SZ"], ["esuatini", "SZ"],
  ["rusia", "RU"], ["corea del sur", "KR"], ["corea del norte", "KP"], ["corea", "KR"], ["emiratos", "AE"], ["emiratos arabes", "AE"],
  ["rd", "DO"], ["republica dominicana", "DO"], ["vaticano", "VA"], ["palestina", "PS"], ["taiwan", "TW"], ["kosovo", "XK"],
  ["antartida", "AQ"], ["antartica", "AQ"], ["costa de marfil", "CI"], ["ivory coast", "CI"], ["timor oriental", "TL"], ["cabo verde", "CV"],
  ["congo", "CG"], ["rdc", "CD"], ["macedonia", "MK"], ["macedonia del norte", "MK"], ["turquia", "TR"], ["turkey", "TR"], ["turkiye", "TR"]
]);

export const PAISES = CODIGOS.map((codigo) => {
  const nombre = NOMBRES_ES.of(codigo) || codigo;
  return { codigo, nombre, bandera: bandera(codigo), nivel: nivelDe(codigo), plato: PLATOS[codigo] || null };
});

const indice = new Map();
for (const p of PAISES) {
  indice.set(sinAcentos(p.nombre), p);
  indice.set(sinAcentos(NOMBRES_EN.of(p.codigo) || ""), p);
  indice.set(sinAcentos(p.codigo), p);
}
for (const [clave, codigo] of alias) indice.set(sinAcentos(clave), PAISES.find((p) => p.codigo === codigo));

// Busca por nombre (español o inglés), código de 2 letras, alias, o incluso la bandera pegada como emoji.
export function buscarPais(texto) {
  const crudo = String(texto || "").trim();
  if (!crudo) return null;
  const emojis = [...crudo].filter((c) => c.codePointAt(0) >= 0x1f1e6 && c.codePointAt(0) <= 0x1f1ff);
  if (emojis.length === 2) {
    const codigo = emojis.map((c) => String.fromCharCode(c.codePointAt(0) - 0x1f1e6 + 65)).join("");
    const porBandera = PAISES.find((p) => p.codigo === codigo);
    if (porBandera) return porBandera;
  }
  const limpio = sinAcentos(crudo);
  if (indice.has(limpio)) return indice.get(limpio);
  // Coincidencia parcial: solo si es única, para no bombardear al país equivocado.
  if (limpio.length >= 4) {
    const parciales = PAISES.filter((p) => sinAcentos(p.nombre).includes(limpio) || sinAcentos(NOMBRES_EN.of(p.codigo) || "").includes(limpio));
    if (parciales.length === 1) return parciales[0];
  }
  return null;
}

export const paisAlAzar = () => PAISES[Math.floor(Math.random() * PAISES.length)];

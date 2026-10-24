// Frases y diseños de las reacciones.
// La clave es el `apiAction` que usa cada comando (ojo: .bonk usa "yeet").
// frases:  [fraseConOtro, fraseSolo]  -> máx. 4 por reacción
// disenos: kaomojis que se agregan al final -> máx. 5 por reacción
// Para agregar una reacción nueva basta con sumar su bloque acá; si no existe
// el bloque, el motor usa fraseConOtro/fraseSolo del propio comando.

export const DATOS = {
  baka: {
    frases: [
      ['le gritó "baka" a', "está diciendo tonterías."],
      ["le dijo baka con todas sus fuerzas a", "se llamó baka frente al espejo."],
      ["no puede creer lo baka que es", "se dio cuenta de que está siendo un baka."],
      ["le sacó la lengua y le dijo baka a", "se regañó por ser tan baka."],
    ],
    disenos: ["(╬ Ò﹏Ó)", "(¬_¬)", "(｀へ´)", "(>_<)", "(¬‿¬)"],
  },
  bite: {
    frases: [
      ["mordió a", "se mordió a sí mismo."],
      ["le dio un mordisco a", "se mordió la mano por accidente."],
      ["no pudo resistirse y mordió a", "se mordió el labio sin querer."],
      ["le clavó los dientes a", "mordió el aire con hambre."],
    ],
    disenos: ["(✧ω✧)", "(・`ω´・)", "ʕ•́ᴥ•̀ʔっ", "(꒪⌓꒪)", "(¬‿¬)"],
  },
  blush: {
    frases: [
      ["se sonrojó por", "se sonrojó."],
      ["se puso rojito al ver a", "se puso rojo sin motivo."],
      ["no pudo evitar sonrojarse frente a", "se tapó la cara de la vergüenza."],
      ["se puso nervioso cerca de", "se sonrojó tímidamente y desvió la mirada."],
    ],
    disenos: ["(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)", "(⌒‿⌒)", "(✿◡‿◡)", "૮(˶ᵔᵕᵔ˶)ა", "(*≧ω≦)"],
  },
  yeet: {
    // .bonk
    frases: [
      ["le dio un bonk a", "se dio un bonk a sí mismo."],
      ["mandó a la cárcel del horny a", "se mandó solito a la cárcel del horny."],
      ["le pegó con un bate de juguete a", "se dio un golpecito en la cabeza."],
      ["le dio un bonk bien merecido a", "se bonkeó por portarse mal."],
    ],
    disenos: ["(ง •̀_•́)ง", "(｀へ´)", "(>_<)", "(✪ω✪)", "(•̀ᴗ•́)و ̑̑"],
  },
  cry: {
    frases: [
      ["está llorando por", "está llorando."],
      ["se puso a llorar frente a", "no puede parar de llorar."],
      ["lloró en el hombro de", "se echó a llorar en silencio."],
      ["se quebró en lágrimas por culpa de", "lloró a mares."],
    ],
    disenos: ["(╥﹏╥)", "(T_T)", "(；д；)", "(ㅇㅅㅇ❀)", "(∩︵∩)"],
  },
  cuddle: {
    frases: [
      ["se acurrucó con", "se acurrucó solo."],
      ["se hizo bolita junto a", "se envolvió en una manta calentita."],
      ["se pegó cariñosamente a", "se acurrucó con una almohada."],
      ["le pidió acurrucarse con", "buscó algo suave para acurrucarse."],
    ],
    disenos: ["(づ｡◕‿‿◕｡)づ", "૮(˶ᵔᵕᵔ˶)ა", "(⌒‿⌒)", "ʕ•́ᴥ•̀ʔっ", "(✿◡‿◡)"],
  },
  dance: {
    frases: [
      ["está bailando con", "está bailando solo."],
      ["sacó a bailar a", "se puso a bailar como nadie lo ve."],
      ["se lució bailando junto a", "bailó con mucho ritmo."],
      ["armó una fiesta de baile con", "movió el esqueleto sin parar."],
    ],
    disenos: ["♪(´▽｀)", "(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "┏(・o･)┛♪", "(*≧ω≦)", "(✯◕‿◕✯)"],
  },
  facepalm: {
    frases: [
      ["se llevó la mano a la cara por", "se llevó la mano a la cara, decepcionado."],
      ["no puede creer lo que hizo", "se dio un facepalm de la vergüenza."],
      ["suspiró y se tapó la cara por culpa de", "se cubrió la cara sin palabras."],
      ["se dio un facepalm mirando a", "se arrepintió de todo y se tapó la cara."],
    ],
    disenos: ["(－‸ლ)", "(¬_¬)", "(눈_눈)", "( ˘︹˘ )", "(；一_一)"],
  },
  feed: {
    frases: [
      ["le está dando de comer a", "está comiendo solo."],
      ["le dio la comida en la boca a", "se preparó un banquete."],
      ["le ofreció un bocadillo a", "se dio un gustito comiendo."],
      ["alimentó con cariño a", "comió hasta quedar satisfecho."],
    ],
    disenos: ["(っ˘ڡ˘ς)", "(✿◡‿◡)", "(⌒‿⌒)", "૮(˶ᵔᵕᵔ˶)ა", "(✧ω◕)"],
  },
  handhold: {
    frases: [
      ["le tomó la mano a", "juntó las manos a solas."],
      ["entrelazó sus dedos con los de", "se dio la mano a sí mismo."],
      ["agarró la mano de", "se agarró la mano para darse ánimos."],
      ["caminó de la mano con", "buscó una mano que tomar."],
    ],
    disenos: ["(づ｡◕‿‿◕｡)づ", "(⌒‿⌒)", "૮(˶ᵔᵕᵔ˶)ა", "(✿◡‿◡)", "˃͈◡˂͈"],
  },
  happy: {
    frases: [
      ["está feliz junto a", "está muy feliz."],
      ["se siente radiante con", "no puede ocultar su felicidad."],
      ["sonríe de pura alegría por", "está saltando de felicidad."],
      ["contagió su felicidad a", "está de muy buen humor."],
    ],
    disenos: ["(◠‿◠)", "(*≧ω≦)", "(✿◡‿◡)", "٩(◕‿◕｡)۶", "(✯◕‿◕✯)"],
  },
  highfive: {
    frases: [
      ["chocó los cinco con", "se chocó los cinco solo."],
      ["le dio un high five épico a", "se chocó los cinco frente al espejo."],
      ["celebró chocando la mano con", "chocó los cinco con el aire."],
      ["selló el trato con un choque de manos con", "se felicitó con un high five."],
    ],
    disenos: ["(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "(•̀ᴗ•́)و ̑̑", "(✧ω✧)", "(*≧ω≦)", "٩(◕‿◕｡)۶"],
  },
  hug: {
    frases: [
      ["le dio un abrazo a", "se abrazó a sí mismo."],
      ["abrazó muy fuerte a", "se dio un abrazo para darse ánimos."],
      ["corrió a abrazar a", "se abrazó con mucho cariño."],
      ["envolvió en un cálido abrazo a", "se abrazó pensando en cosas bonitas."],
    ],
    disenos: ["(づ｡◕‿‿◕｡)づ", "(⊃｡•́‿•̀｡)⊃", "૮(˶ᵔᵕᵔ˶)ა", "(つ≧▽≦)つ", "ʕ•́ᴥ•̀ʔっ"],
  },
  kick: {
    frases: [
      ["le dio una patada a", "pateó el aire sin motivo."],
      ["pateó sin piedad a", "se tropezó y se pateó solo."],
      ["le encajó una patada voladora a", "practicó una patada al aire."],
      ["sacó el pie y le pegó a", "pateó una piedra con rabia."],
    ],
    disenos: ["(ง •̀_•́)ง", "(｀へ´)", "(>_<)", "(✪ω✪)", "(•̀ᴗ•́)و ̑̑"],
  },
  laugh: {
    frases: [
      ["se está riendo con", "se está riendo solo."],
      ["se burla de", "se ríe de algo que nadie entiende."],
      ["no puede parar de reírse de", "se muere de risa."],
      ["estalló en carcajadas por", "se ríe a carcajadas."],
    ],
    disenos: ["(≧▽≦)", "(*≧ω≦)", "(✧ω✧)", "(¬‿¬)", "(＾▽＾)"],
  },
  lurk: {
    frases: [
      ["está acechando en las sombras cerca de", "está acechando en las sombras."],
      ["se escondió detrás de un arbusto para espiar a", "se escondió en la oscuridad."],
      ["observa en silencio a", "está al acecho sin hacer ruido."],
      ["se asoma sigilosamente para ver a", "se camufló con el entorno."],
    ],
    disenos: ["(¬‿¬)", "(⌒_⌒;)", "(ㅇㅅㅇ❀)", "(꒪⌓꒪)", "ʕ•́ᴥ•̀ʔっ"],
  },
  nod: {
    frases: [
      ["asintió mirando a", "asintió con la cabeza."],
      ["está de acuerdo con", "asiente convencido."],
      ["movió la cabeza en señal de aprobación a", "asintió en silencio."],
      ["le dio la razón a", "se dio la razón a sí mismo."],
    ],
    disenos: ["(•̀ᴗ•́)و ̑̑", "(◠‿◠)", "(⌒‿⌒)", "(✿◡‿◡)", "(✧ω✧)"],
  },
  nom: {
    frases: [
      ["le está comiendo la mejilla a", "está comiendo algo rico."],
      ["le dio un mordisquito en la mejilla a", "se dio un festín."],
      ["se puso a mordisquear a", "comió con muchas ganas."],
      ["probó la mejilla de", "devoró su comida favorita."],
    ],
    disenos: ["(っ˘ڡ˘ς)", "(✧ω◕)", "(*≧ω≦)", "(◠‿◠)", "˃͈◡˂͈"],
  },
  nope: {
    frases: [
      ['le dijo "¡No!" a', "expresa claramente su desacuerdo."],
      ["rechazó rotundamente a", "dijo que no con la cabeza."],
      ["se negó a hacerle caso a", "se negó a todo."],
      ["le puso un límite a", "dijo nope y se fue."],
    ],
    disenos: ["(¬_¬)", "(눈_눈)", "( ˘︹˘ )", "(；一_一)", "(｀へ´)"],
  },
  pat: {
    frases: [
      ["le dio unas palmaditas a", "se acarició la cabeza."],
      ["acarició con ternura a", "se dio palmaditas de ánimo."],
      ["le despeinó con cariño a", "se consoló con una caricia."],
      ["le dio un patpat a", "se mimó un poquito."],
    ],
    disenos: ["(◠‿◠)", "૮(˶ᵔᵕᵔ˶)ა", "(✿◡‿◡)", "(⌒‿⌒)", "ʕ•́ᴥ•̀ʔっ"],
  },
  peck: {
    frases: [
      ["le dio un piquito a", "mandó un beso rápido al aire."],
      ["le robó un piquito a", "se dio un piquito frente al espejo."],
      ["le plantó un piquito sorpresa a", "lanzó un piquito al viento."],
      ["se acercó y le dio un piquito a", "mandó un piquito al aire."],
    ],
    disenos: ["(˘³˘)♥", "(⌒‿⌒)", "(✿◡‿◡)", "૮(˶ᵔᵕᵔ˶)ა", "(*≧ω≦)"],
  },
  poke: {
    frases: [
      ["le picó el hombro a", "se picó a sí mismo."],
      ["le dio un toquecito en la mejilla a", "se picó la mejilla por aburrimiento."],
      ["no deja de picar a", "se picó para ver si dolía."],
      ["quiere llamar la atención de", "se dio un toquecito."],
    ],
    disenos: ["(¬‿¬)", "(✧ω✧)", "(・ω・)", "(꒪⌓꒪)", "(˘ω˘)"],
  },
  pout: {
    frases: [
      ["le hizo pucheros a", "está haciendo pucheros."],
      ["infló los cachetes frente a", "infló los cachetes de enojo."],
      ["se puso de mal humor por culpa de", "se cruzó de brazos haciendo pucheros."],
      ["miró con carita de puchero a", "puso su mejor cara de puchero."],
    ],
    disenos: ["(´• ω •`)", "(；′⌒`)", "( ˘︹˘ )", "(ㅇㅅㅇ❀)", "(¬_¬)"],
  },
  punch: {
    frases: [
      ["le dio un puñetazo a", "lanzó un puñetazo al aire."],
      ["le soltó un golpe directo a", "practicó boxeo contra el viento."],
      ["noqueó de un puñetazo a", "se golpeó la palma con el puño."],
      ["le pegó con todas sus fuerzas a", "golpeó la pared sin querer."],
    ],
    disenos: ["(ง •̀_•́)ง", "(｀へ´)", "(>_<)", "(✪ω✪)", "(•̀ᴗ•́)و ̑̑"],
  },
  shoot: {
    frases: [
      ["le apuntó y disparó a", "disparó al aire."],
      ["le lanzó un disparo de mentira a", "se hizo el vaquero y disparó al aire."],
      ["no falló el tiro contra", "practicó puntería disparando al cielo."],
      ["sacó su pistola de juguete y le apuntó a", "disparó a la nada."],
    ],
    disenos: ["(¬‿¬)", "(•̀ᴗ•́)و ̑̑", "(✪ω✪)", "(ง •̀_•́)ง", "(｀へ´)"],
  },
  shrug: {
    frases: [
      ["se encogió de hombros mirando a", "se encogió de hombros."],
      ["no tiene idea de lo que dice", "dijo «ni idea» y se encogió de hombros."],
      ["le respondió con un «bah» a", "se encogió de hombros sin ganas."],
      ["le da igual lo que hace", "se quedó sin respuestas."],
    ],
    disenos: ["¯\\_(ツ)_/¯", "(¬_¬)", "(・_・;)", "( ˘︹˘ )", "(⌒_⌒;)"],
  },
  slap: {
    frases: [
      ["le dio una bofetada a", "se dio una bofetada a sí mismo."],
      ["le cruzó la cara de una cachetada a", "se dio una cachetada para despertar."],
      ["le soltó una bofetada sonora a", "se abofeteó por haber hecho algo malo."],
      ["le estampó la mano en la cara a", "se dio una bofetada de la vergüenza."],
    ],
    disenos: ["(ง •̀_•́)ง", "(｀へ´)", "(>_<)", "(✪ω✪)", "(╬ Ò﹏Ó)"],
  },
  sleep: {
    frases: [
      ["se durmió junto a", "está durmiendo plácidamente."],
      ["se quedó dormido en el hombro de", "se quedó dormido en medio de la nada."],
      ["roncó al lado de", "está soñando con algo bonito."],
      ["se acurrucó a dormir con", "cayó rendido en la cama."],
    ],
    disenos: ["(－ω－) zzZ", "(｡-ω-)zzz", "(-.-)Zzz…", "૮(˶ᵔᵕᵔ˶)ა", "(˘ω˘)"],
  },
  smile: {
    frases: [
      ["le sonrió a", "está sonriendo."],
      ["le regaló una sonrisa a", "sonríe sin razón."],
      ["iluminó el día de", "sonrió de oreja a oreja."],
      ["no pudo evitar sonreírle a", "sonríe feliz de la vida."],
    ],
    disenos: ["(◠‿◠)", "(⌒‿⌒)", "(✿◡‿◡)", "˃͈◡˂͈", "(✯◕‿◕✯)"],
  },
  smug: {
    frases: [
      ["puso cara de superioridad frente a", "puso cara de superioridad."],
      ["se las da de sabelotodo con", "está presumiendo mucho últimamente."],
      ["miró por encima del hombro a", "sonrió con aire de autosuficiencia."],
      ["le restregó su victoria a", "se siente el rey del mundo."],
    ],
    disenos: ["(¬‿¬)", "(￢‿￢)", "(✧ω◕)", "(◕‿↼)", "( ͡° ͜ʖ ͡°)"],
  },
  stare: {
    frases: [
      ["se quedó mirando fijamente a", "se quedó mirando al techo sin razón."],
      ["no le quita los ojos de encima a", "se perdió mirando la nada."],
      ["observa sin parpadear a", "miró fijamente al horizonte."],
      ["clavó la mirada en", "se quedó con la mirada perdida."],
    ],
    disenos: ["(ㅇㅅㅇ❀)", "(꒪⌓꒪)", "(¬_¬)", "(•_•)", "(◉_◉)"],
  },
  think: {
    frases: [
      ["está pensando profundamente en", "se quedó pensando muy intensamente."],
      ["no puede dejar de pensar en", "se perdió en sus pensamientos."],
      ["se quedó reflexionando sobre", "está dándole vueltas a algo."],
      ["analiza cada movimiento de", "pensó tanto que le salió humo de la cabeza."],
    ],
    disenos: ["(・_・?)", "(¬_¬)", "(⌒_⌒;)", "(・ω・)", "( ˘︹˘ )"],
  },
  thumbsup: {
    frases: [
      ["le dio el visto bueno a", "dio el visto bueno."],
      ["levantó el pulgar en señal de aprobación a", "se aprobó a sí mismo con un pulgar."],
      ["le dijo «así se hace» a", "aprueba todo lo que ve."],
      ["felicitó con un pulgar arriba a", "levantó el pulgar sonriendo."],
    ],
    disenos: ["(•̀ᴗ•́)و ̑̑", "(b^‿^)b", "(◠‿◠)", "(✧ω✧)", "(⌒‿⌒)"],
  },
  tickle: {
    frases: [
      ["le está haciendo cosquillas a", "se está haciendo cosquillas."],
      ["atacó con cosquillas a", "se rió de sus propias cosquillas."],
      ["no le da tregua con las cosquillas a", "se hizo cosquillas en los pies."],
      ["encontró el punto débil de", "se sacudió de cosquillas."],
    ],
    disenos: ["(≧▽≦)", "(*≧ω≦)", "(✧ω✧)", "(＾▽＾)", "(¬‿¬)"],
  },
  wave: {
    frases: [
      ["está saludando a", "se saludó a sí mismo."],
      ["le mandó un saludo desde lejos a", "saludó al aire con la mano."],
      ["agitó la mano para saludar a", "se saludó frente al espejo."],
      ["le dijo «¡hola!» a", "saludó a todo el mundo."],
    ],
    disenos: ["(ﾉ◕ヮ◕)ﾉ", "(◠‿◠)", "(✿◡‿◡)", "(*≧ω≦)", "٩(◕‿◕｡)۶"],
  },
  wink: {
    frases: [
      ["le guiñó el ojo a", "se guiñó a sí mismo en el espejo."],
      ["le lanzó un guiño coqueto a", "guiñó el ojo al vacío."],
      ["le hizo un guiño cómplice a", "se guiñó con picardía."],
      ["le guiñó con picardía a", "se hizo un guiño de buena suerte."],
    ],
    disenos: ["(^_−)☆", "(¬‿¬)", "(✧ω✧)", "(˘‿˘)", "(^_~)"],
  },
};

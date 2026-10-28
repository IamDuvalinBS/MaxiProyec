// Fuentes de GIFs por reacción. La clave es el apiAction de cada comando.
// Cada fuente es [proveedor, categoría]; se prueban en orden hasta que una funcione:
//   "nekos"    -> https://nekos.best/api/v2/<categoría>
//   "gifukai"  -> https://api.gifukai.com/v1/<categoría>   (gratis, sin key)
//   "otaku"    -> https://api.otakugifs.xyz/gif?reaction=<categoría>
//   "waifu"    -> https://api.waifu.pics/sfw/<categoría>
//   "aflb"     -> paquete npm "aflb" (opcional, trae GIFs de sing/smoke/drink/etc.)
// Además, el motor SIEMPRE agrega al final ["gifukai", <clave>] como último intento.
// Si una fuente falla o la categoría no existe, pasa sola a la siguiente.
// `false` = esta reacción no usa APIs (solo assets/reacciones/<clave>/ o texto).
// (killall usa los GIFs de "kill".)
// Si una clave no aparece acá, el motor usa nekos.best con el mismo nombre.
// Tus propios GIFs/mp4 en assets/reacciones/<clave>/ tienen prioridad sobre las APIs.

export const FUENTES = {
  angry: [["nekos", "angry"], ["gifukai", "angry"], ["otaku", "mad"], ["aflb", "angry"]],
  bleh: [["otaku", "bleh"], ["gifukai", "bleh"]],
  bored: [["nekos", "bored"], ["gifukai", "bored"], ["otaku", "tired"], ["aflb", "bored"]],
  clap: [["nekos", "clap"], ["gifukai", "clap"], ["otaku", "clap"], ["aflb", "clap"]],
  coffee: [["nekos", "sip"], ["otaku", "sip"], ["gifukai", "coffee"]],
  dramatic: [["otaku", "sigh"], ["gifukai", "dramatic"]],
  drunk: [["aflb", "drink"], ["gifukai", "drunk"]],
  eat: [["nekos", "nom"], ["gifukai", "eat"]],
  heat: [["otaku", "sweat"], ["gifukai", "heat"]],
  jump: [["otaku", "yay"], ["waifu", "happy"], ["gifukai", "jump"]],
  lewd: [["nekos", "smug"]],
  lick: [["otaku", "lick"], ["waifu", "lick"], ["gifukai", "lick"], ["aflb", "lick"]],
  love: [["otaku", "love"], ["gifukai", "love"], ["aflb", "love"]],
  psycho: [["otaku", "evillaugh"], ["gifukai", "psycho"]],
  push: [["nekos", "yeet"], ["gifukai", "push"]],
  run: [["nekos", "run"], ["gifukai", "run"], ["otaku", "run"], ["aflb", "run"]],
  sad: [["otaku", "sad"], ["gifukai", "sad"], ["nekos", "cry"]],
  scared: [["otaku", "scared"], ["gifukai", "scared"], ["aflb", "scared"]],
  scream: [["otaku", "woah"], ["nekos", "shocked"], ["gifukai", "scream"]],
  seduce: [["nekos", "wink"], ["waifu", "wink"]],
  shy: [["otaku", "shy"], ["gifukai", "shy"]],
  sing: [["gifukai", "sing"], ["aflb", "sing"]],
  smoke: [["gifukai", "smoke"], ["aflb", "smoke"]],
  step: [["nekos", "kick"]],
  tea: [["nekos", "sip"], ["otaku", "sip"], ["gifukai", "tea"]],
  cookie: [["nekos", "nom"], ["gifukai", "cookie"]],
  killall: [["gifukai", "kill"], ["aflb", "kill"]],
  yawn: [["nekos", "yawn"], ["otaku", "yawn"]],
  celebrate: [["otaku", "celebrate"], ["otaku", "yay"]],
  sigh: [["otaku", "sigh"]],
  cringe: [["waifu", "cringe"], ["aflb", "cringe"]],
  surprised: [["nekos", "shocked"], ["otaku", "surprised"], ["otaku", "woah"]],
};

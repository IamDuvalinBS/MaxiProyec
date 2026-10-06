export default {
  names: [".pruebacolor"],
  desc: "Prueba de formato de texto especial",
  category: "Utilidad",
  handler: async ({ reply }) => {
    const texto = [
      "Hola *Fer*, aquí está la información de *`IcAl`🌴* ₍ᐢ..ᐢ₎",
      "",
      "━ׁ┉ׅ─ׁ┉ׅ─ׁ─ׁ─ׁ┉ׅ─ׁ─ׁ┉ׅ─˳ּ𑁍 ┉ׁ─ׅ─ׁ┉ׅ─ׁ─ׁ┉ׅ─ׁ─ׅ┉ׁ━ִ",
      "",
      "*==𑁍 INFORMACIÓN DEL BOT 𑁍==*",
      "",
      "> ׄ⏤͟͟͞͞✩ *Nombre* › *`IcAl`🌴*",
      "> ☄︎ *Prefijo* › *`.`*"
    ].join("\n");
    await reply({ text: texto });
  }
};

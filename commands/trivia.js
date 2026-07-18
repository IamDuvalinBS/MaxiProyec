import { setPendingTrivia, checkCooldown, formatTime, box } from "../core.js";

const preguntas = [
  { q: "¿Cuál es el planeta más grande del sistema solar?", opciones: ["Marte", "Júpiter", "Saturno", "Tierra"], correcta: "B" },
  { q: "¿En qué año llegó el hombre a la Luna?", opciones: ["1965", "1969", "1972", "1959"], correcta: "B" },
  { q: "¿Cuál es el océano más grande del mundo?", opciones: ["Atlántico", "Índico", "Pacífico", "Ártico"], correcta: "C" },
  { q: "¿Cuántos huesos tiene el cuerpo humano adulto?", opciones: ["186", "206", "220", "250"], correcta: "B" },
  { q: "¿Qué gas respiramos principalmente para vivir?", opciones: ["Oxígeno", "Hidrógeno", "Nitrógeno", "Dióxido de carbono"], correcta: "A" },
  { q: "¿Cuál es el país más grande del mundo por territorio?", opciones: ["China", "Canadá", "Rusia", "Brasil"], correcta: "C" }
];

export default {
  names: [".trivia", ".encuesta"],
  desc: "Responde correctamente y ganá plata (30 seg para responder)",
  category: "Economía",
  handler: async ({ sock, from, sender, msg, reply }) => {
    const wait = checkCooldown(sender, "trivia", 5 * 60 * 1000);
    if (wait > 0) return reply({ text: `⏳ Ya hiciste una trivia. Esperá *${formatTime(wait)}*.` });

    const pregunta = preguntas[Math.floor(Math.random() * preguntas.length)];
    const reward = Math.floor(Math.random() * 100) + 100;
    const letras = ["A", "B", "C", "D"];

    setPendingTrivia(sender, {
      correcta: pregunta.correcta,
      reward,
      expira: Date.now() + 30 * 1000
    });

    const lineas = pregunta.opciones.map((op, i) => `${letras[i]}. ${op}`);
    lineas.push("");
    lineas.push("Respondé con la letra (A, B, C o D). Tenés 30 segundos.");

    await reply({ text: box("🧠 TRIVIA — " + pregunta.q, lineas) });
  }
};

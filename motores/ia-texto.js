import { pedirJson } from "./herramientas-red.js";

// Orden de proveedores (usa el primero que tenga clave):
//   1) GEMINI_API_KEY            (gratis en aistudio.google.com) · modelo con GEMINI_MODEL
//   2) IA_URL + IA_KEY + IA_MODEL (cualquier API compatible con OpenAI: Groq, OpenRouter, DeepSeek...)
//   3) Pollinations, sin clave (calidad y disponibilidad variables)
export function proveedorIA() {
  const e = process.env;
  if (e.GEMINI_API_KEY) return "gemini";
  if (e.IA_URL && e.IA_KEY && e.IA_MODEL) return "openai";
  return "pollinations";
}

function extraerGemini(d) {
  const partes = d?.candidates?.[0]?.content?.parts || [];
  return partes.map((p) => p.text || "").join("");
}

export async function generarTexto({ sistema, usuario, maxTokens = 16000, espera = 150000, temperatura = 0.7 }) {
  const e = process.env;
  const prov = proveedorIA();

  if (prov === "gemini") {
    const modelo = e.GEMINI_MODEL || "gemini-2.5-flash";
    const d = await pedirJson(
      "https://generativelanguage.googleapis.com/v1beta/models/" + modelo + ":generateContent?key=" + encodeURIComponent(e.GEMINI_API_KEY),
      {
        metodo: "POST",
        espera,
        cuerpo: {
          systemInstruction: { parts: [{ text: sistema }] },
          contents: [{ role: "user", parts: [{ text: usuario }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: temperatura }
        }
      }
    );
    const t = extraerGemini(d);
    if (!t.trim()) throw new Error("la IA no devolvió texto" + (d?.promptFeedback?.blockReason ? " (" + d.promptFeedback.blockReason + ")" : ""));
    return t;
  }

  const mensajes = [
    { role: "system", content: sistema },
    { role: "user", content: usuario }
  ];
  if (prov === "openai") {
    const d = await pedirJson(e.IA_URL.replace(/\/+$/, "") + "/chat/completions", {
      metodo: "POST",
      espera,
      cabeceras: { Authorization: "Bearer " + e.IA_KEY },
      cuerpo: { model: e.IA_MODEL, messages: mensajes, max_tokens: maxTokens, temperature: temperatura }
    });
    const t = d?.choices?.[0]?.message?.content || "";
    if (!t.trim()) throw new Error("la IA no devolvió texto");
    return t;
  }

  const d = await pedirJson("https://text.pollinations.ai/openai", {
    metodo: "POST",
    espera,
    cuerpo: { model: "openai", messages: mensajes, temperature: temperatura }
  });
  const t = d?.choices?.[0]?.message?.content || "";
  if (!t.trim()) throw new Error("la IA no devolvió texto");
  return t;
}

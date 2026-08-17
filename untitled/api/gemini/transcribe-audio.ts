import { GoogleGenAI } from "@google/genai";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rawTranscription, inspectorAudioNotes, elementContext } = req.body || {};

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        structuredNote: rawTranscription || "Nota de campo registrada por el inspector.",
        technicalClassification: "Observación de campo sobre " + (elementContext?.elementType || "elemento"),
        suggestedActions: [
          "Verificar con fisurómetro calibrado",
          "Fotografiar con escala de referencia"
        ]
      });
    }

    const prompt = `Actúa como redactor técnico de ingeniería civil. Convierte el siguiente dictado o transcripción de voz informal de un inspector en una nota técnica profesional, concisa y estandarizada para el informe de patología estructural.

Texto de entrada del inspector:
"${rawTranscription || inspectorAudioNotes || "Fisura inclinada en columna del primer piso cerca de la unión con la viga, se ve concreto desprendido"}"

Contexto:
- Elemento: ${elementContext?.elementType || "No especificado"}
- Piso: ${elementContext?.floor || "No especificado"}

Genera en JSON:
{
  "structuredNote": "Nota técnica formal y redactada con precisión de ingeniería",
  "technicalClassification": "Término patológico estandarizado (ej: Fisura diagonal por cortante en zona de confinamiento)",
  "suggestedActions": ["Acción 1", "Acción 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Error structuring audio note:", error);
    return res.status(500).json({ error: error?.message || "Error procesando nota de voz" });
  }
}

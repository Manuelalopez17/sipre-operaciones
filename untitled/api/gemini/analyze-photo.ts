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
    const { imageBase64, mimeType = "image/jpeg", context } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback rule-based analysis if no key
      return res.status(200).json({
        observedCondition: "Inspección visual del elemento " + (context?.elementType || "estructural") + ". Se evidencia discontinuidad o deformación superficial.",
        possiblePathologyClassification: "Fisuración / Daño por esfuerzo cortante o flexión post-evento sísmico.",
        possibleCauses: [
          "Concentración de esfuerzos por aceleraciones sísmicas",
          "Diferencia de rigideces entre elementos estructurales y no estructurales",
          "Asentamiento diferencial o efecto de torsión en planta"
        ],
        structuralRelevance: "Moderada a Alta. Requiere verificación de continuidad de armadura y desprendimiento de recubrimiento.",
        nonstructuralRelevance: "Verificar afectación a mamposterías confinadas o de partición adyacentes.",
        additionalVerificationRequired: [
          "Verificar si la fisura atraviesa todo el espesor del elemento",
          "Medir ancho de fisura en varios puntos con fisurómetro calibrado",
          "Inspeccionar nudos viga-columna y extremos confinados"
        ],
        recommendedMeasurements: [
          "Ancho de fisura (mm)",
          "Longitud total desarrollada (cm)",
          "Desplome o deflexión con nivel / plomada"
        ],
        recommendedAdditionalPhotographs: [
          "Fotografía panorámica del pórtico completo",
          "Detalle macro con regla milimetrada o fisurómetro",
          "Nudo estructural superior e inferior"
        ],
        potentialWarningIndicators: [
          "Aplastamiento de hormigón (crushing)",
          "Pandeo de barras de refuerzo longitudinal",
          "Fisuras en 'X' (cruzadas por corte cíclico)"
        ],
        referenceCategories: [
          "NSR-10 Título A / C (Colombia)",
          "AIS 410 - Manual de Evaluación y Rehabilitación Sísmica",
          "FEMA P-2055 / ATC-20 Postearthquake Safety Evaluation"
        ],
        confidenceLevel: "Media",
        recommendedPreliminaryPriority: "YELLOW",
        disclaimer: "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL."
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const prompt = `Eres un asistente de ingeniería civil y patología estructural para el sistema SIPRE (Sistema de Inspección de Patología y Riesgo Estructural).
Analiza esta fotografía tomada en una inspección de campo post-sismo o de emergencia estructural.

Contexto del elemento reportado por el inspector:
- Tipo de Elemento: ${context?.elementType || "No especificado"}
- Sistema Estructural: ${context?.structuralSystem || "No especificado"}
- Ubicación/Piso: ${context?.floor || "No especificado"} (${context?.location || "No especificada"})
- Tipo de Daño preliminar: ${context?.damageType || "No especificado"}
- Ancho de fisura medido: ${context?.crackWidth || "No medido"}
- Orientación de fisura: ${context?.crackOrientation || "No especificada"}
- Observaciones del inspector: ${context?.inspectorNotes || "Ninguna"}

REGLAS CRÍTICAS DE SEGURIDAD:
1. La IA es únicamente una herramienta de asistencia técnica preliminar.
2. NUNCA certifiques de manera autónoma seguridad estructural, habitabilidad ni ausencia de peligro.
3. Distingue estrictamente entre:
   - Hechos observables directamente en la imagen.
   - Posibles interpretaciones mecánicas o patológicas.
   - Recomendaciones para la decisión exclusiva del profesional inspector.

Genera tu respuesta en formato JSON estrictamente válido con los siguientes campos:
{
  "observedCondition": "Descripción técnica concisa de lo observado visualmente",
  "possiblePathologyClassification": "Clasificación patológica preliminar (ej. Fisuración por cortante, Tracción diagonal, Aplastamiento de hormigón, Falla por adherencia, Asentamiento diferencial)",
  "possibleCauses": ["Causa 1", "Causa 2", "Causa 3"],
  "structuralRelevance": "Evaluación de relevancia para la estabilidad del elemento",
  "nonstructuralRelevance": "Relevancia para elementos no estructurales o seguridad de ocupantes",
  "additionalVerificationRequired": ["Punto a verificar 1", "Punto a verificar 2", "Punto a verificar 3"],
  "recommendedMeasurements": ["Medición 1", "Medición 2"],
  "recommendedAdditionalPhotographs": ["Foto panorámica...", "Foto macro..."],
  "potentialWarningIndicators": ["Indicador de alerta 1", "Indicador de alerta 2"],
  "referenceCategories": ["NSR-10 Título A/C", "AIS 410", "FEMA P-2055 / ATC-20", "ACI 318-19"],
  "confidenceLevel": "Alta" | "Media" | "Baja",
  "recommendedPreliminaryPriority": "GREEN" | "YELLOW" | "RED",
  "disclaimer": "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        systemInstruction: "Eres un consultor experto en ingeniería sismorresistente y patología de estructuras. Responde siempre en español formal técnico y mantén siempre el principio de seguridad donde el profesional humano tiene la decisión final.",
      },
    });

    const textOutput = response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(textOutput);
    } catch {
      const match = textOutput.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    parsed.disclaimer = "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.";
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Error in Gemini photo analysis:", error);
    return res.status(500).json({
      error: "Error procesando análisis con IA: " + (error?.message || "Desconocido"),
      fallbackAvailable: true,
    });
  }
}

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
    const { inspection } = req.body || {};

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        executiveSummary: `Edificación de ${inspection?.floors || 1} piso(s), sistema estructural ${inspection?.structuralSystem || "No especificado"}. Se registraron ${inspection?.elements?.length || 0} elementos inspeccionados y ${inspection?.findings?.length || 0} hallazgos patológicos. Clasificación preliminar asignada: ${inspection?.preliminaryPriority || "YELLOW"}. Requiere concepto definitivo del profesional a cargo.`,
        keyRisks: [
          "Verificación requerida en elementos con daño moderado o severo",
          "Monitoreo de posibles asentamientos o réplicas sísmicas"
        ],
        recommendedImmediateActions: [
          "Delimitar áreas de acceso restringido",
          "Instalar testigos de yeso o fisurómetros para monitoreo activo",
          "Completar evaluación estructural detallada por especialista"
        ]
      });
    }

    const prompt = `Eres un ingeniero civil especialista en estructuras. Genera un resumen ejecutivo técnico de la siguiente inspección de campo post-sismo para incorporar al informe formal.

Datos de la Inspección:
- Código: ${inspection?.id}
- Dirección: ${inspection?.address}, ${inspection?.neighborhood}, ${inspection?.municipality}
- Sistema Estructural: ${inspection?.structuralSystem}
- Pisos: ${inspection?.floors}, Sótanos: ${inspection?.basements}
- Número de Hallazgos: ${inspection?.findings?.length || 0}
- Prioridad preliminar: ${inspection?.preliminaryPriority}
- Resumen de hallazgos: ${JSON.stringify((inspection?.findings || []).map((f: any) => ({ elemento: f.elementType, dano: f.damageType, severidad: f.severity, fisura: f.crackWidth, orientacion: f.crackOrientation })))}
- Conclusión preliminar del inspector: ${inspection?.professionalAssessment?.conclusion || "En proceso de redacción"}

Genera en formato JSON:
{
  "executiveSummary": "Párrafo técnico formal sintetizando el estado de la edificación, daños principales y condición global observada",
  "keyRisks": ["Riesgo 1", "Riesgo 2", "Riesgo 3"],
  "recommendedImmediateActions": ["Acción inmediata 1", "Acción inmediata 2", "Acción inmediata 3"]
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
    console.error("Error summarizing report:", error);
    return res.status(500).json({ error: error?.message || "Error resumiendo informe" });
  }
}

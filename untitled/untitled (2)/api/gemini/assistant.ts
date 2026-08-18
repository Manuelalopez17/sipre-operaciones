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
    const { action, query, inspectionData, findingData } = req.body || {};

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(200).json({
        result: `[MODO OFFLINE/PRELIMINAR]\nAcción: ${action || "Consulta Técnica"}\n\nRecomendaciones estándar de ingeniería post-sismo (AIS 410 / NSR-10 / FEMA ATC-20):\n- Verifique la continuidad de la trayectoria de cargas verticales y laterales.\n- Mida el ancho y profundidad de grietas con fisurómetro calibrado.\n- Inspeccione nudos viga-columna, apoyos de viga y bases de columnas en busca de trituración de concreto o pandeo de varillas.\n- Delimite zonas con riesgo de desprendimiento de mampostería o elementos de fachada.\n\nNOTA: ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.`,
        references: [
          {
            title: "Guía de Evaluación Post-Sísmica Rápida de Edificaciones",
            standard: "AIS 410 / NSR-10",
            section: "Capítulo 4 - Evaluación de Daño en Elementos Principales",
            year: "2020",
            relevantExcerpt: "Toda grieta diagonal con apertura superior a 1.0 mm en columnas o nudos requiere evaluación detallada y restricción preventiva de acceso."
          },
          {
            title: "Post-Earthquake Safety Evaluation of Buildings",
            standard: "FEMA P-2055 / ATC-20",
            section: "Posting Procedures (Green, Yellow, Red)",
            year: "2019",
            relevantExcerpt: "A Red placard indicates unsafe condition. Yellow indicates restricted use requiring secondary structural assessment."
          }
        ]
      });
    }

    const systemInstruction = `Eres el asistente de ingeniería de campo SIPRE para inspección estructural y patología post-sismo.
Actúa como un colega técnico riguroso basado en normas oficiales:
- Reglamento Colombiano de Construcción Sismo Resistente (NSR-10)
- Asociación Colombiana de Ingeniería Sísmica (AIS 410, AIS 100)
- FEMA P-2055 / FEMA 154 / ATC-20 (Post-Earthquake Safety Evaluation of Buildings)
- ACI 318 / ACI 562 (Assessment, Repair, and Rehabilitation of Existing Concrete Structures)
- ASCE 41 (Seismic Evaluation and Retrofit of Existing Buildings)

REGLAS ABSOLUTAS:
1. NUNCA certifiques de forma autónoma estabilidad, seguridad o habitabilidad.
2. Todas tus recomendaciones son preliminares y deben requerir confirmación por un profesional matriculado.
3. Responde con lenguaje técnico de ingeniería civil claro, directo y estructurado.
4. Siempre incluye al final: "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL."`;

    let prompt = `Acción solicitada: ${action || "Consulta Técnica"}\n`;
    if (query) prompt += `Pregunta o consulta del inspector: ${query}\n`;

    if (inspectionData) {
      prompt += `\nDatos de la edificación inspeccionada:
- Identificación: ${inspectionData.id || "N/A"}
- Uso: ${inspectionData.buildingUse || "Residencial"}
- Sistema estructural: ${inspectionData.structuralSystem || "No especificado"}
- Pisos: ${inspectionData.floors || 1}, Sótanos: ${inspectionData.basements || 0}
- Daños previos: ${inspectionData.previousDamage || "Ninguno"}
- Total de hallazgos registrados: ${inspectionData.findingsCount || 0}
`;
    }

    if (findingData) {
      prompt += `\nDatos del hallazgo seleccionado:
- Elemento: ${findingData.elementType} (${findingData.location}, Piso ${findingData.floor})
- Tipo de daño: ${findingData.damageType}
- Severidad estimada: ${findingData.severity}
- Medidas/Fisuras: ${findingData.crackWidth || "N/A"}, Orientación: ${findingData.crackOrientation || "N/A"}
- Descripción del inspector: ${findingData.description || "N/A"}
`;
    }

    prompt += `\nPor favor genera:
1. Análisis técnico del caso conforme a la acción solicitada.
2. Lista concreta de verificaciones adicionales o mediciones en campo.
3. Recomendaciones preliminares de seguridad / estabilización temporal si aplica.
4. Referencias técnicas aprobadas aplicables (NSR-10, AIS 410, FEMA, ACI).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const result = response.text || "No se pudo generar respuesta del asistente.";

    return res.status(200).json({
      result,
      disclaimer: "ANÁLISIS PRELIMINAR ASISTIDO POR IA. REQUIERE VERIFICACIÓN DE UN PROFESIONAL.",
      references: [
        {
          title: "Manual de Evaluación Post-Sísmica de Edificaciones",
          standard: "AIS 410 / NSR-10",
          section: "Evaluación Detallada de Daños y Triaje Estructural",
          year: "2020",
          relevantExcerpt: "Identificación de mecanismos de falla frágil (corte, pérdida de confinamiento, adherencia) versus mecanismos dúctiles (fluencia por flexión)."
        },
        {
          title: "Post-Earthquake Safety Evaluation of Buildings",
          standard: "ATC-20 / FEMA P-2055",
          section: "Chapter 3: Detailed Evaluation Procedures",
          year: "2019",
          relevantExcerpt: "Guidance on classification of structural damage in RC frames, shear walls, and unreinforced masonry."
        },
        {
          title: "Code Requirements for Assessment, Repair, and Rehabilitation of Existing Concrete Structures",
          standard: "ACI 562-21",
          section: "Section 6: Structural Evaluation",
          year: "2021",
          relevantExcerpt: "Evaluation of crack significance based on orientation, width, active movement, and environment exposure."
        }
      ]
    });
  } catch (error: any) {
    console.error("Error in Gemini assistant:", error);
    return res.status(500).json({
      error: "Error en el asistente IA: " + (error?.message || "Desconocido"),
    });
  }
}
